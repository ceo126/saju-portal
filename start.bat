@echo off
chcp 65001 >nul
title 사주포털 - AI 사주팔자

echo ✨ 사주포털 서버를 시작합니다...
echo.

cd /d "%~dp0"

if not exist node_modules (
    echo 📦 패키지 설치 중...
    call npm install
    echo.
)

start http://localhost:8210
node server.js
pause
