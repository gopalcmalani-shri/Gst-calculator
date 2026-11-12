# HisabKitab – Form 26AS Downloader (Chrome extension)

Downloads **Form 26AS** from the Income Tax portal / TRACES in **HTML + PDF**
(and optionally the **Text zip**) for one or more financial years. It can also
send the statement to HisabKitab for TDS reconciliation.

**You log in yourself** (user ID, password, captcha/OTP – Chrome's password
manager can fill the password). The extension never sees or stores your
password; it takes over once the Dashboard opens.

## Install (developer mode – until it is on the Chrome Web Store)

1. Download this folder (`form26as-chrome-extension`) to your computer.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and pick the `form26as-chrome-extension` folder.
5. Pin the purple **26AS** icon to the toolbar.

## Use

1. Click the **26AS** icon → tick the financial year(s) → choose PDF / Text → **Download 26AS**.
2. A tab opens on the Income Tax portal. **Log in** and type the captcha/OTP.
3. Once the Dashboard opens, the extension does the rest:
   e-File → Income Tax Returns → View Form 26AS → Confirm → TRACES →
   accept terms → View Tax Credit → for each year: select AY, View as HTML, save,
   Export as PDF, (Text download).
4. Progress shows in the popup and in a small banner at the bottom right of the page.

Files are saved to:
```
Downloads/HisabKitab-26AS/<PAN>/26AS_<PAN>_AY2025-26.html
Downloads/HisabKitab-26AS/<PAN>/26AS_<PAN>_AY2025-26.pdf
Downloads/HisabKitab-26AS/<PAN>/26AS_<PAN>_AY2025-26.zip   (if Text was ticked)
```
The Text zip is password-protected by TRACES: the password is your **date of birth /
date of incorporation in DDMMYYYY** format.

> You pick the **financial year** (2024-25); the extension asks TRACES for the
> matching **assessment year** (2025-26).

If the portal layout changes and a button can't be found, the orange banner
tells you what to click. Do that step yourself and the extension carries on from there.

## Send to HisabKitab (optional)

Open the popup → **HisabKitab settings** → enter the upload URL and API token.
Chrome asks permission for that one server. After that, every 26AS HTML is also
POSTed to HisabKitab.

### API contract the HisabKitab backend must implement

```
POST <upload URL>                       (https only)
Authorization: Bearer <API token>
Content-Type: multipart/form-data

pan               ABCDE1234F
assessment_year   2025-26
source            traces-26as-html
company_id        <optional, from settings>
file              26AS_ABCDE1234F_AY2025-26.html  (text/html)

→ 2xx = accepted. Anything else is shown to the user as a warning; the local files are still saved.
```
The server must allow CORS from `chrome-extension://<extension id>` (incl. the
`OPTIONS` preflight for the `Authorization` header).

The HTML (not the PDF) is sent because it can be parsed: Part I (TDS) / Part VI
(TCS) tables → match deductor TAN + section + amount against the customer
ledgers and the TDS Receivable ledger.

## Files

| File | What it does |
|---|---|
| `manifest.json` | Manifest V3; only runs on `eportal.incometax.gov.in` and `services.tdscpc.gov.in` |
| `background.js` | Keeps the job state, saves/renames files, uploads to HisabKitab |
| `content/eportal.js` | Waits for login, opens View Form 26AS → TRACES |
| `content/traces.js` | TRACES steps: terms, View Tax Credit, AY selection, save HTML/PDF/Text |
| `content/common.js` | Shared helpers + the on-page banner |
| `popup.*` | Start screen and progress |
| `options.*` | HisabKitab upload settings |

## Privacy

* No password is read, stored or sent.
* Only the two government sites (and your HisabKitab URL, if you set one) are touched.
* Job progress is kept in Chrome's local extension storage and cleared when you start a new download.
