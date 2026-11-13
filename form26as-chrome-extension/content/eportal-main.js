// Runs in the PAGE's own JavaScript world on eportal.incometax.gov.in.
//
// The portal opens TRACES in a new tab. Chrome only allows that straight
// after a real mouse click, and clicks made by an extension don't count, so
// the new tab can be silently blocked. While a 26AS download is running
// (eportal.js sets <html data-hk26as="1">), a blocked TRACES pop-up is passed
// to the extension, which opens it as a normal tab. Nothing changes when no
// download is running, or when the user really clicked.
(() => {
  const active = () => document.documentElement.dataset.hk26as === "1";
  const isTraces = (url) => {
    try { return /(^|\.)tdscpc\.gov\.in$/i.test(new URL(url, location.href).hostname); } catch { return false; }
  };
  const relay = (url) => window.postMessage({ __hk26as: "open", url: new URL(url, location.href).href }, "*");

  const origOpen = window.open;
  window.open = function (url, ...rest) {
    const w = origOpen.call(this, url, ...rest);
    if (!w && url && active() && isTraces(url)) relay(url);
    return w;
  };

  // <a href="https://…tdscpc…" target="_blank"> clicked by the extension
  document.addEventListener("click", (e) => {
    if (e.isTrusted || !active()) return;
    const a = e.target && e.target.closest && e.target.closest("a[href]");
    if (a && a.target && a.target !== "_self" && isTraces(a.href)) {
      e.preventDefault();
      relay(a.href);
    }
  }, true);

  // <form target="_blank" action="https://…tdscpc…"> submitted without a real click:
  // open it in this tab instead of a (blocked) new one.
  const origSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function () {
    if (active() && this.target && this.target !== "_self" && isTraces(this.action) &&
        !(navigator.userActivation && navigator.userActivation.isActive)) {
      this.target = "_self";
    }
    return origSubmit.call(this);
  };
})();
