@echo off
REM Double-click this file to download Form 26AS.
cd /d "%~dp0"
python -m pip install -q -r requirements.txt
python download_26as.py %*
pause
