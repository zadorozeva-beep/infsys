@echo off
chcp 65001 >nul
title AIS - Stop

echo Зупиняю backend (port 3000) і frontend (port 5173)...

for /f "tokens=5" %%P in ('netstat -aon ^| findstr ":3000 " ^| findstr LISTENING') do (
  echo Killing PID %%P (port 3000)
  taskkill /F /PID %%P >nul 2>&1
)

for /f "tokens=5" %%P in ('netstat -aon ^| findstr ":5173 " ^| findstr LISTENING') do (
  echo Killing PID %%P (port 5173)
  taskkill /F /PID %%P >nul 2>&1
)

echo Готово.
timeout /t 2 /nobreak >nul
exit /b 0
