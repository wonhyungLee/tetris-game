// 테트리스 게임 클래스
class TetrisGame {
    constructor() {
        // 게임 보드 설정 - 정확한 1:2 비율
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30; // 300px / 10 = 30px, 600px / 20 = 30px
        
        // 인앱 브라우저 감지
        this.isInAppBrowser = this.detectInAppBrowser();
        
        // 스크롤 위치 저장 (iOS Safari 대응)
        this.scrollPosition = 0;
        
        // 게임 상태
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.canContinue = false;
        this.playerName = '';
        
        // 전체화면 상태
        this.isFullscreen = false;
        
        // 모바일 감지
        this.isMobile = this.detectMobile();
        
        // 게임 속도
        this.dropInterval = 1000; // 1초
        this.dropTimer = 0;
        this.lastTime = 0;
        
        // 터치 컨트롤
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.isDragging = false;
        this.minSwipeDistance = 50;
        
        // 캔버스
        this.canvas = null;
        this.ctx = null;
        this.nextCanvas = null;
        this.nextCtx = null;
        
        // 테트리스 피스 정의 (부드러운 색상)
        this.pieces = {
            I: {
                shape: [
                    [0, 0, 0, 0],
                    [1, 1, 1, 1],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0]
                ],
                color: '#87CEEB' // 스카이블루
            },
            O: {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#F0E68C' // 카키
            },
            T: {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#DDA0DD' // 플럼
            },
            S: {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0],
                    [0, 0, 0]
                ],
                color: '#98FB98' // 페일그린
            },
            Z: {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1],
                    [0, 0, 0]
                ],
                color: '#FFA07A' // 라이트샐몬
            },
            J: {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#87CEFA' // 라이트스카이블루
            },
            L: {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#F4A460' // 샌디브라운
            }
        };
        
        this.pieceTypes = Object.keys(this.pieces);
        
        this.init();
    }
    
    // 인앱 브라우저 감지
    detectInAppBrowser() {
        const userAgent = navigator.userAgent.toLowerCase();
        return userAgent.includes('kakaotalk') || 
               userAgent.includes('line') || 
               userAgent.includes('fban') ||
               userAgent.includes('fbav') ||
               userAgent.includes('instagram') ||
               userAgent.includes('naver') ||
               userAgent.includes('whale');
    }
    
    // 모바일 환경 감지
    detectMobile() {
        // User Agent 기반 감지 (더 정확함)
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = [
            'android', 'webos', 'iphone', 'ipad', 'ipod', 
            'blackberry', 'iemobile', 'opera mini', 'mobile'
        ];
        
        const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
        
        // 터치 지원 여부도 확인
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // 화면 크기는 보조 수단으로만 사용 (데스크탑에서 창 크기가 작을 수 있음)
        const isSmallScreen = window.innerWidth <= 768;
        
        // User Agent가 모바일이거나, 터치와 작은 화면을 모두 가진 경우
        return isMobileUserAgent || (hasTouchScreen && isSmallScreen);
    }
    
    // 스크롤 제어 (게임 영역만 터치 제어)
    disableScroll() {
        // 현재 스크롤 위치 저장
        this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        // body에 게임 활성 클래스 추가
        document.body.classList.add('game-active');
        
        // 게임 캔버스에만 터치 제어 적용
        this.canvas.addEventListener('touchmove', this.preventCanvasScroll, { passive: false });
        this.canvas.addEventListener('touchstart', this.preventCanvasScroll, { passive: false });
        
        // 모바일 컨트롤 버튼에도 적용
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('touchmove', this.preventCanvasScroll, { passive: false });
        });
    }
    
    // 스크롤 활성화
    enableScroll() {
        // body에서 게임 활성 클래스 제거
        document.body.classList.remove('game-active');
        
        // 게임 캔버스에서 터치 제어 제거
        this.canvas.removeEventListener('touchmove', this.preventCanvasScroll);
        this.canvas.removeEventListener('touchstart', this.preventCanvasScroll);
        
        // 모바일 컨트롤 버튼에서도 제거
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.removeEventListener('touchmove', this.preventCanvasScroll);
        });
    }
    
    // 캔버스 영역에서만 스크롤 방지
    preventCanvasScroll = (e) => {
        e.preventDefault();
        e.stopPropagation();
    }
    
    init() {
        this.initCanvas();
        this.initBoard();
        this.bindEvents();
        this.showStartScreen();
    }
    
    initCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
    
        const devicePixelRatio = window.devicePixelRatio || 1;
    
        // 게임 보드의 논리적 크기(10x20)와 블록 크기(30px)를 기반으로 캔버스 크기를 명확하게 설정합니다.
        const canvasWidth = this.BOARD_WIDTH * this.BLOCK_SIZE; // 10 * 30 = 300
        const canvasHeight = this.BOARD_HEIGHT * this.BLOCK_SIZE; // 20 * 30 = 600
    
        // 1. 캔버스의 CSS 크기를 설정합니다.
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';
    
        // 2. 고해상도 디스플레이(레티나 등)에 대응하기 위해 캔버스의 실제 버퍼 크기를 설정합니다.
        this.canvas.width = canvasWidth * devicePixelRatio;
        this.canvas.height = canvasHeight * devicePixelRatio;
    
        // 3. 캔버스 컨텍스트의 스케일을 조정하여 선명하게 렌더링되도록 합니다.
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
    
        // '다음 블록' 캔버스도 동일한 방식으로 설정합니다.
        const nextCanvasSize = 60;
        this.nextCanvas.style.width = nextCanvasSize + 'px';
        this.nextCanvas.style.height = nextCanvasSize + 'px';
        this.nextCanvas.width = nextCanvasSize * devicePixelRatio;
        this.nextCanvas.height = nextCanvasSize * devicePixelRatio;
        this.nextCtx.scale(devicePixelRatio, devicePixelRatio);
    }
    
    initBoard() {
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
    }
    
    bindEvents() {
        // 화면 전환 버튼들
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('quitBtn').addEventListener('click', () => this.quitGame());
        document.getElementById('newGameBtn').addEventListener('click', () => this.startNewGame());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.showStartScreen());
        document.getElementById('watchAdBtn').addEventListener('click', () => this.showAd());
        document.getElementById('continueAfterAdBtn').addEventListener('click', () => this.continueAfterAd());
        
        // 모바일 게임 오버 팝업 이벤트
        document.getElementById('mobileWatchAdBtn').addEventListener('click', () => this.showMobileAd());
        document.getElementById('mobileNewGameBtn').addEventListener('click', () => this.startNewGame());
        document.getElementById('mobileBackToMenuBtn').addEventListener('click', () => this.showStartScreen());
        document.getElementById('mobileContinueAfterAdBtn').addEventListener('click', () => this.continueAfterMobileAd());
        
        // 전체화면 버튼
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
        
        // 모바일 컨트롤 버튼들
        document.getElementById('rotateBtn').addEventListener('click', () => this.rotatePiece());
        document.getElementById('dropBtn').addEventListener('click', () => this.hardDrop());
        
        // 키보드 컨트롤
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // 터치 컨트롤
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), {passive: false});
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), {passive: false});
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), {passive: false});
        
        // 마우스 컨트롤 (데스크탑에서도 사용 가능)
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // 닉네임 입력 엔터키
        document.getElementById('nicknameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startGame();
            }
        });
        
        // 전체화면 상태 리스너
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('msfullscreenchange', () => this.handleFullscreenChange());
    }
    
    // 화면 전환 메소드들
    showStartScreen() {
        this.hideAllScreens();
        this.hideMobileGameOverPopup(); // 모바일 팝업도 숨기기
        document.getElementById('startScreen').classList.remove('hidden');
        this.gameRunning = false;
        this.gamePaused = false;
        // 메인 메뉴에서는 자유로운 스크롤 허용
        this.enableScroll();
        // modal-active 클래스 제거
        document.body.classList.remove('modal-active');
        if (soundManager) soundManager.stopBgm();
    }
    
    showGameScreen() {
        this.hideAllScreens();
        document.getElementById('gameScreen').classList.remove('hidden');
        // 게임 화면에서는 modal-active 클래스 제거
        document.body.classList.remove('modal-active');
    }
    
    showGameOverScreen() {
        // 모바일에서는 팝업으로 표시, PC에서는 일반 화면으로 표시
        if (this.isMobile) {
            this.showMobileGameOverPopup();
        } else {
            // PC에서는 기존 방식 사용
            this.hideAllScreens();
            document.getElementById('gameOverScreen').classList.remove('hidden');
            document.getElementById('finalScore').textContent = this.score.toLocaleString();
            document.getElementById('finalLevel').textContent = this.level;
        }
        
        // 랭킹에 점수 추가
        if (rankingManager && this.playerName) {
            const rank = rankingManager.addScore(this.playerName, this.score, this.level, this.lines);
            console.log(`${this.playerName}님이 ${rank}위에 랭크인되었습니다!`);
            rankingManager.updateRankingDisplay();
        }
        
        if (soundManager) soundManager.playGameOver();
    }
    
    // 모바일 게임 오버 팝업 표시
    showMobileGameOverPopup() {
        document.getElementById('mobileGameOverPopup').classList.remove('hidden');
        document.getElementById('mobileFinalScore').textContent = this.score.toLocaleString();
        document.getElementById('mobileFinalLevel').textContent = this.level;
        
        // 팝업 오버레이 클릭 시 닫기
        document.querySelector('.popup-overlay').addEventListener('click', () => {
            this.hideMobileGameOverPopup();
            this.showStartScreen();
        });
    }
    
    // 모바일 게임 오버 팝업 숨기기
    hideMobileGameOverPopup() {
        document.getElementById('mobileGameOverPopup').classList.add('hidden');
        document.getElementById('mobileAdSection').classList.add('hidden');
        // 팝업 숨길 때 modal-active 클래스도 제거
        document.body.classList.remove('modal-active');
    }
    
    showPauseScreen() {
        this.hideAllScreens();
        document.getElementById('pauseScreen').classList.remove('hidden');
    }
    
    hideAllScreens() {
        // 모든 화면 숨기기
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // 모바일 팝업도 숨기기
        this.hideMobileGameOverPopup();
    }
    
    // 게임 상태 초기화
    resetGame() {
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.canContinue = false;
        this.dropInterval = 1000;
        this.lastTime = 0;
        this.initBoard();
    }

    // 게임 시작
    startGame() {
        const nicknameInput = document.getElementById('nicknameInput');
        this.playerName = nicknameInput.value.trim() || 'Anonymous';
        
        if (this.playerName.length > 10) {
            alert('닉네임은 10자 이하로 입력해주세요.');
            return;
        }
        
        document.getElementById('playerName').textContent = this.playerName;
        
        // 게임 상태를 완전히 초기화합니다.
        this.resetGame();
        
        // 모바일 브라우저의 렌더링 시간을 확보하기 위해 짧은 지연을 줍니다.
        setTimeout(() => {
            this.generateNextPiece();
            this.spawnNewPiece();
            
            // 만약 새 블록 생성 직후 게임 오버가 ���다면, 이는 초기화 오류일 가능성이 높습니다.
            // 이 경우, 게임을 시작하지 않고 문제를 기록합니다.
            if (this.gameOver) {
                console.error("게임 시작 직후 게임 오버 발생. 보드 상태:", JSON.stringify(this.board));
                // 사용자에게 다시 시도해달라는 메시지를 보여줄 수도 있습니다.
                this.showStartScreen(); // 시작 화면으로 돌려보내기
                return;
            }
            
            this.updateDisplay();
            this.showGameScreen();
            
            this.disableScroll();
            document.body.classList.remove('modal-active');
            
            this.gameRunning = true;
            this.lastTime = performance.now();
            this.gameLoop();
            
            if (soundManager) soundManager.playBgm(this.level);
        }, 50); // 50ms 지연
    }
    
    // 새 게임 시작 (게임 오버 후)
    startNewGame() {
        this.canContinue = false;
        // 모바일 팝업 숨기기
        this.hideMobileGameOverPopup();
        // modal-active 클래스 제거
        document.body.classList.remove('modal-active');
        this.startGame();
    }
    
    // 게임 종료
    quitGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        // 게임 영역 터치 제어 비활성화
        this.enableScroll();
        // 모바일 팝업이 열려있으면 닫기
        this.hideMobileGameOverPopup();
        // modal-active 클래스 제거
        document.body.classList.remove('modal-active');
        this.showStartScreen();
    }
    
    // 일시정지 토글
    togglePause() {
        if (!this.gameRunning || this.gameOver) return;
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            // 일시정지 시 모바일 게임 모드 해제 (화면 전환을 위해)
            this.enableScroll();
            this.hideAllScreens();
            document.getElementById('pauseScreen').classList.remove('hidden');
            
            // 전체화면 모드에서 일시정지 화면 중앙 정렬 강제
            if (this.isFullscreen) {
                // 즉시 적용하고 추가로 지연 적용으로 확실히 보장
                this.forceFullscreenGameOverCenter();
                setTimeout(() => {
                    this.forceFullscreenGameOverCenter();
                }, 50);
                setTimeout(() => {
                    this.forceFullscreenGameOverCenter();
                }, 200);
            }
            
            if (soundManager) soundManager.playPause();
        } else {
            // 게임 재개 시 모바일 게임 모드 다시 활성화
            document.body.classList.remove('modal-active'); // modal-active 클래스 제거
            this.disableScroll();
            this.hideAllScreens();
            document.getElementById('gameScreen').classList.remove('hidden');
            if (soundManager) soundManager.resumeFromPause();
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }
    
    // 광고 시청 (실제 광고 표시)
    showAd() {
        document.getElementById('adSection').classList.remove('hidden');
        
        // 광고 로딩 메시지 표시
        const adSection = document.getElementById('adSection');
        adSection.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div class="loading"></div>
                <p style="margin-top: 10px;">광고를 로드 중입니다...</p>
            </div>
            <button id="continueAfterAdBtn" class="hidden">광고 시청 완료 - 게임 계속하기</button>
        `;
        
        // 실제 AdSense 광고 로드 시도
        setTimeout(() => {
            try {
                // 새로운 광고 컨테이너 생성
                const adContainer = document.createElement('ins');
                adContainer.className = 'adsbygoogle';
                adContainer.style.cssText = 'display:block; width:300px; height:250px; margin:20px auto; background: rgba(255,255,255,0.1); border-radius: 10px;';
                adContainer.setAttribute('data-ad-client', 'ca-pub-9238912314245514');
                adContainer.setAttribute('data-ad-slot', '1234567890');
                adContainer.setAttribute('data-ad-format', 'rectangle');
                
                // 로딩 메시지를 광고로 교체
                adSection.innerHTML = '';
                adSection.appendChild(adContainer);
                
                // 시청 완료 버튼 추가
                const continueBtn = document.createElement('button');
                continueBtn.id = 'continueAfterAdBtn';
                continueBtn.className = 'hidden';
                continueBtn.textContent = '광고 시청 완료 - 게임 계속하기';
                continueBtn.addEventListener('click', () => this.continueAfterAd());
                adSection.appendChild(continueBtn);
                
                // AdSense 로드
                (adsbygoogle = window.adsbygoogle || []).push({});
                
                console.log('광고 로드 시도');
                
                // 광고가 로드되지 않으면 대체 내용 표시
                setTimeout(() => {
                    if (adContainer.innerHTML === '') {
                        adContainer.innerHTML = `
                            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white; text-align: center; flex-direction: column;">
                                <div style="font-size: 2em; margin-bottom: 10px;">🎮</div>
                                <div>공에서 제공하는 게임</div>
                                <div style="font-size: 0.8em; margin-top: 5px; opacity: 0.7;">잠시 후 계속할 수 있습니다</div>
                            </div>
                        `;
                    }
                }, 2000);
                
            } catch (error) {
                console.log('광고 로드 실패:', error);
                // 오류 시 대체 내용 표시
                adSection.innerHTML = `
                    <div style="text-align: center; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px; margin: 20px 0;">
                        <div style="font-size: 2em; margin-bottom: 10px;">🎮</div>
                        <div>게임을 계속하려면 잠시 기다려주세요</div>
                    </div>
                    <button id="continueAfterAdBtn" class="hidden">게임 계속하기</button>
                `;
                document.getElementById('continueAfterAdBtn').addEventListener('click', () => this.continueAfterAd());
            }
        }, 1000);
        
        // 5초 후 계속 버튼 활성화
        setTimeout(() => {
            const continueBtn = document.getElementById('continueAfterAdBtn');
            if (continueBtn) {
                continueBtn.classList.remove('hidden');
                continueBtn.style.opacity = '1';
                continueBtn.style.pointerEvents = 'auto';
            }
        }, 5000);
    }
    
    // 광고 시청 후 계속하기
    continueAfterAd() {
        if (!this.canContinue) return;
        
        this.gameOver = false;
        this.canContinue = false;
        
        // 보드만 초기화 (점수, 레벨은 유지)
        this.initBoard();
        
        // 새로운 피스 생성
        this.generateNextPiece();
        this.spawnNewPiece();
        
        this.showGameScreen();
        
        // 계속 플레이 시 게임 영역 터치 제어 활성화
        this.disableScroll();
        
        // modal-active 클래스 제거 (게임 재시작 시)
        document.body.classList.remove('modal-active');
        
        this.gameRunning = true;
        this.gamePaused = false;
        this.lastTime = performance.now();
        this.gameLoop();
        
        if (soundManager) soundManager.playBgm(this.level);
        
        // 광고 섹션 숨기기
        document.getElementById('adSection').classList.add('hidden');
        
        console.log('광고 시청 후 게임 재시작 - 점수 유지, 보드 초기화');
    }
    
    // 모바일 광고 시청
    showMobileAd() {
        document.getElementById('mobileAdSection').classList.remove('hidden');
        
        // 광고 로딩 메시지 표시
        const adSection = document.getElementById('mobileAdSection');
        adSection.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div class="loading"></div>
                <p style="margin-top: 10px;">광고를 로드 중입니다...</p>
            </div>
            <button id="mobileContinueAfterAdBtn" class="hidden">광고 시청 완료 - 게임 계속하기</button>
        `;
        
        // 실제 AdSense 광고 로드 시도
        setTimeout(() => {
            try {
                // 새로운 광고 컨테이너 생성
                const adContainer = document.createElement('ins');
                adContainer.className = 'adsbygoogle mobile-ad';
                adContainer.style.cssText = 'display:block; width:280px; height:200px; margin:15px auto; background: rgba(255,255,255,0.1); border-radius: 10px;';
                adContainer.setAttribute('data-ad-client', 'ca-pub-9238912314245514');
                adContainer.setAttribute('data-ad-slot', '1234567890');
                adContainer.setAttribute('data-ad-format', 'rectangle');
                
                // 로딩 메시지를 광고로 교체
                adSection.innerHTML = '';
                adSection.appendChild(adContainer);
                
                // 시청 완료 버튼 추가
                const continueBtn = document.createElement('button');
                continueBtn.id = 'mobileContinueAfterAdBtn';
                continueBtn.className = 'hidden';
                continueBtn.textContent = '광고 시청 완료 - 게임 계속하기';
                continueBtn.addEventListener('click', () => this.continueAfterMobileAd());
                adSection.appendChild(continueBtn);
                
                // AdSense 로드
                (adsbygoogle = window.adsbygoogle || []).push({});
                
                // 광고가 로드되지 않으면 대체 내용 표시
                setTimeout(() => {
                    if (adContainer.innerHTML === '') {
                        adContainer.innerHTML = `
                            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white; text-align: center; flex-direction: column;">
                                <div style="font-size: 2em; margin-bottom: 10px;">🎮</div>
                                <div>공에서 제공하는 게임</div>
                                <div style="font-size: 0.8em; margin-top: 5px; opacity: 0.7;">잠시 후 계속할 수 있습니다</div>
                            </div>
                        `;
                    }
                }, 2000);
                
            } catch (error) {
                console.log('모바일 광고 로드 실패:', error);
                // 오류 시 대체 내용 표시
                adSection.innerHTML = `
                    <div style="text-align: center; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px; margin: 20px 0;">
                        <div style="font-size: 2em; margin-bottom: 10px;">🎮</div>
                        <div>게임을 계속하려면 잠시 기다려주세요</div>
                    </div>
                    <button id="mobileContinueAfterAdBtn" class="hidden">게임 계속하기</button>
                `;
                document.getElementById('mobileContinueAfterAdBtn').addEventListener('click', () => this.continueAfterMobileAd());
            }
        }, 1000);
        
        // 5초 후 계속 버튼 활성화
        setTimeout(() => {
            const continueBtn = document.getElementById('mobileContinueAfterAdBtn');
            if (continueBtn) {
                continueBtn.classList.remove('hidden');
                continueBtn.style.opacity = '1';
                continueBtn.style.pointerEvents = 'auto';
            }
        }, 5000);
    }
    
    // 모바일 광고 시청 후 계속하기
    continueAfterMobileAd() {
        if (!this.canContinue) return;
        
        this.gameOver = false;
        this.canContinue = false;
        
        // 보드만 초기화 (점수, 레벨은 유지)
        this.initBoard();
        
        // 새로운 피스 생성
        this.generateNextPiece();
        this.spawnNewPiece();
        
        // 팝업 숨기기
        this.hideMobileGameOverPopup();
        
        this.showGameScreen();
        
        // 계속 플레이 시 게임 영역 터치 제어 활성화
        this.disableScroll();
        
        // modal-active 클래스 제거 (게임 재시작 시)
        document.body.classList.remove('modal-active');
        
        this.gameRunning = true;
        this.gamePaused = false;
        this.lastTime = performance.now();
        this.gameLoop();
        
        if (soundManager) soundManager.playBgm(this.level);
        
        console.log('모바일 광고 시청 후 게임 재시작 - 점수 유지, 보드 초기화');
    }
    
    // 전체화면 토글
    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }
    
    // 전체화면 진입
    enterFullscreen() {
        const elem = document.documentElement;
        
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
        
        // 전체화면 스타일 적용
        document.body.classList.add('fullscreen-mode');
        this.isFullscreen = true;
        
        // 버튼 텍스트 변경
        document.getElementById('fullscreenBtn').innerHTML = '⤋';
        document.getElementById('fullscreenBtn').title = '전체화면 해제';
        
        // 캔버스 크기 조정 및 화면 상태 체크
        setTimeout(() => {
            this.resizeCanvasForFullscreen();
            
            // 현재 화면이 게임 오버나 일시정지인 경우 중앙 정렬 강제 - 다단계 적용
            if (!document.getElementById('gameOverScreen').classList.contains('hidden') ||
                !document.getElementById('pauseScreen').classList.contains('hidden')) {
                // 즉시 적용
                this.forceFullscreenGameOverCenter();
                // 50ms 후 재적용
                setTimeout(() => this.forceFullscreenGameOverCenter(), 50);
                // 150ms 후 재적용
                setTimeout(() => this.forceFullscreenGameOverCenter(), 150);
                // 300ms 후 최종 적용
                setTimeout(() => this.forceFullscreenGameOverCenter(), 300);
            }
        }, 100);
        
        // 둘러보기 방지용 추가 체크 (500ms, 1s 후)
        setTimeout(() => {
            if (!document.getElementById('gameOverScreen').classList.contains('hidden') ||
                !document.getElementById('pauseScreen').classList.contains('hidden')) {
                this.forceFullscreenGameOverCenter();
            }
        }, 500);
        
        setTimeout(() => {
            if (!document.getElementById('gameOverScreen').classList.contains('hidden') ||
                !document.getElementById('pauseScreen').classList.contains('hidden')) {
                this.forceFullscreenGameOverCenter();
            }
        }, 1000);
    }
    
    // 전체화면 해제
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
        
        // 전체화면 스타일 제거
        document.body.classList.remove('fullscreen-mode');
        document.body.classList.remove('modal-active'); // modal-active 클래스도 제거
        this.isFullscreen = false;
        
        // 버튼 텍스트 변경
        document.getElementById('fullscreenBtn').innerHTML = '⛶';
        document.getElementById('fullscreenBtn').title = '전체화면';
        
        // 캔버스 크기 복원
        setTimeout(() => {
            this.initCanvas();
        }, 100);
    }
    
    // 전체화면에서 게임 오버 화면 중앙 정렬 강제 - 완벽한 최종 버전
    forceFullscreenGameOverCenter() {
        const gameOverScreen = document.getElementById('gameOverScreen');
        const pauseScreen = document.getElementById('pauseScreen');
        
        // 모달 화면이 활성화된 경우만 modal-active 클래스 추가
        const isModalActive = (gameOverScreen && !gameOverScreen.classList.contains('hidden')) ||
                              (pauseScreen && !pauseScreen.classList.contains('hidden'));
        
        if (isModalActive) {
            document.body.classList.add('modal-active');
        } else {
            document.body.classList.remove('modal-active');
            return; // 모달이 비활성 상태면 중앙 정렬 실행 안함
        }
        
        if (gameOverScreen && !gameOverScreen.classList.contains('hidden')) {
            // 전체화면 모드 강제 적용
            document.body.classList.add('fullscreen-mode');
            
            // 모든 인라인 스타일 완전 초기화 후 새로 적용
            gameOverScreen.removeAttribute('style');
            
            // CSS 클래스로 먼저 처리한 다음 인라인으로 확실히 고정
            setTimeout(() => {
                this.applyFullscreenCenterStyles(gameOverScreen);
            }, 10);
        }
        
        if (pauseScreen && !pauseScreen.classList.contains('hidden')) {
            // 전체화면 모드 강제 적용
            document.body.classList.add('fullscreen-mode');
            
            // 모든 인라인 스타일 완전 초기화 후 새로 적용
            pauseScreen.removeAttribute('style');
            
            // CSS 클래스로 먼저 처리한 다음 인라인으로 확실히 고정
            setTimeout(() => {
                this.applyFullscreenCenterStyles(pauseScreen);
            }, 10);
        }
    }
    
    // 전체화면 중앙 정렬 스타일 적용 (별도 메서드)
    applyFullscreenCenterStyles(screen) {
        // 기본 전체화면 레이아웃 - 무조건 Flexbox 중앙 정렬
        screen.style.cssText = `
            all: initial !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 20px !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            text-align: center !important;
            background: rgba(0, 0, 0, 0.9) !important;
            backdrop-filter: blur(10px) !important;
            z-index: 10000 !important;
            font-family: Arial, sans-serif !important;
            color: white !important;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3) !important;
            overflow-y: auto !important;
        `;
        
        // 모든 직계 자식 요소들 스타일 재설정
        Array.from(screen.children).forEach(child => {
            child.style.cssText = `
                display: block !important;
                width: auto !important;
                max-width: min(90vw, 500px) !important;
                min-width: 280px !important;
                margin: 10px auto !important;
                text-align: center !important;
                position: relative !important;
                left: auto !important;
                right: auto !important;
                top: auto !important;
                bottom: auto !important;
                transform: none !important;
                float: none !important;
                font-family: inherit !important;
                color: inherit !important;
            `;
            
            // 특정 요소별 추가 스타일
            if (child.tagName === 'H2') {
                child.style.cssText += `
                    font-size: 2.5em !important;
                    margin: 20px auto !important;
                    color: ${screen.id === 'gameOverScreen' ? '#e74c3c' : '#3498db'} !important;
                    text-shadow: 0 2px 8px ${screen.id === 'gameOverScreen' ? 'rgba(231, 76, 60, 0.5)' : 'rgba(52, 152, 219, 0.5)'} !important;
                `;
            }
            
            if (child.classList.contains('final-score') || child.classList.contains('continue-section')) {
                const bgColor = child.classList.contains('final-score') ? 
                    'linear-gradient(135deg, rgba(231,76,60,0.2), rgba(230,126,34,0.2))' :
                    'linear-gradient(135deg, rgba(52,152,219,0.2), rgba(46,204,113,0.2))';
                    
                child.style.cssText += `
                    background: ${bgColor} !important;
                    padding: 20px !important;
                    border-radius: 15px !important;
                    backdrop-filter: blur(15px) !important;
                    border: 2px solid rgba(255,255,255,0.2) !important;
                    box-shadow: 0 8px 25px rgba(52, 152, 219, 0.2) !important;
                    width: 80% !important;
                `;
            }
            
            // 모든 하위 버튼들 스타일
            const buttons = child.querySelectorAll('button');
            buttons.forEach(button => {
                button.style.cssText = `
                    padding: 15px 25px !important;
                    font-size: 1.1em !important;
                    background: linear-gradient(45deg, #3498db, #2ecc71) !important;
                    color: white !important;
                    border: 2px solid transparent !important;
                    border-radius: 25px !important;
                    cursor: pointer !important;
                    transition: all 0.3s ease !important;
                    margin: 5px !important;
                    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3) !important;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
                    font-weight: bold !important;
                    font-family: Arial, sans-serif !important;
                `;
            });
        });
        
        // 컨테이너가 있다면 완전히 제거
        const container = screen.querySelector('.container');
        if (container) {
            container.style.cssText = 'all: unset !important; display: contents !important;';
        }
    }
    
    // 전체화면용 캔버스 크기 조정 - 정확한 1:2 비율 유지
    resizeCanvasForFullscreen() {
        const availableHeight = window.innerHeight - 120; // 헤더와 컨트롤 여백 고려
        const availableWidth = window.innerWidth - 400; // 사이드 패널 여백 고려
        
        // 게임 비율 유지 (10:20 = 1:2) - 정확한 비율
        const gameRatio = 0.5; // 1:2 비율 (width:height)
        
        let canvasWidth, canvasHeight;
        
        // 사용 가능한 공간에 맞게 크기 결정하되 정확한 비율 유지
        if (availableWidth / gameRatio <= availableHeight) {
            // 너비가 제한 요소
            canvasWidth = Math.min(availableWidth, 400); // 최대 400px
            canvasHeight = canvasWidth / gameRatio; // 정확히 2배
        } else {
            // 높이가 제한 요소
            canvasHeight = Math.min(availableHeight, 800); // 최대 800px
            canvasWidth = canvasHeight * gameRatio; // 정확히 절반
        }
        
        // 최소 크기 보장하되 비율 유지
        if (canvasWidth < 250) {
            canvasWidth = 250;
            canvasHeight = canvasWidth / gameRatio; // 500px
        }
        if (canvasHeight < 500) {
            canvasHeight = 500;
            canvasWidth = canvasHeight * gameRatio; // 250px
        }
        
        // 보드 크기에 맞게 블록 크기 재계산
        this.BLOCK_SIZE = canvasWidth / this.BOARD_WIDTH;
        
        // 캔버스 크기 업데이트
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        this.canvas.width = canvasWidth * devicePixelRatio;
        this.canvas.height = canvasHeight * devicePixelRatio;
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
        
        // 즉시 화면 다시 그리기
        if (this.gameRunning) {
            this.draw();
        }
    }
    
    // 전체화면 상태 변경 처리
    handleFullscreenChange() {
        const isCurrentlyFullscreen = !!(document.fullscreenElement || 
                                        document.webkitFullscreenElement || 
                                        document.msFullscreenElement);
        
        if (!isCurrentlyFullscreen && this.isFullscreen) {
            // 전체화면에서 나온 경우
            this.isFullscreen = false;
            document.body.classList.remove('fullscreen-mode');
            document.body.classList.remove('modal-active'); // modal-active 클래스도 제거
            document.getElementById('fullscreenBtn').innerHTML = '⛶';
            document.getElementById('fullscreenBtn').title = '전체화면';
            
            setTimeout(() => {
                this.initCanvas();
            }, 100);
        } else if (isCurrentlyFullscreen && this.isFullscreen) {
            // 전체화면 모드에서 게임 오버/일시정지 화면 체크 및 강제 적용
            setTimeout(() => {
                if (!document.getElementById('gameOverScreen').classList.contains('hidden') ||
                    !document.getElementById('pauseScreen').classList.contains('hidden')) {
                    this.forceFullscreenGameOverCenter();
                    // 추가 확인 및 재적용
                    setTimeout(() => {
                        this.forceFullscreenGameOverCenter();
                    }, 100);
                }
            }, 100);
            
            // 더 늦게 한 번 더 확실히 적용
            setTimeout(() => {
                if (!document.getElementById('gameOverScreen').classList.contains('hidden') ||
                    !document.getElementById('pauseScreen').classList.contains('hidden')) {
                    this.forceFullscreenGameOverCenter();
                }
            }, 500);
        }
    }
    
    // 키보드 입력 처리
    handleKeyDown(e) {
        if (!this.gameRunning || this.gamePaused || this.gameOver) return;
        
        switch (e.key) {
            case 'ArrowLeft':
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':  // 상단 화살표만 회전
                this.rotatePiece();
                break;
            case ' ':  // 스페이스바는 하드드롭
                this.hardDrop();
                break;
            case 'Enter':  // 엔터도 하드드롭 유지
                this.hardDrop();
                break;
        }
        e.preventDefault();
    }
    
    // 터치 입력 처리
    handleTouchStart(e) {
        if (!this.gameRunning || this.gamePaused || this.gameOver) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
        this.isDragging = false;
    }
    
    handleTouchMove(e) {
        if (!this.gameRunning || this.gamePaused || this.gameOver) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        
        // 드래그 감지
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            this.isDragging = true;
            
            // 수평 이동
            if (Math.abs(deltaX) > this.minSwipeDistance / 2) {
                if (deltaX > 0) {
                    this.movePiece(1, 0);
                } else {
                    this.movePiece(-1, 0);
                }
                this.touchStartX = touch.clientX;
            }
        }
    }
    
    handleTouchEnd(e) {
        if (!this.gameRunning || this.gamePaused || this.gameOver) return;
        
        e.preventDefault();
        const touchDuration = Date.now() - this.touchStartTime;
        
        if (!this.isDragging && touchDuration < 300) {
            // 짧은 터치 = 회전
            this.rotatePiece();
        } else if (this.isDragging) {
            const touch = e.changedTouches[0];
            const deltaY = touch.clientY - this.touchStartY;
            
            // 아래로 스와이프 = 하드드롭
            if (deltaY > this.minSwipeDistance) {
                this.hardDrop();
            }
        }
    }
    
    // 마우스 입력 처리 (터치와 동일한 로직)
    handleMouseDown(e) {
        this.touchStartX = e.clientX;
        this.touchStartY = e.clientY;
        this.touchStartTime = Date.now();
        this.isDragging = false;
    }
    
    handleMouseMove(e) {
        if (e.buttons !== 1) return; // 마우스 버튼이 눌려있지 않으면 리턴
        
        const deltaX = e.clientX - this.touchStartX;
        const deltaY = e.clientY - this.touchStartY;
        
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            this.isDragging = true;
            
            if (Math.abs(deltaX) > this.minSwipeDistance / 2) {
                if (deltaX > 0) {
                    this.movePiece(1, 0);
                } else {
                    this.movePiece(-1, 0);
                }
                this.touchStartX = e.clientX;
            }
        }
    }
    
    handleMouseUp(e) {
        const touchDuration = Date.now() - this.touchStartTime;
        
        if (!this.isDragging && touchDuration < 300) {
            this.rotatePiece();
        } else if (this.isDragging) {
            const deltaY = e.clientY - this.touchStartY;
            if (deltaY > this.minSwipeDistance) {
                this.hardDrop();
            }
        }
    }
    
    // 새로운 피스 생성
    generateNextPiece() {
        const randomIndex = Math.floor(Math.random() * this.pieceTypes.length);
        const pieceType = this.pieceTypes[randomIndex];
        
        this.nextPiece = {
            type: pieceType,
            shape: this.pieces[pieceType].shape,
            color: this.pieces[pieceType].color,
            x: 0,
            y: 0
        };
    }
    
    spawnNewPiece() {
        if (!this.nextPiece) {
            this.generateNextPiece();
        }
        
        this.currentPiece = {
            ...this.nextPiece,
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.nextPiece.shape[0].length / 2),
            y: 0
        };
        
        // 게임 오버 체크
        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.endGame();
            return;
        }
        
        this.generateNextPiece();
        this.drawNextPiece();
    }
    
    // 피스 이동
    movePiece(dx, dy) {
        if (!this.currentPiece) return false;
        
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            return true;
        }
        
        return false;
    }
    
    // 피스 회전
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotatedShape = this.rotateMatrix(this.currentPiece.shape);
        
        // 회전 후 위치 조정 (벽 킥)
        let newX = this.currentPiece.x;
        let newY = this.currentPiece.y;
        
        // 오른쪽 벽에 걸리는 경우 왼쪽으로 이동
        if (newX + rotatedShape[0].length > this.BOARD_WIDTH) {
            newX = this.BOARD_WIDTH - rotatedShape[0].length;
        }
        
        // 왼쪽 벽에 걸리는 경우 오른쪽으로 이동
        if (newX < 0) {
            newX = 0;
        }
        
        if (!this.checkCollision(newX, newY, rotatedShape)) {
            this.currentPiece.shape = rotatedShape;
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            
            if (soundManager) soundManager.playPieceRotate();
        }
    }
    
    // 매트릭스 회전 (시계방향 90도)
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    // 하드 드롭
    hardDrop() {
        if (!this.currentPiece) return;
        
        while (this.movePiece(0, 1)) {
            // 계속 아래로 이동
        }
        
        this.lockPiece();
        if (soundManager) soundManager.playPieceDrop();
    }
    
    // 충돌 검사
    checkCollision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    // 경계 검사
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT) {
                        return true;
                    }
                    
                    // 보드와의 충돌 검사
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    // 피스 고정
    lockPiece() {
        if (!this.currentPiece) return;
        
        // 보드에 피스 배치
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const boardY = this.currentPiece.y + row;
                    const boardX = this.currentPiece.x + col;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // 라인 클리어 체크
        this.clearLines();
        
        // 새 피스 생성
        this.spawnNewPiece();
    }
    
    // 라인 클리어
    clearLines() {
        const linesToClear = [];
        
        // 완성된 라인 찾기
        for (let row = this.BOARD_HEIGHT - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                linesToClear.push(row);
            }
        }
        
        if (linesToClear.length > 0) {
            // 게임 로직을 일시 정지
            this.gameRunning = false;
            
            // 점수 계산
            this.addScore(linesToClear.length);
            
            this.lines += linesToClear.length;
            
            // 레벨 업 체크
            this.checkLevelUp();
            
            // 화면 업데이트
            this.updateDisplay();
            
            // 라인 클리어 시각 효과 (라인 제거 전에 실제 위치 전달)
            this.showLineClearEffect(linesToClear);
            
            // 사운드 재생
            if (soundManager) soundManager.playLineClear(linesToClear.length);
        }
    }
    
    // 라인 클리어 시각 효과 (실제 지워진 라인 위치에만 효과)
    showLineClearEffect(linesToClear) {
        // 지워진 라인 위치 저장
        this.clearedLinePositions = [...linesToClear];
        
        let flashCount = 0;
        const maxFlashes = 6;
        
        const flashInterval = setInterval(() => {
            // 기본 화면 그리기
            this.draw();
            
            if (flashCount % 2 === 0) {
                // 실제 지워진 라인 위치에 임팩트 효과 표시
                this.drawLineClearImpact(this.clearedLinePositions);
            }
            
            flashCount++;
            
            if (flashCount >= maxFlashes) {
                clearInterval(flashInterval);
                // 정리된 보드로 라인 제거 완료
                this.completeClearLines();
            }
        }, 80);
    }
    
    // 라인 클리어 완료 (보드 정리)
    completeClearLines() {
        // 라인 제거 (애니메이션 후 실제 제거)
        for (let i = this.clearedLinePositions.length - 1; i >= 0; i--) {
            const row = this.clearedLinePositions[i];
            this.board.splice(row, 1);
            this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
        }
        
        // 최종적으로 정상 그리기
        this.draw();
        
        // 게임 재개
        this.gameRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    // 라인 클리어 임팩트 효과 그리기 (실제 위치에)
    drawLineClearImpact(clearedLines) {
        // 실제 지워진 라인 위치에만 임팩트 효과
        clearedLines.forEach(lineRow => {
            const y = lineRow * this.BLOCK_SIZE;
            
            // 번쩍이는 라인 효과
            const gradient = this.ctx.createLinearGradient(
                0, y,
                this.BOARD_WIDTH * this.BLOCK_SIZE, y + this.BLOCK_SIZE
            );
            
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.9)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, y, this.BOARD_WIDTH * this.BLOCK_SIZE, this.BLOCK_SIZE);
            
            // 파티클 효과
            for (let p = 0; p < 15; p++) {
                const x = Math.random() * this.BOARD_WIDTH * this.BLOCK_SIZE;
                const particleY = y + Math.random() * this.BLOCK_SIZE;
                
                this.ctx.fillStyle = `rgba(255, ${Math.floor(200 + Math.random() * 55)}, 0, ${0.7 + Math.random() * 0.3})`;
                this.ctx.fillRect(x, particleY, 2, 2);
            }
        });
    }
    
    // 점수 추가
    addScore(linesCleared) {
        const baseScore = [0, 40, 100, 300, 1200]; // 0, 1, 2, 3, 4줄 클리어 점수
        const scoreToAdd = baseScore[linesCleared] * this.level;
        this.score += scoreToAdd;
        
        this.updateDisplay();
    }
    
    // 레벨 업 체크
    checkLevelUp() {
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 100);
            
            if (soundManager) {
                soundManager.playLevelUp();
                soundManager.currentLevel = this.level;
            }
        }
    }
    
    // 게임 오버
    endGame() {
        this.gameRunning = false;
        this.gameOver = true;
        this.canContinue = true; // 광고 시청 후 이어하기 가능
        
        // 게임 오버 시 모바일 게임 모드 해제 (화면 전환을 위해)
        this.enableScroll();
        
        // 게임 오버 시 현재 상태 저장 (점수, 레벨, 라인은 유지)
        console.log('게임 오버 - 점수:', this.score, '레벨:', this.level, '라인:', this.lines);
        
        // 전체화면 모드에서 게임 오버 화면 중앙 정렬 강제
        if (this.isFullscreen) {
            // 즉시 적용하고 추가로 지연 적용으로 확실히 보장
            this.forceFullscreenGameOverCenter();
            setTimeout(() => {
                this.forceFullscreenGameOverCenter();
            }, 50);
            setTimeout(() => {
                this.forceFullscreenGameOverCenter();
            }, 200);
        }
        
        this.showGameOverScreen();
    }
    
    // 고스트 피스 (예상 위치) 계산
    getGhostPiece() {
        if (!this.currentPiece) return null;
        
        let ghostY = this.currentPiece.y;
        
        while (!this.checkCollision(this.currentPiece.x, ghostY + 1, this.currentPiece.shape)) {
            ghostY++;
        }
        
        return {
            ...this.currentPiece,
            y: ghostY
        };
    }
    
    // 게임 루프
    gameLoop() {
        if (!this.gameRunning || this.gamePaused || this.gameOver) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.dropTimer += deltaTime;
        
        if (this.dropTimer >= this.dropInterval) {
            if (!this.movePiece(0, 1)) {
                this.lockPiece();
            }
            this.dropTimer = 0;
        }
        
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // 화면 그리기
    draw() {
        // 동적 배경 그리기
        this.drawDynamicBackground();
        
        // 보드 그리기
        this.drawBoard();
        
        // 고스트 피스 그리기
        this.drawGhostPiece();
        
        // 현재 피스 그리기
        this.drawCurrentPiece();
        
        // 격자 그리기
        this.drawGrid();
    }
    
    // 동적 배경 그리기 (부드러운 색상)
    drawDynamicBackground() {
        // 부드러운 그라데이션 배경
        const gradient = this.ctx.createLinearGradient(
            0, 0,
            this.canvas.width, this.canvas.height
        );
        
        // 레벨에 따른 부드러운 색상 변화
        const intensity = Math.min(1, this.level * 0.05);
        
        const r1 = Math.floor(25 + (15 * intensity));
        const g1 = Math.floor(35 + (20 * intensity));
        const b1 = Math.floor(55 + (25 * intensity));
        
        const r2 = Math.floor(15 + (10 * intensity));
        const g2 = Math.floor(25 + (15 * intensity));
        const b2 = Math.floor(45 + (20 * intensity));
        
        gradient.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, 0.95)`);
        gradient.addColorStop(0.5, `rgba(${Math.floor((r1+r2)/2)}, ${Math.floor((g1+g2)/2)}, ${Math.floor((b1+b2)/2)}, 0.9)`);
        gradient.addColorStop(1, `rgba(${r2}, ${g2}, ${b2}, 0.85)`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawBoard() {
        for (let row = 0; row < this.BOARD_HEIGHT; row++) {
            for (let col = 0; col < this.BOARD_WIDTH; col++) {
                if (this.board[row][col]) {
                    this.drawBlock(col, row, this.board[row][col]);
                }
            }
        }
    }
    
    drawCurrentPiece() {
        if (!this.currentPiece) return;
        
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const x = this.currentPiece.x + col;
                    const y = this.currentPiece.y + row;
                    if (y >= 0) {
                        this.drawBlock(x, y, this.currentPiece.color);
                    }
                }
            }
        }
    }
    
    drawGhostPiece() {
        const ghostPiece = this.getGhostPiece();
        if (!ghostPiece || ghostPiece.y === this.currentPiece.y) return;
        
        for (let row = 0; row < ghostPiece.shape.length; row++) {
            for (let col = 0; col < ghostPiece.shape[row].length; col++) {
                if (ghostPiece.shape[row][col]) {
                    const x = ghostPiece.x + col;
                    const y = ghostPiece.y + row;
                    if (y >= 0) {
                        this.drawBlock(x, y, ghostPiece.color, true); // 고스트 피스임을 표시
                    }
                }
            }
        }
    }
    
    drawBlock(x, y, color, isGhost = false) {
        const pixelX = x * this.BLOCK_SIZE;
        const pixelY = y * this.BLOCK_SIZE;
        
        // 부드러운 그라데이션 생성
        const gradient = this.ctx.createLinearGradient(
            pixelX, pixelY, 
            pixelX + this.BLOCK_SIZE, pixelY + this.BLOCK_SIZE
        );
        
        if (isGhost) {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        } else {
            // 더 부드러운 3D 효과
            const brightColor = this.brightenColor(color, 0.2);
            const darkColor = this.darkenColor(color, 0.15);
            
            gradient.addColorStop(0, brightColor);
            gradient.addColorStop(0.4, color);
            gradient.addColorStop(1, darkColor);
        }
        
        // 블록 그리기
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // 부드러운 테두리
        if (!isGhost) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(pixelX + 0.5, pixelY + 0.5, this.BLOCK_SIZE - 1, this.BLOCK_SIZE - 1);
            
            // 부드러운 하이라이트
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, 2);
            this.ctx.fillRect(pixelX + 1, pixelY + 1, 2, this.BLOCK_SIZE - 2);
            
            // 부드러운 쉐도우
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            this.ctx.fillRect(pixelX + this.BLOCK_SIZE - 3, pixelY + 3, 2, this.BLOCK_SIZE - 6);
            this.ctx.fillRect(pixelX + 3, pixelY + this.BLOCK_SIZE - 3, this.BLOCK_SIZE - 6, 2);
        } else {
            // 고스트 피스용 부드러운 테두리
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        }
    }
    
    // 색상 밝게 하기
    brightenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.min(255, Math.floor(parseInt(hex.substr(0, 2), 16) * (1 + factor)));
        const g = Math.min(255, Math.floor(parseInt(hex.substr(2, 2), 16) * (1 + factor)));
        const b = Math.min(255, Math.floor(parseInt(hex.substr(4, 2), 16) * (1 + factor)));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    // 색상 어둡게 하기
    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    drawGrid() {
        // 부드러운 격자
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 0.5;
        
        // 세로선
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.BOARD_HEIGHT * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        // 가로선
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.BOARD_WIDTH * this.BLOCK_SIZE, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawNextPiece() {
        if (!this.nextPiece) return;
        
        // 캔버스 초기화
        // 다음 피스 배경 - 부드러운 그라데이션
        const miniGradient = this.nextCtx.createRadialGradient(
            30, 30, 0, 30, 30, 30
        );
        miniGradient.addColorStop(0, 'rgba(50, 60, 80, 0.9)');
        miniGradient.addColorStop(1, 'rgba(30, 40, 60, 0.95)');
        
        this.nextCtx.fillStyle = miniGradient;
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const blockSize = 12;
        const offsetX = (60 - this.nextPiece.shape[0].length * blockSize) / 2;
        const offsetY = (60 - this.nextPiece.shape.length * blockSize) / 2;
        
        for (let row = 0; row < this.nextPiece.shape.length; row++) {
            for (let col = 0; col < this.nextPiece.shape[row].length; col++) {
                if (this.nextPiece.shape[row][col]) {
                    const x = offsetX + col * blockSize;
                    const y = offsetY + row * blockSize;
                    
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(x, y, blockSize, blockSize);
                    
                    this.nextCtx.strokeStyle = '#ffffff';
                    this.nextCtx.lineWidth = 1;
                    this.nextCtx.strokeRect(x, y, blockSize, blockSize);
                }
            }
        }
    }
    
    // 디스플레이 업데이트
    updateDisplay() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
}

// 게임 인스턴스 생성
let tetrisGame;

// DOM 로드 완료 시 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
    tetrisGame = new TetrisGame();
});
