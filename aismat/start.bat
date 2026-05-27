@echo off
chcp 65001 >nul
title AIS - Launcher

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

echo ============================================================
echo   AIS навчальних матеріалів - запуск
echo ============================================================
echo.

if not exist "%BACKEND%\node_modules" (
  echo [!] У backend не знайдено node_modules. Запускаю npm install...
  pushd "%BACKEND%" && call npm install || (echo [X] npm install у backend не виконався & pause & exit /b 1)
  popd
)

if not exist "%FRONTEND%\node_modules" (
  echo [!] У frontend не знайдено node_modules. Запускаю npm install...
  pushd "%FRONTEND%" && call npm install || (echo [X] npm install у frontend не виконався & pause & exit /b 1)
  popd
)

echo [1/3] Запуск backend  (http://localhost:3000)
start "AIS Backend"  cmd /k "cd /d %BACKEND% && npm run dev"

echo [2/3] Запуск frontend (http://localhost:5173)
start "AIS Frontend" cmd /k "cd /d %FRONTEND% && npm run dev"

echo [3/3] Чекаю 6 секунд на запуск і відкриваю браузер...
timeout /t 6 /nobreak >nul
start "" http://localhost:5173

echo.
echo ============================================================
echo   Сайт відкрито у браузері: http://localhost:5173
echo   Логін: admin / Admin123!
echo.
echo   Щоб зупинити - закрийте обидва вікна "AIS Backend" і
echo   "AIS Frontend", або запустіть stop.bat.
echo ============================================================
echo.
timeout /t 5 /nobreak >nul
exit /b 0
