@echo off
rem Stops Glass Dash Helper, removes it from startup and deletes its folder.
chcp 65001 >nul
setlocal
set "DEST=%LOCALAPPDATA%\GlassDash"
if exist "%DEST%\glass-dash-helper.exe" "%DEST%\glass-dash-helper.exe" --uninstall
timeout /t 1 /nobreak >nul
if exist "%DEST%" rmdir /s /q "%DEST%"
echo Glass Dash Helper is removed.
echo Glass Dash Helper видалено.
pause
