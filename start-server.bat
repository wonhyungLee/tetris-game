@echo off
chcp 65001 >nul
title 테트리스 게임 서버 시작

echo ===================================
echo     테트리스 게임 서버 시작
echo ===================================

REM 현재 디렉토리 확인
if not exist "index.html" (
    echo ❌ 오류: 테트리스 게임 폴더에서 실행해주세요.
    echo 현재 위치: %CD%
    pause
    exit /b 1
)

echo 🔍 서버 옵션을 선택하세요:
echo 1^) Python 간단 서버 ^(포트 8080^)
echo 2^) Node.js 서버 ^(포트 3000^)
echo 3^) 브라우저에서 파일 직접 열기

set /p choice="선택 (1-3): "

if "%choice%"=="1" goto python_server
if "%choice%"=="2" goto node_server
if "%choice%"=="3" goto open_browser
goto invalid_choice

:python_server
echo 🐍 Python 서버를 시작합니다...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python이 설치되어 있지 않습니다.
    echo Python을 다운로드하세요: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo 📡 서버 주소: http://localhost:8080
echo 🛑 종료하려면 Ctrl+C를 누르세요
echo.
python -m http.server 8080
goto end

:node_server
echo 🟢 Node.js 서버를 시작합니다...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js가 설치되어 있지 않습니다.
    echo Node.js를 다운로드하세요: https://nodejs.org/
    pause
    exit /b 1
)
if not exist "node_modules" (
    echo 📦 의존성을 설치합니다...
    npm install
)
echo 📡 서버 주소: http://localhost:3000
echo 🛑 종료하려면 Ctrl+C를 누르세요
echo.
npm start
goto end

:open_browser
echo 🌐 브라우저에서 index.html 파일을 직접 엽니다...
start "" "index.html"
echo ✅ 브라우저에서 파일이 열렸습니다.
echo.
echo ⚠️  주의: 일부 기능은 웹서버를 통해서만 작동합니다.
echo    완전한 기능을 위해서는 옵션 1 또는 2를 사용하세요.
goto end

:invalid_choice
echo ❌ 잘못된 선택입니다.
pause
exit /b 1

:end
echo.
echo 🎮 게임을 즐겨보세요!
echo 📱 모바일에서도 접속 가능합니다!
pause