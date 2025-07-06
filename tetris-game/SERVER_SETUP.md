# 테트리스 게임 서버 배포 가이드

이 문서는 오라클 우분투 서버에서 테트리스 게임을 배포하는 방법을 설명합니다.

## 파일 업로드

서버에 다음 명령어로 파일을 업로드하세요:

```bash
# SCP를 사용한 업로드 (로컬에서 실행)
scp -r tetris-game/ ubuntu@your-server-ip:/var/www/html/

# 또는 rsync 사용
rsync -avz tetris-game/ ubuntu@your-server-ip:/var/www/html/tetris-game/
```

## 방법 1: Apache 웹서버 사용 (권장)

### Apache 설치
```bash
sudo apt update
sudo apt install apache2
sudo systemctl start apache2
sudo systemctl enable apache2
```

### 파일 배치
```bash
sudo cp -r tetris-game/ /var/www/html/
sudo chown -R www-data:www-data /var/www/html/tetris-game/
sudo chmod -R 755 /var/www/html/tetris-game/
```

### 브라우저에서 접속
```
http://your-server-ip/tetris-game/
```

## 방법 2: Nginx 사용

### Nginx 설치
```bash
sudo apt update
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 설정 파일 생성
```bash
sudo nano /etc/nginx/sites-available/tetris-game
```

설정 파일 내용:
```nginx
server {
    listen 80;
    server_name your-domain.com your-server-ip;
    
    root /var/www/html/tetris-game;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # MIME 타입 설정
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 사이트 활성화
```bash
sudo ln -s /etc/nginx/sites-available/tetris-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 방법 3: Node.js 서버

### Node.js 설치
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 서버 스크립트 사용
```bash
cd tetris-game
node server.js
```

## 방법 4: Python 간단 서버

### Python3 사용 (개발/테스트용)
```bash
cd tetris-game
python3 -m http.server 8080
```

브라우저에서 `http://your-server-ip:8080` 접속

## 보안 설정

### 방화벽 설정
```bash
sudo ufw allow 'Apache Full'  # Apache 사용 시
sudo ufw allow 'Nginx Full'   # Nginx 사용 시
sudo ufw allow 22            # SSH
sudo ufw enable
```

### SSL/HTTPS 설정 (선택사항)
```bash
# Let's Encrypt 인증서 설치
sudo apt install certbot python3-certbot-apache  # Apache용
sudo apt install certbot python3-certbot-nginx   # Nginx용

# 인증서 발급
sudo certbot --apache -d your-domain.com        # Apache
sudo certbot --nginx -d your-domain.com         # Nginx
```

## 성능 최적화

### 파일 압축 (Apache)
```bash
sudo a2enmod deflate
sudo systemctl reload apache2
```

### 파일 압축 (Nginx)
nginx.conf에 추가:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

## 모니터링

### 로그 확인
```bash
# Apache 로그
sudo tail -f /var/log/apache2/access.log
sudo tail -f /var/log/apache2/error.log

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 서버 상태 확인
```bash
sudo systemctl status apache2  # Apache
sudo systemctl status nginx    # Nginx
```

## 문제 해결

### 권한 문제
```bash
sudo chown -R www-data:www-data /var/www/html/tetris-game/
sudo chmod -R 755 /var/www/html/tetris-game/
```

### 음성 파일 재생 문제
- HTTPS 사용 (일부 브라우저에서 HTTP에서 오디오 자동 재생 제한)
- 사용자 상호작용 후 음성 재생 시작

### 모바일 터치 이슈
- viewport 메타 태그 확인
- 터치 이벤트 preventDefault() 호출 확인

## 업데이트

게임 파일 업데이트 시:
```bash
sudo cp -r new-tetris-game/* /var/www/html/tetris-game/
sudo chown -R www-data:www-data /var/www/html/tetris-game/
sudo systemctl reload apache2  # 또는 nginx
```

브라우저 캐시 삭제 후 확인하세요.