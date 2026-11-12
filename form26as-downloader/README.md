# Form 26AS Downloader

Downloads **Form 26AS** (HTML + PDF) from the Income Tax portal / TRACES.

You enter your **PAN / user ID, password and financial year**. The tool opens
**Google Chrome** and logs in for you. When a **captcha** (or OTP) appears, you
type it in the Chrome window. The tool then goes on through
*e-File → Income Tax Returns → View Form 26AS → TRACES → View Tax Credit*,
picks the Assessment Year, and saves both files.

## One-time setup

1. Install **Python 3.9+** from https://www.python.org (on Windows, tick *"Add python.exe to PATH"*).
2. Install **Google Chrome** (you probably have it already).
3. Open a terminal / Command Prompt in this folder and run:
   ```
   pip install -r requirements.txt
   ```
   (Optional: `python -m playwright install chromium` is only needed if Chrome is not installed.)

## Use

**Windows:** double-click `run_windows.bat`, then answer the questions.

**Any OS:**
```
python download_26as.py
```
or give the details up front (you'll still be asked for the password, hidden):
```
python download_26as.py --pan ABCDE1234F --fy 2024-25
python download_26as.py --pan ABCDE1234F --fy 2022-23 2023-24 2024-25 --out D:\26AS
```

Files are saved as:
```
downloads/ABCDE1234F/26AS_ABCDE1234F_AY2025-26.html
downloads/ABCDE1234F/26AS_ABCDE1234F_AY2025-26.pdf
```

> **Financial year vs Assessment year:** you enter the **FY** (e.g. `2024-25`);
> the tool converts it to the AY that TRACES uses (`2025-26`).

### Options
| Option | Meaning |
|---|---|
| `--pan` | PAN / user ID for the e-filing portal |
| `--fy` | One or more financial years, e.g. `2024-25` |
| `--out` | Output folder (default `downloads`) |
| `--keep-open` | Don't close Chrome at the end |

## How it behaves

* **Captcha / OTP:** the tool pauses for up to 5 minutes while you complete it in Chrome.
* **"Already logged in elsewhere"**: it clicks *Login Here* automatically.
* **If the portal layout has changed** and a button can't be found, the tool
  doesn't crash. It tells you which button to click in Chrome, waits for you
  to press **Enter**, and then carries on.
* **PDF:** it uses TRACES' own *Export as PDF* button. If that isn't available,
  it prints the saved HTML to PDF itself.

## Security

* The password is **never** taken on the command line or saved to disk. It's
  typed hidden, or read from the `ITD_PASSWORD` environment variable if you set one.
* Everything runs on your own computer, and nothing is sent anywhere except the
  official portals.
