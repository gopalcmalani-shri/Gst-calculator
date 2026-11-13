// HisabKitab Form 26AS Downloader – background service worker.
//
// It is the ONLY writer of the job state in chrome.storage.local, so the
// content scripts (portal tab, TRACES tab) and the popup never race each
// other. Everyone else sends messages; this file applies them in order.

const LOGIN_URL = "https://eportal.incometax.gov.in/iec/foservices/#/login";

// ---------------------------------------------------------------- job state

let queue = Promise.resolve();
function serial(fn) {
  const p = queue.then(fn, fn);
  queue = p.catch(() => {});
  return p;
}

async function getJob() {
  return (await chrome.storage.local.get("job")).job || null;
}

async function setJob(job) {
  await chrome.storage.local.set({ job });
  updateBadge(job);
  return job;
}

function addLog(job, msg, level = "info") {
  job.log = job.log || [];
  job.log.push({ t: Date.now(), msg, level });
  if (job.log.length > 200) job.log = job.log.slice(-200);
}

function updateBadge(job) {
  if (!job || job.status !== "running") {
    chrome.action.setBadgeText({ text: job && job.status === "done" ? "✓" : "" });
    chrome.action.setBadgeBackgroundColor({ color: "#2E7D32" });
    return;
  }
  const done = job.tasks.filter((t) => t.done).length;
  chrome.action.setBadgeText({ text: `${done}/${job.tasks.length}` });
  chrome.action.setBadgeBackgroundColor({ color: "#5B2D8E" });
}

// ---------------------------------------------------------------- helpers

function safe(s) {
  return String(s || "").replace(/[^A-Za-z0-9_.-]+/g, "_");
}

function folderFor(job) {
  return `HisabKitab-26AS/${safe(job.pan || "PAN")}`;
}

function baseName(job, ay) {
  return `26AS_${safe(job.pan || "PAN")}_AY${safe(ay)}`;
}

function textToDataUrl(text, mime) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return `data:${mime};base64,${btoa(bin)}`;
}

// ---------------------------------------------------------------- HisabKitab upload

async function uploadToHisabKitab(job, ay, filename, html) {
  const { settings } = await chrome.storage.local.get("settings");
  if (!settings || !settings.apiUrl) return { skipped: true };

  const form = new FormData();
  form.append("pan", job.pan || "");
  form.append("assessment_year", ay);
  form.append("source", "traces-26as-html");
  form.append("file", new Blob([html], { type: "text/html" }), filename);
  if (settings.companyId) form.append("company_id", settings.companyId);

  const headers = {};
  if (settings.apiToken) headers["Authorization"] = `Bearer ${settings.apiToken}`;

  const res = await fetch(settings.apiUrl, { method: "POST", body: form, headers });
  if (!res.ok) throw new Error(`HisabKitab returned HTTP ${res.status}`);
  return { ok: true };
}

// If Chrome's "Ask where to save each file" setting is on, every file waits
// in a Save As box (an extension can't turn that off or click it). Spot it
// and tell the user how to switch it off.
function checkSaveAsPrompt(id) {
  setTimeout(async () => {
    const [d] = await chrome.downloads.search({ id });
    if (d && d.state === "in_progress" && !d.filename) {
      await serial(async () => {
        const job = await getJob();
        if (!job || job.saveAsWarned) return;
        job.saveAsWarned = true;
        addLog(job, "Chrome is asking where to save each file. Turn off \"Ask where to save each file\" (button below) so files save by themselves.", "warn");
        await setJob(job);
      });
    }
  }, 4000);
}

// ---------------------------------------------------------------- messages

const handlers = {
  async startJob({ fys, pan, wantPdf, wantText }) {
    const tasks = [];
    for (const fy of fys) {
      const ay = fyToAy(fy);
      tasks.push({ ay, kind: "HTML", pdf: !!wantPdf, done: false });
      if (wantText) tasks.push({ ay, kind: "TEXT", done: false });
    }
    const job = {
      id: Date.now(),
      status: "running",
      stage: "login",
      pan: (pan || "").toUpperCase(),
      panFromUser: !!pan,
      tasks,
      i: 0,
      submitted: false,
      files: [],
      log: [],
      startedAt: Date.now(),
    };
    addLog(job, `Started: AY ${[...new Set(tasks.map((t) => t.ay))].join(", ")}`);
    await setJob(job);

    // Reuse an open portal tab if there is one, otherwise open the login page.
    const tabs = await chrome.tabs.query({ url: "*://eportal.incometax.gov.in/*" });
    if (tabs.length) {
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId, { focused: true });
      await chrome.tabs.sendMessage(tabs[0].id, { type: "kick" }).catch(() => {});
    } else {
      await chrome.tabs.create({ url: LOGIN_URL, active: true });
    }
    return job;
  },

  async cancelJob() {
    const job = await getJob();
    if (job && job.status === "running") {
      job.status = "cancelled";
      addLog(job, "Cancelled by user", "warn");
      await setJob(job);
    }
    return job;
  },

  async clearJob() {
    await chrome.storage.local.remove("job");
    updateBadge(null);
    return null;
  },

  async patch({ patch, log, level }) {
    const job = await getJob();
    if (!job) return null;
    Object.assign(job, patch || {});
    if (log) addLog(job, log, level);
    return setJob(job);
  },

  async log({ msg, level }) {
    const job = await getJob();
    if (!job) return null;
    addLog(job, msg, level);
    return setJob(job);
  },

  // Content script finished the current task. Moves to the next one.
  async taskDone({ index, note }) {
    const job = await getJob();
    if (!job || job.i !== index) return job;
    job.tasks[index].done = true;
    job.i = index + 1;
    job.submitted = false;
    if (note) addLog(job, note);
    if (job.i >= job.tasks.length) {
      job.status = "done";
      job.finishedAt = Date.now();
      addLog(job, "All done ✔");
    }
    return setJob(job);
  },

  async fail({ msg }) {
    const job = await getJob();
    if (!job) return null;
    job.status = "error";
    addLog(job, msg, "error");
    return setJob(job);
  },

  // Save the statement HTML (and upload it to HisabKitab if configured).
  async saveHtml({ ay, html, pan }) {
    const job = await getJob();
    if (!job) return null;
    if (pan && !job.panFromUser) job.pan = pan;

    const filename = `${folderFor(job)}/${baseName(job, ay)}.html`;
    const url = textToDataUrl(html, "text/html");
    ownNames.set(url, filename);
    const dlId = await chrome.downloads.download({
      url,
      filename,
      conflictAction: "overwrite",
      saveAs: false,
    });
    job.files.push({ ay, kind: "html", filename });
    checkSaveAsPrompt(dlId);
    addLog(job, `Saved ${filename.split("/").pop()}`);

    try {
      const r = await uploadToHisabKitab(job, ay, `${baseName(job, ay)}.html`, html);
      if (r.ok) addLog(job, `Sent AY ${ay} to HisabKitab`);
    } catch (e) {
      addLog(job, `Could not send to HisabKitab: ${e.message}`, "warn");
    }
    return setJob(job);
  },

  // The portal's pop-up to TRACES was blocked – open it as a normal tab.
  async openTab({ url }) {
    const u = new URL(url);
    if (u.protocol !== "https:" || !/(^|\.)tdscpc\.gov\.in$/i.test(u.hostname)) throw new Error("Not a TRACES address");
    const job = await getJob();
    if (!job || job.status !== "running") return job;
    await chrome.tabs.create({ url: u.href, active: true });
    addLog(job, "Opened TRACES (Chrome had blocked the pop-up)");
    return setJob(job);
  },

  // The TRACES tab is about to click a button that makes the browser
  // download a file (PDF export / Text zip). Remember what to name it.
  async expectDownload({ ay, kind }) {
    const job = await getJob();
    if (!job) return null;
    job.expect = { ay, kind, at: Date.now(), seen: false };
    return setJob(job);
  },
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const h = handlers[msg && msg.type];
  if (!h) return false;
  serial(() => h(msg))
    .then((r) => sendResponse({ ok: true, job: r }))
    .catch((e) => sendResponse({ ok: false, error: String(e && e.message || e) }));
  return true; // async response
});

// ---------------------------------------------------------------- TRACES downloads
//
// When the TRACES tab clicks "Export as PDF" / "View/Download (Text)", the
// browser downloads the file. onCreated tells the TRACES tab it started and
// remembers which AY/kind that download id belongs to; onDeterminingFilename
// then gives it a proper name. (Keyed by id, so a slow rename can never pick
// up the next year's name.)

const ownNames = new Map(); // data: URL → file name, for our own downloads
const FROM_TRACES = /tdscpc\.gov\.in/i;
const isFromTraces = (item) =>
  FROM_TRACES.test(`${item.url || ""} ${item.finalUrl || ""} ${item.referrer || ""}`);

chrome.downloads.onCreated.addListener((item) => {
  if (item.byExtensionId === chrome.runtime.id || !isFromTraces(item)) return;
  serial(async () => {
    const job = await getJob();
    const exp = job && job.expect;
    if (!job || job.status !== "running" || !exp || exp.seen || Date.now() - exp.at > 5 * 60_000) return;
    const ext = exp.kind === "TEXT" ? "zip" : "pdf";
    const filename = `${folderFor(job)}/${baseName(job, exp.ay)}.${ext}`;
    exp.seen = true;
    job.names = job.names || {};
    job.names[item.id] = filename;
    job.files.push({ ay: exp.ay, kind: ext, filename });
    addLog(job, `Saved ${filename.split("/").pop()}`);
    await setJob(job);
  });
});

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  // Our own files: Chrome drops the name given to downloads.download() when
  // this listener exists, so hand it back explicitly.
  if (item.byExtensionId === chrome.runtime.id) {
    const name = ownNames.get(item.url);
    ownNames.delete(item.url);
    suggest(name ? { filename: name, conflictAction: "overwrite" } : undefined);
    return;
  }
  if (!isFromTraces(item)) { suggest(); return; }
  serial(async () => {
    const job = await getJob();
    const planned = job && job.names && job.names[item.id];
    if (!planned) { suggest(); return; }
    // Keep TRACES' real extension if it differs (e.g. .txt instead of .zip)
    const orig = (item.filename.split(/[\\/]/).pop() || "").match(/\.([A-Za-z0-9]{2,4})$/);
    const filename = orig ? planned.replace(/\.[^.]+$/, `.${orig[1].toLowerCase()}`) : planned;
    suggest({ filename, conflictAction: "overwrite" });
  }).catch(() => suggest());
  return true; // suggest() is called asynchronously
});

// ---------------------------------------------------------------- utils

function fyToAy(fy) {
  const m = String(fy).trim().match(/^(\d{4})(?:\s*-\s*(\d{2}|\d{4}))?$/);
  if (!m) throw new Error(`Invalid financial year: ${fy}`);
  const s = Number(m[1]) + 1;
  return `${s}-${String(s + 1).slice(-2)}`;
}

chrome.runtime.onStartup.addListener(async () => updateBadge(await getJob()));
