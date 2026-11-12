const $ = (id) => document.getElementById(id);

(async () => {
  const { settings = {} } = await chrome.storage.local.get("settings");
  $("apiUrl").value = settings.apiUrl || "";
  $("apiToken").value = settings.apiToken || "";
  $("companyId").value = settings.companyId || "";
})();

$("save").addEventListener("click", async () => {
  const apiUrl = $("apiUrl").value.trim();
  const msg = (t, c = "#2E7D32") => { $("msg").textContent = t; $("msg").style.color = c; };

  if (apiUrl) {
    let u;
    try { u = new URL(apiUrl); } catch { return msg("Enter a full URL starting with https://", "#B3261E"); }
    if (u.protocol !== "https:") return msg("The URL must use https://", "#B3261E");
    // Ask Chrome for permission to talk to this server only.
    const granted = await chrome.permissions.request({ origins: [`${u.origin}/*`] });
    if (!granted) return msg("Permission was not granted – files will only be saved locally.", "#B3261E");
  }

  await chrome.storage.local.set({
    settings: { apiUrl, apiToken: $("apiToken").value.trim(), companyId: $("companyId").value.trim() },
  });
  msg("Saved ✓");
});
