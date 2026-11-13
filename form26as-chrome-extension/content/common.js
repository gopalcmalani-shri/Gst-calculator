// Shared helpers for the content scripts (portal + TRACES).
/* exported HK */

var HK = (() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const send = (msg) =>
    new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(msg, (res) => {
          void chrome.runtime.lastError;
          resolve(res && res.job);
        });
      } catch (_e) {
        resolve(null); // extension reloaded – page will be re-injected
      }
    });

  async function getJob() {
    return (await chrome.storage.local.get("job")).job || null;
  }

  async function activeJob() {
    const job = await getJob();
    return job && job.status === "running" ? job : null;
  }

  function visible(el) {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && st.visibility !== "hidden" && st.display !== "none";
  }

  function norm(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
  }

  // Find the smallest visible element whose text matches `text`
  // (string = exact match, ignoring case/spaces; RegExp = test).
  function byText(text, selector = "a,button,span,li,div,label,input[type=button],input[type=submit],mat-option") {
    const test = text instanceof RegExp
      ? (s) => text.test(s)
      : (s) => s.toLowerCase() === norm(text).toLowerCase();
    let best = null;
    for (const el of document.querySelectorAll(selector)) {
      const t = norm(el.tagName === "INPUT" ? el.value : el.innerText || el.textContent);
      if (!t || !test(t) || !visible(el)) continue;
      if (el.closest("#hk26as-banner")) continue; // never match our own banner
      if (!best || best.contains(el)) best = el; // prefer the innermost
    }
    return best;
  }

  function q(selectors) {
    for (const s of selectors) {
      try {
        const el = document.querySelector(s);
        if (visible(el)) return el;
      } catch (_e) { /* bad selector in this browser */ }
    }
    return null;
  }

  async function waitFor(fn, timeoutMs = 15000, every = 300) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      const v = fn();
      if (v) return v;
      await sleep(every);
    }
    return null;
  }

  // The element that actually handles clicks/hover (a span's button, etc.)
  function target(el) {
    return el.closest("button,a,[role=menuitem],[mat-menu-item],li,input") || el;
  }

  function mouseOpts(el, extra = {}) {
    const r = el.getBoundingClientRect();
    return { bubbles: true, cancelable: true, view: window, composed: true,
             clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, ...extra };
  }

  // Simulate the mouse moving onto an element. mouseenter/pointerenter do
  // not bubble, so they are sent to the element and each of its parents,
  // which is what a real mouse does. Hover-only menus need this.
  function hover(el) {
    const t = target(el);
    const o = mouseOpts(t);
    t.dispatchEvent(new PointerEvent("pointerover", o));
    t.dispatchEvent(new MouseEvent("mouseover", o));
    for (let n = t; n && n !== document.documentElement; n = n.parentElement) {
      n.dispatchEvent(new PointerEvent("pointerenter", { ...o, bubbles: false }));
      n.dispatchEvent(new MouseEvent("mouseenter", { ...o, bubbles: false }));
    }
    t.dispatchEvent(new PointerEvent("pointermove", o));
    t.dispatchEvent(new MouseEvent("mousemove", o));
  }

  function click(el) {
    const t = target(el);
    t.scrollIntoView({ block: "center" });
    const o = mouseOpts(t);
    t.dispatchEvent(new PointerEvent("pointerdown", o));
    t.dispatchEvent(new MouseEvent("mousedown", o));
    t.dispatchEvent(new PointerEvent("pointerup", o));
    t.dispatchEvent(new MouseEvent("mouseup", o));
    t.click();
  }

  // Keyboard key on an element (Angular Material opens sub-menus on →).
  function pressKey(el, key, keyCode) {
    const t = target(el);
    t.focus();
    const e = new KeyboardEvent("keydown", { key, code: key, bubbles: true, cancelable: true });
    Object.defineProperty(e, "keyCode", { get: () => keyCode });
    Object.defineProperty(e, "which", { get: () => keyCode });
    t.dispatchEvent(e);
  }

  function setChecked(el, value = true) {
    if (el.checked !== value) click(el);
  }

  // Pick an <option> by a list of matchers (label or value).
  function selectOption(select, matchers) {
    const opts = [...select.options];
    for (const m of matchers) {
      const o = opts.find((o) =>
        m instanceof RegExp ? m.test(norm(o.text)) || m.test(o.value)
                            : norm(o.text) === m || o.value === m);
      if (o) {
        select.value = o.value;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  // ------------------------------------------------------------ on-page banner

  let bannerEl = null;
  function banner(msg, kind = "info") {
    if (!bannerEl) {
      bannerEl = document.createElement("div");
      bannerEl.id = "hk26as-banner";
      Object.assign(bannerEl.style, {
        position: "fixed", right: "16px", bottom: "16px", zIndex: 2147483647,
        maxWidth: "360px", padding: "12px 14px", borderRadius: "10px",
        font: "13px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        color: "#fff", boxShadow: "0 6px 24px rgba(0,0,0,.25)",
      });
      document.documentElement.appendChild(bannerEl);
    }
    bannerEl.style.background = kind === "action" ? "#E8710A" : kind === "error" ? "#B3261E" : "#5B2D8E";
    bannerEl.innerHTML = "";
    const title = document.createElement("div");
    title.textContent = "HisabKitab · Form 26AS";
    title.style.cssText = "font-weight:600;opacity:.85;margin-bottom:4px";
    const body = document.createElement("div");
    body.textContent = msg;
    bannerEl.append(title, body);
  }
  function hideBanner() {
    if (bannerEl) bannerEl.remove();
    bannerEl = null;
  }

  // Ask the user to do one step by hand. Keeps the job running: the next
  // page load (or the poll loop) picks up from wherever they get to.
  function needUser(msg) {
    banner(`Please do this yourself: ${msg}. I'll continue automatically.`, "action");
    send({ type: "log", msg: `Waiting for you: ${msg}`, level: "warn" });
  }

  return {
    sleep, send, getJob, activeJob, visible, norm, byText, q, waitFor,
    hover, pressKey, click, setChecked, selectOption, banner, hideBanner, needUser,
  };
})();
