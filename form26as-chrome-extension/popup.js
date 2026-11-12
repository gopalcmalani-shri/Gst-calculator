const $ = (id) => document.getElementById(id);

// --- Financial year choices: last 6 FYs, the previous FY ticked by default
function fyOptions() {
  const now = new Date();
  const curStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; // FY starts 1 April
  const list = [];
  for (let s = curStart; s > curStart - 6; s--) list.push(`${s}-${String(s + 1).slice(-2)}`);
  return { list, def: list[1] };
}

function renderFys() {
  const { list, def } = fyOptions();
  $("fyList").innerHTML = "";
  for (const fy of list) {
    const l = document.createElement("label");
    l.innerHTML = `<input type="checkbox" value="${fy}" ${fy === def ? "checked" : ""}> ${fy}`;
    $("fyList").appendChild(l);
  }
}

const send = (msg) => new Promise((r) => chrome.runtime.sendMessage(msg, r));

// --- Start
$("start").addEventListener("click", async () => {
  const fys = [...document.querySelectorAll("#fyList input:checked")].map((i) => i.value);
  const pan = $("pan").value.trim().toUpperCase();
  document.querySelector(".err")?.remove();
  const err = (m) => {
    const p = document.createElement("p");
    p.className = "err"; p.textContent = m;
    $("start").after(p);
  };
  if (!fys.length) return err("Select at least one financial year.");
  if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) return err("PAN should look like ABCDE1234F.");

  chrome.storage.local.set({ prefs: { wantPdf: $("wantPdf").checked, wantText: $("wantText").checked, pan } });
  $("start").disabled = true;
  const res = await send({ type: "startJob", fys: fys.reverse(), pan, wantPdf: $("wantPdf").checked, wantText: $("wantText").checked });
  $("start").disabled = false;
  if (!res || !res.ok) return err(res ? res.error : "Could not start.");
  render(res.job);
});

$("cancel").addEventListener("click", () => send({ type: "cancelJob" }));
$("again").addEventListener("click", async () => { await send({ type: "clearJob" }); render(null); });
$("openDownloads").addEventListener("click", (e) => { e.preventDefault(); chrome.downloads.showDefaultFolder(); });

// --- Progress view
const LABEL = { running: "Running", done: "Completed", error: "Stopped – error", cancelled: "Cancelled" };

function render(job) {
  const show = !!job;
  $("setup").hidden = show;
  $("progress").hidden = !show;
  if (!job) return;

  $("statusPill").textContent = job.status === "running" && job.stage === "login" ? "Waiting for login" : LABEL[job.status];
  $("statusPill").className = `pill ${job.status}`;
  const done = job.tasks.filter((t) => t.done).length;
  $("count").textContent = `${done} of ${job.tasks.length} done`;

  $("tasks").innerHTML = "";
  job.tasks.forEach((t, i) => {
    const li = document.createElement("li");
    const cur = job.status === "running" && i === job.i;
    li.className = t.done ? "done" : cur ? "current" : "";
    const what = t.kind === "TEXT" ? "Text (zip)" : t.pdf ? "HTML + PDF" : "HTML";
    li.innerHTML = `<span>AY ${t.ay} · ${what}</span><span class="st">${t.done ? "✓ Saved" : cur ? "In progress" : "Pending"}</span>`;
    $("tasks").appendChild(li);
  });

  $("log").innerHTML = "";
  for (const e of (job.log || []).slice(-30)) {
    const d = document.createElement("div");
    d.className = e.level || "";
    d.textContent = `${new Date(e.t).toLocaleTimeString()}  ${e.msg}`;
    $("log").appendChild(d);
  }
  $("log").scrollTop = $("log").scrollHeight;

  const running = job.status === "running";
  $("cancel").hidden = !running;
  $("again").hidden = running;
}

chrome.storage.onChanged.addListener((c) => { if (c.job) render(c.job.newValue || null); });

(async () => {
  renderFys();
  const { job, prefs } = await chrome.storage.local.get(["job", "prefs"]);
  if (prefs) {
    $("wantPdf").checked = prefs.wantPdf !== false;
    $("wantText").checked = !!prefs.wantText;
    $("pan").value = prefs.pan || "";
  }
  render(job || null);
})();
