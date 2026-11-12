#!/usr/bin/env python3
"""
Form 26AS Downloader
====================

Opens Google Chrome, logs in to the Income Tax e-filing portal with your
PAN / user ID and password, waits for YOU to solve the captcha (and OTP, if
asked), then goes to TRACES and downloads Form 26AS in HTML and PDF format
for the financial year(s) you choose.

Usage
-----
    python download_26as.py                       # asks for everything
    python download_26as.py --pan ABCDE1234F --fy 2024-25
    python download_26as.py --pan ABCDE1234F --fy 2023-24 2024-25 --out D:\\26AS

The password is never accepted on the command line (it would be saved in
your shell history). It is asked for securely, or read from the environment
variable ITD_PASSWORD.

Every step is automated, but government portals change their layout from
time to time. If any step cannot be done automatically, the script tells
you what to click in the Chrome window, waits for you to press Enter, and
then carries on.
"""

from __future__ import annotations

import argparse
import getpass
import os
import re
import sys
import time
from pathlib import Path

try:
    from playwright.sync_api import (
        Page,
        BrowserContext,
        TimeoutError as PWTimeout,
        sync_playwright,
    )
except ImportError:  # pragma: no cover
    sys.exit(
        "Playwright is not installed.\n"
        "Run:  pip install -r requirements.txt\n"
        "then: python -m playwright install chromium"
    )

LOGIN_URL = os.environ.get(
    "ITD_LOGIN_URL", "https://eportal.incometax.gov.in/iec/foservices/#/login"
)

# How long (seconds) to wait for the user to solve captcha / OTP.
HUMAN_WAIT = 300


# --------------------------------------------------------------------------
# Small helpers
# --------------------------------------------------------------------------

def say(msg: str) -> None:
    print(f"[26AS] {msg}", flush=True)


def fy_to_ay(fy: str) -> str:
    """'2024-25' or '2024-2025' or '2024' -> AY '2025-26'."""
    m = re.fullmatch(r"\s*(\d{4})(?:\s*-\s*(\d{2}|\d{4}))?\s*", fy)
    if not m:
        raise ValueError(f"Financial year '{fy}' is not valid. Use the form 2024-25.")
    start = int(m.group(1))
    if m.group(2):
        end = int(m.group(2)[-2:])
        if end != (start + 1) % 100:
            raise ValueError(f"Financial year '{fy}' is not valid. Use the form 2024-25.")
    ay_start = start + 1
    return f"{ay_start}-{str(ay_start + 1)[-2:]}"


def manual_fallback(instruction: str) -> None:
    """Ask the user to do one step by hand in the browser."""
    print()
    say("Could not do this step automatically (the portal layout may have changed).")
    say(f"Please do it yourself in the Chrome window:  {instruction}")
    input("[26AS] Press Enter here when done... ")


def first_visible(page: Page, selectors: list[str], timeout: float = 10):
    """Return the first locator from `selectors` that becomes visible."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        for sel in selectors:
            try:
                loc = page.locator(sel).first
                if loc.is_visible():
                    return loc
            except Exception:
                pass
        time.sleep(0.3)
    return None


def click_any(page: Page, selectors: list[str], timeout: float = 10) -> bool:
    loc = first_visible(page, selectors, timeout)
    if loc is None:
        return False
    try:
        loc.scroll_into_view_if_needed(timeout=3000)
        loc.click(timeout=5000)
        return True
    except Exception:
        try:
            loc.click(timeout=5000, force=True)
            return True
        except Exception:
            return False


def fill_any(page: Page, selectors: list[str], value: str, timeout: float = 10) -> bool:
    loc = first_visible(page, selectors, timeout)
    if loc is None:
        return False
    try:
        loc.click()
        loc.fill("")
        loc.type(value, delay=40)  # typed slowly, like a person
        return True
    except Exception:
        return False


def safe_name(s: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", s)


# --------------------------------------------------------------------------
# Step 1 - Login on the e-filing portal
# --------------------------------------------------------------------------

def login(page: Page, user_id: str, password: str) -> None:
    say("Opening the Income Tax e-filing portal...")
    page.goto(LOGIN_URL, wait_until="domcontentloaded", timeout=90_000)

    # --- User ID (PAN / Aadhaar / other user ID)
    ok = fill_any(
        page,
        [
            "#panAdhaarUserId",
            "input[name='panAdhaarUserId']",
            "input[placeholder*='PAN' i]",
            "input[placeholder*='User ID' i]",
            "input[type='text']",
        ],
        user_id,
        timeout=40,
    )
    if not ok:
        manual_fallback(f"type your user ID ({user_id}) in the login box")

    if not click_any(page, ["button:has-text('Continue')", "button.large-button-primary"]):
        manual_fallback("click 'Continue'")

    # --- Secure access message checkbox + password
    pw_selectors = [
        "#loginPasswordField",
        "input[type='password']",
    ]
    if first_visible(page, pw_selectors, timeout=30) is None:
        manual_fallback("go to the password screen")

    # "Please confirm your secure access message" checkbox
    click_any(
        page,
        [
            "#passwordCheckBox",
            "label[for='passwordCheckBox']",
            "mat-checkbox:has-text('secure access')",
            "label:has-text('secure access message')",
            "input[type='checkbox']",
        ],
        timeout=5,
    )

    if not fill_any(page, pw_selectors, password, timeout=10):
        manual_fallback("type your password")

    # --- Captcha (if the portal shows one) is solved by the user
    captcha = first_visible(
        page,
        [
            "input[placeholder*='captcha' i]",
            "input[id*='captcha' i]",
            "input[name*='captcha' i]",
        ],
        timeout=3,
    )
    if captcha is not None:
        print()
        say("CAPTCHA: type the captcha shown in the Chrome window into the captcha box.")
        say("Then click 'Continue' / 'Login' yourself. I am waiting for the dashboard...")
    else:
        click_any(page, ["button:has-text('Continue')", "button:has-text('Login')"])
        print()
        say("If Chrome now shows a captcha or asks for an OTP, complete it in the Chrome window.")
        say("I am waiting for the dashboard...")

    wait_for_dashboard(page)


def wait_for_dashboard(page: Page) -> None:
    deadline = time.time() + HUMAN_WAIT
    dual_login_clicked = False
    while time.time() < deadline:
        url = page.url.lower()
        if "dashboard" in url:
            say("Logged in successfully.")
            page.wait_for_timeout(2500)
            return
        # "You are already logged in elsewhere" -> "Login Here"
        if not dual_login_clicked and click_any(
            page, ["button:has-text('Login Here')"], timeout=0.5
        ):
            dual_login_clicked = True
            continue
        page.wait_for_timeout(1000)
    manual_fallback("finish logging in until you see the Dashboard")


# --------------------------------------------------------------------------
# Step 2 - e-File > Income Tax Returns > View Form 26AS  -> TRACES
# --------------------------------------------------------------------------

def open_traces(page: Page, context: BrowserContext) -> Page:
    say("Opening e-File > Income Tax Returns > View Form 26AS ...")

    pages_before = set(context.pages)

    def menu_steps() -> bool:
        if not click_any(page, ["text=/^\\s*e-File\\s*$/", "span:has-text('e-File')"], 20):
            return False
        page.wait_for_timeout(800)
        if not click_any(page, ["text=/^\\s*Income Tax Returns\\s*$/",
                                "button:has-text('Income Tax Returns')"], 10):
            return False
        page.wait_for_timeout(800)
        if not click_any(page, ["text=/View Form 26AS/i"], 10):
            return False
        return True

    if not menu_steps():
        manual_fallback("click  e-File  >  Income Tax Returns  >  View Form 26AS")

    # Disclaimer: "you will be redirected to TDS-CPC website" -> Confirm
    click_any(page, ["button:has-text('Confirm')"], timeout=15)

    # TRACES normally opens in a new tab
    traces = None
    deadline = time.time() + 60
    while time.time() < deadline and traces is None:
        for p in context.pages:
            if p not in pages_before and "tdscpc" in p.url.lower():
                traces = p
        if traces is None and "tdscpc" in page.url.lower():
            traces = page
        if traces is None:
            page.wait_for_timeout(500)

    if traces is None:
        manual_fallback("open the TRACES (tdscpc.gov.in) tab - click 'Confirm' / 'Proceed'")
        candidates = [p for p in context.pages if "tdscpc" in p.url.lower()]
        traces = candidates[-1] if candidates else context.pages[-1]

    traces.bring_to_front()
    traces.wait_for_load_state("domcontentloaded")
    say("TRACES website opened.")

    # Usage/acceptance checkbox + Proceed
    click_any(traces, ["#Details", "input[type='checkbox']"], timeout=15)
    click_any(traces, ["#btn", "input[value='Proceed']", "button:has-text('Proceed')"], timeout=10)

    # "View Tax Credit (Form 26AS/Annual Tax Statement)"
    if not click_any(
        traces,
        ["a:has-text('View Tax Credit')", "text=/View Tax Credit/i"],
        timeout=30,
    ):
        manual_fallback("click the link 'View Tax Credit (Form 26AS/Annual Tax Statement)'")

    traces.wait_for_load_state("domcontentloaded")
    return traces


# --------------------------------------------------------------------------
# Step 3 - Choose Assessment Year, view as HTML, save HTML + PDF
# --------------------------------------------------------------------------

def select_assessment_year(traces: Page, ay: str) -> bool:
    ay_start = ay[:4]
    sel = first_visible(
        traces,
        ["#AssessmentYearDropDown", "select[name*='ssessment' i]", "select[id*='ssessment' i]"],
        timeout=30,
    )
    if sel is None:
        return False
    for attempt in (
        {"label": ay},
        {"value": ay_start},
        {"value": ay},
        {"label": f"{ay_start}-{int(ay_start) + 1}"},
    ):
        try:
            sel.select_option(**attempt, timeout=3000)
            return True
        except Exception:
            continue
    # Last resort: look through the option texts
    try:
        for opt in sel.locator("option").all():
            text = (opt.inner_text() or "").strip()
            if text.startswith(ay_start):
                sel.select_option(value=opt.get_attribute("value"))
                return True
    except Exception:
        pass
    return False


def select_view_html(traces: Page) -> bool:
    sel = first_visible(traces, ["#viewType", "select[name*='view' i]"], timeout=10)
    if sel is None:
        return False
    for attempt in ({"label": "HTML"}, {"value": "HTML"}):
        try:
            sel.select_option(**attempt, timeout=3000)
            return True
        except Exception:
            continue
    return False


STATEMENT_MARKERS = [
    "text=/Annual Tax Statement/i",
    "text=/PART[- ]?I\\b/i",
    "text=/Assessee Details/i",
]


def find_statement_frame(traces: Page):
    """26AS may render on the page itself or inside a frame."""
    for frame in [traces.main_frame, *traces.frames]:
        for m in STATEMENT_MARKERS:
            try:
                if frame.locator(m).first.is_visible():
                    return frame
            except Exception:
                pass
    return None


def download_for_ay(traces: Page, context: BrowserContext, ay: str, pan: str,
                    out_dir: Path) -> None:
    say(f"Assessment Year {ay}: requesting Form 26AS ...")

    if not select_assessment_year(traces, ay):
        manual_fallback(f"select Assessment Year {ay} in the drop-down")
    if not select_view_html(traces):
        manual_fallback("select 'View As' = HTML")

    if not click_any(
        traces,
        ["#btnSubmit", "input[value*='View' i]", "button:has-text('View')"],
        timeout=10,
    ):
        manual_fallback("click 'View / Download'")

    # Wait for the statement to appear
    frame = None
    deadline = time.time() + 90
    while time.time() < deadline and frame is None:
        frame = find_statement_frame(traces)
        if frame is None:
            traces.wait_for_timeout(1000)
    if frame is None:
        manual_fallback("wait until Form 26AS is shown on screen")
        frame = find_statement_frame(traces) or traces.main_frame

    base = out_dir / safe_name(f"26AS_{pan}_AY{ay}")
    html_path = base.with_suffix(".html")
    pdf_path = base.with_suffix(".pdf")

    # ---- HTML
    html = frame.content()
    # Make relative links (CSS/images) work when opened from disk
    base_href = frame.url.rsplit("/", 1)[0] + "/"
    if "<base " not in html.lower():
        html = re.sub(r"(<head[^>]*>)", rf'\1<base href="{base_href}">', html,
                      count=1, flags=re.I)
    html_path.write_text(html, encoding="utf-8")
    say(f"Saved HTML: {html_path}")

    # ---- PDF: use TRACES' own "Export as PDF" button if present
    got_pdf = False
    pdf_btn = first_visible(
        traces,
        ["#pdfBtn", "input[value*='Export as PDF' i]", "button:has-text('Export as PDF')",
         "a:has-text('Export as PDF')"],
        timeout=8,
    )
    if pdf_btn is not None:
        try:
            with traces.expect_download(timeout=120_000) as dl_info:
                pdf_btn.click()
            dl_info.value.save_as(pdf_path)
            got_pdf = True
        except Exception as e:
            say(f"'Export as PDF' did not give a file ({e.__class__.__name__}); "
                "creating the PDF from the HTML instead.")

    if not got_pdf:
        html_to_pdf(context, html_path, pdf_path)
    say(f"Saved PDF:  {pdf_path}")


def html_to_pdf(context: BrowserContext, html_path: Path, pdf_path: Path) -> None:
    """Print the saved HTML to PDF with a separate headless browser
    (Chrome can only print to PDF in headless mode)."""
    bt = context.browser.browser_type
    try:
        browser = bt.launch(channel="chrome", headless=True)
    except Exception:
        browser = bt.launch(headless=True)
    try:
        pg = browser.new_page()
        pg.goto(html_path.resolve().as_uri(), wait_until="load", timeout=60_000)
        pg.pdf(path=str(pdf_path), format="A4", landscape=True,
               print_background=True,
               margin={"top": "10mm", "bottom": "10mm", "left": "8mm", "right": "8mm"})
    finally:
        browser.close()


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="Download Form 26AS (HTML + PDF) from the Income Tax portal.")
    ap.add_argument("--pan", help="PAN / user ID used to log in to the e-filing portal")
    ap.add_argument("--fy", nargs="+", help="Financial year(s), e.g. 2024-25 (several allowed)")
    ap.add_argument("--out", default="downloads", help="Folder to save files in (default: ./downloads)")
    ap.add_argument("--keep-open", action="store_true",
                    help="Leave Chrome open at the end instead of closing it")
    return ap.parse_args()


def main() -> int:
    args = parse_args()

    pan = (args.pan or input("PAN / User ID: ")).strip().upper()
    password = os.environ.get("ITD_PASSWORD") or getpass.getpass("Password (hidden): ")
    fys = args.fy or input("Financial year(s), e.g. 2024-25 (separate with spaces): ").split()

    try:
        ays = [fy_to_ay(fy) for fy in fys]
    except ValueError as e:
        say(str(e))
        return 2
    if not pan or not password or not ays:
        say("PAN, password and financial year are all required.")
        return 2

    out_dir = Path(args.out) / safe_name(pan)
    out_dir.mkdir(parents=True, exist_ok=True)
    say(f"Will download 26AS for AY {', '.join(ays)} into {out_dir.resolve()}")

    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(channel="chrome", headless=False,
                                        args=["--start-maximized"])
        except Exception:
            say("Google Chrome not found - using Playwright's Chromium instead.")
            browser = p.chromium.launch(headless=False, args=["--start-maximized"])

        context = browser.new_context(accept_downloads=True, no_viewport=True)
        page = context.new_page()

        failed: list[str] = []
        try:
            login(page, pan, password)
            traces = open_traces(page, context)
            home_url = traces.url
            for i, ay in enumerate(ays):
                try:
                    if i > 0:
                        # Back to the AY selection screen for the next year
                        traces.goto(home_url, wait_until="domcontentloaded")
                    download_for_ay(traces, context, ay, pan, out_dir)
                except Exception as e:  # keep going with the other years
                    say(f"AY {ay} failed: {e}")
                    failed.append(ay)
        except KeyboardInterrupt:
            say("Stopped by user.")
            return 130
        finally:
            if args.keep_open:
                input("[26AS] Press Enter to close Chrome... ")
            try:
                browser.close()
            except Exception:
                pass

    print()
    if failed:
        say(f"Finished with errors for AY: {', '.join(failed)}")
        return 1
    say(f"All done. Files are in: {out_dir.resolve()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
