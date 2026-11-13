// Runs on eportal.incometax.gov.in
// Waits for the user to log in (captcha/OTP are theirs), then goes to
// e-File > Income Tax Returns > View Form 26AS > Confirm, which opens TRACES.

(() => {
  let running = false;

  // After login the portal may land on the Dashboard or straight on the
  // "File Income Tax Return" page, so look for the logged-in menu bar.
  const isLoggedIn = () =>
    !/login/i.test(location.href) &&
    (/dashboard/i.test(location.href) ||
     (!!HK.byText(/^e-?file$/i) && /session time|log ?out/i.test(document.body.innerText)));

  async function run() {
    if (running) return;
    running = true;
    try {
      let job = await HK.activeJob();
      if (!job || job.stage !== "login") return;

      // ---- 1. Wait for the user to log in
      if (!isLoggedIn()) {
        HK.banner("Log in with your user ID and password, and type the captcha/OTP. I'll take over once you are logged in.");
        while (!isLoggedIn()) {
          await HK.sleep(1000);
          job = await HK.activeJob();
          if (!job || job.stage !== "login") { HK.hideBanner(); return; }
          // "Already logged in elsewhere" dialog
          const loginHere = HK.byText(/^login here$/i, "button");
          if (loginHere) HK.click(loginHere);
        }
      }
      await HK.send({ type: "log", msg: "Logged in – opening View Form 26AS" });
      HK.banner("Logged in. Opening e-File › Income Tax Returns › View Form 26AS …");
      await HK.sleep(2000);

      // ---- 2. Menu navigation
      const ok = await openMenu();
      if (!ok) {
        HK.needUser("click e-File › Income Tax Returns › View Form 26AS, then Confirm");
      }

      // ---- 3. Disclaimer → Confirm (opens TRACES). Mark the stage first so
      //         the TRACES tab knows it should take over.
      const confirm = await HK.waitFor(() => HK.byText(/^confirm$/i, "button"), ok ? 20000 : 600000);
      const now = await HK.activeJob();
      if (!now || now.stage !== "login") return; // user already went on to TRACES
      if (!confirm) {
        HK.needUser("click e-File › Income Tax Returns › View Form 26AS, then Confirm");
        return;
      }
      await HK.send({ type: "patch", patch: { stage: "traces" }, log: "Redirecting to TRACES" });
      HK.click(confirm);
      HK.banner("Opening TRACES in a new tab …");
      setTimeout(HK.hideBanner, 8000);
    } finally {
      running = false;
    }
  }

  const find26 = () => HK.byText(/^view\s*form\s*26\s*as\b/i);
  const findItr = () => HK.byText(/^income tax returns?$/i);

  async function openMenu() {
    for (let attempt = 0; attempt < 3; attempt++) {
      // Already visible (e.g. the user opened the menu)?
      let v26 = find26();
      if (v26) return choose(v26);

      // 1. Open e-File (only if its list isn't already open — a second
      //    click would close it)
      let itr = findItr();
      if (!itr) {
        const eFile = await HK.waitFor(() => HK.byText(/^e-?file$/i), 20000);
        if (!eFile) return false;
        HK.hover(eFile);
        HK.click(eFile);
        itr = await HK.waitFor(findItr, 5000);
        if (!itr) continue;
      }
      await HK.sleep(700); // let the drop-down finish opening

      // 2. "Income Tax Returns ›" opens its sub-menu on hover. Try hover,
      //    then click, then the → key, checking after each.
      const tries = [() => HK.hover(itr), () => HK.click(itr), () => HK.pressKey(itr, "ArrowRight", 39)];
      for (const t of tries) {
        t();
        v26 = await HK.waitFor(find26, 2500);
        if (v26) return choose(v26);
        itr = findItr() || itr;
      }
      await HK.sleep(1000);
    }
    return false;
  }

  async function choose(el) {
    await HK.sleep(300);
    HK.hover(el);
    HK.click(el);
    return true;
  }

  // Tell eportal-main.js (page side) whether a download is in progress, and
  // open TRACES ourselves if Chrome's pop-up blocker stopped the portal from
  // doing it (our clicks are not "real" clicks for the pop-up blocker).
  async function syncFlag() {
    const j = await HK.activeJob();
    if (j) document.documentElement.dataset.hk26as = "1";
    else delete document.documentElement.dataset.hk26as;
  }
  window.addEventListener("message", async (e) => {
    if (e.source !== window || !e.data || e.data.__hk26as !== "open") return;
    if (!(await HK.activeJob())) return;
    let u;
    try { u = new URL(e.data.url); } catch { return; }
    if (u.protocol !== "https:" || !/(^|\.)tdscpc\.gov\.in$/i.test(u.hostname)) return;
    await HK.send({ type: "openTab", url: u.href });
  });
  syncFlag();

  chrome.runtime.onMessage.addListener((m) => { if (m && m.type === "kick") run(); });
  chrome.storage.onChanged.addListener((c) => {
    if (!c.job) return;
    syncFlag();
    const j = c.job.newValue;
    // The TRACES tab has taken over (also when the user clicked Confirm).
    if (j && j.stage === "traces") {
      HK.banner("Continuing in the TRACES tab …");
      setTimeout(HK.hideBanner, 5000);
      return;
    }
    run();
  });
  window.addEventListener("hashchange", run);
  run();
})();
