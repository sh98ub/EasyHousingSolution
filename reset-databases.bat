@echo off
title Reset EHS Databases - Easy Housing Solutions
echo Starting database reset...
powershell -ExecutionPolicy Bypass -File "%~dp0reset-databases.ps1"
pause
