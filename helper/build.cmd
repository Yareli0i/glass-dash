@echo off
rem Builds glass-dash-helper.exe with the C# compiler that ships with Windows (.NET Framework 4).
setlocal
set "CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist "%CSC%" set "CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
"%CSC%" /nologo /target:winexe /optimize+ /out:"%~dp0glass-dash-helper.exe" "%~dp0helper.cs"
