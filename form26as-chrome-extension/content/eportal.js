// Runs on eportal.incometax.gov.in
// Waits for the user to log in (captcha/OTP are theirs), then goes to
// e-File > Income Tax Returns > View Form 26AS > Confirm, which opens TRACES.

(() => {
  let running = false;

  const isDashboard = () => /dashboard/i.test(location.href);

  async function run() {
    if (running) return;
    running = true;
    try {
      let job = await HK.activeJob();
      if (!job || job.stage !== "login") return;

      // ---- 1. Wait for the user to log in
      if (!isDashboard()) {
        HK.banner("Log in with your user ID and password, and type the captcha/OTP. I'll take over once the Dashboard opens.");
        while (!isDashboard()) {
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
      if (!(await HK.activeJob())) return;
      await HK.send({ type: "patch", patch: { stage: "traces" }, log: "Redirecting to TRACES" });
      if (confirm) HK.click(confirm);
      HK.banner("Opening TRACES in a new tab …");
      setTimeout(HK.hideBanner, 8000);
    } finally {
      running = false;
    }
  }

  async function openMenu() {
    const eFile = await HK.waitFor(() => HK.byText(/^e-?file$/i), 20000);
    if (!eFile) return false;
    HK.click(eFile);
    eFile.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    const itr = await HK.waitFor(() => HK.byText(/^income tax returns?$/i), 8000);
    if (!itr) return false;
    HK.click(itr);
    itr.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    const v26 = await HK.waitFor(() => HK.byText(/^view form 26as/i), 8000);
    if (!v26) return false;
    HK.click(v26);
    return true;
  }

  chrome.runtime.onMessage.addListener((m) => { if (m && m.type === "kick") run(); });
  chrome.storage.onChanged.addListener((c) => { if (c.job) run(); });
  window.addEventListener("hashchange", run);
  run();
})();
