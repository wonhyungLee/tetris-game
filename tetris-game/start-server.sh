#!/bin/bash

# 테트리스 게임 빠른 시작 스크립트 (Ubuntu/Linux)

echo "==================================="
echo "    테트리스 게임 서버 시작"
echo "==================================="

# 현재 디렉토리 확인
if [ ! -f "index.html" ]; then
    echo "❌ 오류: 테트리스 게임 폴더에서 실행해주세요."
    echo "현재 위치: $(pwd)"
    exit 1
fi

echo "🔍 서버 옵션을 선택하세요:"
echo "1) Python 간단 서버 (포트 8080)"
echo "2) Node.js 서버 (포트 3000)"
echo "3) Apache 서버 설정 (sudo 권한 필요)"
echo "4) Nginx 서버 설정 (sudo 권한 필요)"

read -p "선택 (1-4): " choice

case $choice in
    1)
        echo "🐍 Python 서버를 시작합니다..."
        if command -v python3 &> /dev/null; then
            echo "📡 서버 주소: http://localhost:8080"
            echo "🛑 종료하려면 Ctrl+C를 누르세요"
            python3 -m http.server 8080
        else
            echo "❌ Python3가 설치되어 있지 않습니다."
            echo "설치 명령: sudo apt install python3"
        fi
        ;;
    2)
        echo "🟢 Node.js 서버를 시작합니다..."
        if command -v node &> /dev/null; then
            if [ ! -d "node_modules" ]; then
                echo "📦 의존성을 설치합니다..."
                npm install
            fi
            echo "📡 서버 주소: http://localhost:3000"
            echo "🛑 종료하려면 Ctrl+C를 누르세요"
            npm start
        else
            echo "❌ Node.js가 설치되어 있지 않습니다."
            echo "설치 명령: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
        fi
        ;;
    3)
        echo "🌐 Apache 서버 설정..."
        if command -v apache2 &> /dev/null; then
            sudo cp -r . /var/www/html/tetris-game/
            sudo chown -R www-data:www-data /var/www/html/tetris-game/
            sudo chmod -R 755 /var/www/html/tetris-game/
            sudo systemctl restart apache2
            echo "✅ Apache 설정 완료!"
            echo "📡 서버 주소: http://localhost/tetris-game/"
        else
            echo "❌ Apache가 설치되어 있지 않습니다."
            echo "설치 명령: sudo apt install apache2"
        fi
        ;;
    4)
        echo "🔵 Nginx 서버 설정..."
        if command -v nginx &> /dev/null; then
            sudo cp -r . /var/www/html/tetris-game/
            sudo chown -R www-data:www-data /var/www/html/tetris-game/
            sudo chmod -R 755 /var/www/html/tetris-game/
            
            # Nginx 설정 파일 생성
            sudo tee /etc/nginx/sites-available/tetris-game > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    root /var/www/html/tetris-game;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|mp3|wav)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
            
            sudo ln -sf /etc/nginx/sites-available/tetris-game /etc/nginx/sites-enabled/
            sudo nginx -t && sudo systemctl reload nginx
            echo "✅ Nginx 설정 완료!"
            echo "📡 서버 주소: http://localhost/"
        else
            echo "❌ Nginx가 설치되어 있지 않습니다."
            echo "설치 명령: sudo apt install nginx"
        fi
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac

echo ""
echo "🎮 게임을 즐겨보세요!"
echo "📱 모바일에서도 접속 가능합니다!"