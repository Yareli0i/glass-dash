@echo off
rem Installs Glass Dash Helper for the current user and makes it start with Windows.
chcp 65001 >nul
setlocal
set "DEST=%LOCALAPPDATA%\GlassDash"
if not exist "%DEST%" mkdir "%DEST%"
rem An older copy may be running and would lock the file.
if exist "%DEST%\glass-dash-helper.exe" "%DEST%\glass-dash-helper.exe" --uninstall
timeout /t 1 /nobreak >nul
copy /y "%~dp0glass-dash-helper.exe" "%DEST%\glass-dash-helper.exe" >nul || goto :failed
"%DEST%\glass-dash-helper.exe" --install
echo Glass Dash Helper is installed in %DEST% and running.
echo Glass Dash Helper встановлено в %DEST%, він уже працює.
pause
exit /b 0

:failed
echo Could not copy glass-dash-helper.exe to %DEST%.
pause
exit /b 1
