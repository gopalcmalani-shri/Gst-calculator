// Runs on *.tdscpc.gov.in (TRACES; the 26AS pages are on traces61services.tdscpc.gov.in).
//
// TRACES is a classic multi-page site, so this script runs again on every
// page load. Each time it looks at what is on screen and does the matching
// step; progress is kept in the job (chrome.storage) so nothing is lost
// between page loads.

(() => {
  let running = false;

  const SEL = {
    agree: ["#Details", "input[type=checkbox][name*='etail' i]"],
    proceed: ["#btn", "input[type=submit][value*='Proceed' i]", "input[type=button][value*='Proceed' i]"],
    ay: ["#AssessmentYearDropDown", "select[name*='ssessment' i]", "select[id*='ssessment' i]"],
    viewAs: ["#viewType", "select[name*='viewType' i]", "select[id*='view' i]"],
    submit: ["#btnSubmit", "input[value*='View' i][type=button]", "input[value*='View' i][type=submit]"],
    pdf: ["#pdfBtn", "input[value*='Export as PDF' i]"],
  };

  // The 26AS page shows the PAN table and notes (which mention "deductor")
  // even before anything is viewed, so only the Part I table counts – and
  // not while the "Loading please wait…" box is up.
  const PART_I = /PART[\s-]*I\b[\s\-–:]*Details of Tax Deducted/i;

  function loading() {
    return !!HK.byText(/loading,?\s*please wait/i, "div,span,td,p");
  }

  function statementShown() {
    const t = document.body ? document.body.innerText : "";
    return PART_I.test(t) && !loading();
  }

  // When TRACES shows the statement on the same page (no reload), the
  // previous year's statement is still on screen right after we click
  // View for the next year. Remember it so we wait for the new one.
  let staleText = null;
  const bodyText = () => (document.body ? document.body.innerText : "");
  function statementReady() {
    return statementShown() && (staleText === null || bodyText() !== staleText);
  }

  // Drop-downs found by what they contain, in case TRACES renames them.
  function selectWith(re) {
    return [...document.querySelectorAll("select")].find(
      (sel) => HK.visible(sel) && [...sel.options].some((o) => re.test(HK.norm(o.text))));
  }
  const findAySelect = () => HK.q(SEL.ay) || selectWith(/^20\d\d-\d\d$/);
  const findViewSelect = () => HK.q(SEL.viewAs) || selectWith(/^html$/i);

  function findPan() {
    const t = document.body ? document.body.innerText : "";
    const near = t.match(/Permanent Account Number[^A-Z]{0,40}([A-Z]{5}[0-9]{4}[A-Z])/i);
    if (near) return near[1].toUpperCase();
    const any = t.match(/\bPAN\b[^A-Z]{0,10}([A-Z]{5}[0-9]{4}[A-Z])/);
    return any ? any[1] : null;
  }

  function snapshotHtml() {
    const clone = document.documentElement.cloneNode(true);
    const b = clone.querySelector("#hk26as-banner");
    if (b) b.remove(); // drop our own banner
    let html = "<!DOCTYPE html>\n" + clone.outerHTML;
    // Make relative CSS/images work when the file is opened from disk.
    const base = location.href.replace(/[^/]*$/, "");
    if (!/<base\s/i.test(html)) html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);
    return html;
  }

  async function run() {
    if (running) return;
    running = true;
    try {
      // Reaching TRACES means the portal part is done – even if the user
      // clicked through it by hand – so take over.
      const j = await HK.activeJob();
      if (j && j.stage !== "traces") {
        await HK.send({ type: "patch", patch: { stage: "traces" }, log: "TRACES opened – taking over" });
      }
      // Keep going while there is work for this page.
      for (let guard = 0; guard < 50; guard++) {
        const job = await HK.activeJob();
        if (!job || job.stage !== "traces") return;
        const advanced = await step(job);
        if (!advanced) return;
      }
    } catch (e) {
      HK.banner(`Error: ${e.message}`, "error");
      await HK.send({ type: "fail", msg: `TRACES: ${e.message}` });
    } finally {
      running = false;
    }
  }

  // Returns true if it did something and the loop should look again.
  async function step(job) {
    const task = job.tasks[job.i];
    if (!task) return false;

    // ---- A. Statement is on screen for an HTML task we submitted → save it
    if (task.kind === "HTML" && job.submitted && statementReady()) {
      await saveStatement(job, task);
      return true;
    }

    // ---- B. AY selection page → request the next statement
    const aySel = findAySelect();
    if (aySel) {
      if (!job.viewUrl) await HK.send({ type: "patch", patch: { viewUrl: location.href } });
      await request(job, task, aySel);
      return true; // HTML: statement now on screen; TEXT: task finished → next one
    }

    // ---- C. Landing page: "I agree" + Proceed
    const agree = HK.q(SEL.agree);
    const proceed = HK.q(SEL.proceed);
    if (agree && proceed) {
      HK.banner("Accepting TRACES terms …");
      HK.setChecked(agree, true);
      await HK.sleep(400);
      HK.click(proceed);
      return false; // page navigates
    }

    // ---- D. Link to the 26AS page
    const link = HK.byText(/view tax credit/i, "a");
    if (link) {
      HK.banner("Opening View Tax Credit (Form 26AS) …");
      await HK.send({ type: "log", msg: "Opening View Tax Credit (Form 26AS)" });
      HK.click(link);
      return false;
    }

    // ---- E. After a TEXT/HTML task finished on a page without the form → go back
    if (job.viewUrl && location.href !== job.viewUrl && !job.submitted) {
      location.href = job.viewUrl;
      return false;
    }

    // ---- F. Unknown page: wait a bit (slow load), then ask the user.
    const appeared = await HK.waitFor(
      () => findAySelect() || (HK.q(SEL.agree) && HK.q(SEL.proceed)) || HK.byText(/view tax credit/i, "a") ||
            (job.submitted && statementReady()),
      20000
    );
    if (appeared) return true;
    HK.needUser(job.submitted
      ? "wait until Form 26AS appears (or click View/Download again)"
      : "open 'View Tax Credit (Form 26AS/Annual Tax Statement)'");
    // Keep watching the page for the user's action.
    await HK.waitFor(() => findAySelect() || (job.submitted && statementReady()), 10 * 60_000, 1000);
    return true;
  }

  async function request(job, task, aySel) {
    const ayStart = task.ay.slice(0, 4);
    HK.banner(`AY ${task.ay}: requesting Form 26AS (${task.kind}) …`);

    if (!HK.selectOption(aySel, [task.ay, ayStart, new RegExp(`^${ayStart}`)])) {
      throw new Error(`Assessment Year ${task.ay} is not available on TRACES`);
    }
    await HK.sleep(600); // some versions reload "View As" after AY changes

    const viewSel = await HK.waitFor(findViewSelect, 5000);
    const want = task.kind === "TEXT" ? [/^text$/i, "TEXT", "Text"] : [/^html$/i, "HTML"];
    if (!viewSel || !HK.selectOption(viewSel, want)) {
      HK.needUser(`choose View As = ${task.kind === "TEXT" ? "Text" : "HTML"}`);
      await HK.waitFor(() => viewSel && new RegExp(task.kind, "i").test(viewSel.selectedOptions[0]?.text || ""), 120000, 1000);
    }

    const submit = HK.q(SEL.submit) ||
      HK.byText(/^view\s*\/?\s*download$/i, "a,button,input[type=button],input[type=submit]");
    if (!submit) throw new Error("Could not find the View / Download button");

    if (task.kind === "TEXT") {
      await HK.send({ type: "expectDownload", ay: task.ay, kind: "TEXT" });
      await HK.send({ type: "patch", patch: { submitted: true } });
      HK.click(submit);
      const got = await waitForDownload();
      await HK.send({
        type: "taskDone", index: job.i,
        note: got ? null : `AY ${task.ay}: Text file did not download (it may not be available for this year)`,
      });
      await HK.sleep(800);
      return;
    }

    staleText = statementShown() ? bodyText() : null;
    await HK.send({ type: "patch", patch: { submitted: true }, log: `AY ${task.ay}: viewing as HTML` });
    HK.click(submit);
    // Same page (AJAX) or a new page load – either way step() picks it up.
    await HK.waitFor(statementReady, 90000, 700);
  }

  async function saveStatement(job, task) {
    HK.banner(`AY ${task.ay}: saving Form 26AS …`);
    await HK.sleep(800); // let tables finish rendering
    const pan = findPan();
    await HK.send({ type: "saveHtml", ay: task.ay, html: snapshotHtml(), pan });
    staleText = null;

    if (task.pdf) {
      // Exact match on a link/button – the notes also say "click on Export as PDF".
      const btn = HK.q(SEL.pdf) ||
        HK.byText(/^export as pdf$/i, "a,button,input[type=button],input[type=submit]");
      if (btn) {
        await HK.send({ type: "expectDownload", ay: task.ay, kind: "PDF" });
        HK.click(btn);
        const got = await waitForDownload();
        if (!got) await HK.send({ type: "log", msg: `AY ${task.ay}: PDF export did not start`, level: "warn" });
      } else {
        await HK.send({ type: "log", msg: `AY ${task.ay}: no 'Export as PDF' button – use Ctrl+P on the saved HTML`, level: "warn" });
      }
    }

    await HK.send({ type: "taskDone", index: job.i });
    const next = await HK.getJob();
    if (next && next.status === "done") {
      HK.banner("All done ✔  Files are in Downloads › HisabKitab-26AS.");
      setTimeout(HK.hideBanner, 15000);
    }
  }

  async function waitForDownload() {
    const end = Date.now() + 90000;
    while (Date.now() < end) {
      const job = await HK.getJob();
      if (!job || job.status !== "running") return false;
      if (job.expect && job.expect.seen) return true;
      await HK.sleep(700);
    }
    return false;
  }

  chrome.storage.onChanged.addListener((c) => {
    if (c.job && c.job.newValue && c.job.newValue.stage === "traces" &&
        (!c.job.oldValue || c.job.oldValue.stage !== "traces")) run();
  });
  run();
})();
