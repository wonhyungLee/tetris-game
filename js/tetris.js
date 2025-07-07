// 테트리스 게임 클래스 - 모바일 문제 완전 해결 버전
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
        
        // 초기화 상태 추적
        this.isInitialized = false;
        this.isStarting = false;
        
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
        
        // 초기화를 지연시켜 DOM이 완전히 로드된 후 실행
        this.delayedInit();
    }
    
    // 지연된 초기화
    delayedInit() {
        // DOM이 완전히 로드될 때까지 기다림
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.init(), 100);
            });
        } else {
            setTimeout(() => this.init(), 100);
        }
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
            'blackberry', 'iemobile', 'opera mini', 'mobile',
            'samsung', 'nokia', 'motorola', 'lg ', 'huawei'
        ];
        
        const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
        
        // 터치 지원 여부도 확인
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // 화면 크기 확인 (모바일에서는 보통 768px 이하)
        const isSmallScreen = window.innerWidth <= 768 && window.innerHeight <= 1024;
        
        // 모바일 브라우저의 특성 확인
        const isMobileBrowser = /Mobi|Android/i.test(navigator.userAgent);
        
        // CSS 미디어 쿼리로도 확인
        const mediaQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
        const isTouchDevice = mediaQuery.matches;
        
        // 여러 조건을 종합적으로 판단
        const result = isMobileUserAgent || isMobileBrowser || 
                      (hasTouchScreen && isSmallScreen) || isTouchDevice;
        
        console.log('모바일 감지 결과:', {
            userAgent: userAgent,
            isMobileUserAgent,
            hasTouchScreen,
            isSmallScreen,
            isMobileBrowser,
            isTouchDevice,
            screenSize: { width: window.innerWidth, height: window.innerHeight },
            finalResult: result
        });
        
        return result;
    }
    
    // 스크롤 제어 (게임 영역만 터치 제어)
    disableScroll() {
        // 현재 스크롤 위치 저장
        this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        // body에 게임 활성 클래스 추가
        document.body.classList.add('game-active');
        
        // 게임 캔버스에만 터치 제어 적용
        if (this.canvas) {
            this.canvas.addEventListener('touchmove', this.preventCanvasScroll, { passive: false });
            this.canvas.addEventListener('touchstart', this.preventCanvasScroll, { passive: false });
        }
        
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
        if (this.canvas) {
            this.canvas.removeEventListener('touchmove', this.preventCanvasScroll);
            this.canvas.removeEventListener('touchstart', this.preventCanvasScroll);
        }
        
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
        console.log("게임 초기화 시작", { 
            isMobile: this.isMobile,
            screenSize: { width: window.innerWidth, height: window.innerHeight },
            userAgent: navigator.userAgent
        });
        
        try {
            // DOM 요소 확인
            if (!this.verifyDOMElements()) {
                console.error("DOM 요소 검증 실패");
                setTimeout(() => this.init(), 500); // 0.5초 후 재시도
                return;
            }
            
            // 모바일 팝업 요소 추가 검증
            this.verifyMobilePopupElements();
            
            this.initCanvas();
            this.initBoard();
            this.bindEvents();
            this.showStartScreen();
            this.isInitialized = true;
            
            console.log("게임 초기화 완료");
        } catch (error) {
            console.error("게임 초기화 실패:", error);
            setTimeout(() => this.init(), 500); // 0.5초 후 재시도
        }
    }
    
    // 모바일 팝업 요소 검증
    verifyMobilePopupElements() {
        const mobileElements = [
            'mobileGameOverPopup',
            'mobileFinalScore', 
            'mobileFinalLevel',
            'mobileWatchAdBtn',
            'mobileNewGameBtn', 
            'mobileBackToMenuBtn'
        ];
        
        for (const elementId of mobileElements) {
            const element = document.getElementById(elementId);
            if (!element) {
                console.warn(`모바일 팝업 요소를 찾을 수 없음: ${elementId}`);
            } else {
                console.log(`모바일 팝업 요소 확인: ${elementId}`);
            }
        }
        
        // 팝업 오버레이 확인
        const overlay = document.querySelector('.popup-overlay');
        if (!overlay) {
            console.warn('팝업 오버레이를 찾을 수 없음');
        } else {
            console.log('팝업 오버레이 확인 완료');
        }
    }
    
    // DOM 요소 검증
    verifyDOMElements() {
        const requiredElements = [
            'gameCanvas', 'nextCanvas', 'startBtn', 'nicknameInput',
            'startScreen', 'gameScreen', 'score', 'level', 'lines'
        ];
        
        for (const elementId of requiredElements) {
            const element = document.getElementById(elementId);
            if (!element) {
                console.error(`필수 DOM 요소를 찾을 수 없음: ${elementId}`);
                return false;
            }
        }
        
        return true;
    }
    
    initCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
    
        if (!this.canvas || !this.ctx || !this.nextCanvas || !this.nextCtx) {
            throw new Error("캔버스 초기화 실패");
        }
    
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
        
        console.log("캔버스 초기화 완료", {
            canvasSize: { width: canvasWidth, height: canvasHeight },
            devicePixelRatio
        });
    }
    
    initBoard() {
        // 보드를 안전하게 초기화
        this.board = [];
        for (let row = 0; row < this.BOARD_HEIGHT; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.BOARD_WIDTH; col++) {
                this.board[row][col] = 0;
            }
        }
        
        // 초기화 검증
        if (this.board.length !== this.BOARD_HEIGHT) {
            throw new Error(`보드 높이 초기화 실패: ${this.board.length} != ${this.BOARD_HEIGHT}`);
        }
        
        if (this.board[0] && this.board[0].length !== this.BOARD_WIDTH) {
            throw new Error(`보드 너비 초기화 실패: ${this.board[0].length} != ${this.BOARD_WIDTH}`);
        }
        
        console.log("보드 초기화 완료:", this.board.length, "x", this.board[0].length);
    }
    
    bindEvents() {
        // 화면 전환 버튼들
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn')?.addEventListener('click', () => this.togglePause());
        document.getElementById('resumeBtn')?.addEventListener('click', () => this.togglePause());
        document.getElementById('quitBtn')?.addEventListener('click', () => this.quitGame());
        document.getElementById('newGameBtn')?.addEventListener('click', () => this.startNewGame());
        document.getElementById('backToMenuBtn')?.addEventListener('click', () => this.showStartScreen());
        document.getElementById('watchAdBtn')?.addEventListener('click', () => this.showAd());
        document.getElementById('continueAfterAdBtn')?.addEventListener('click', () => this.continueAfterAd());
        
        // 모바일 게임 오버 팝업 이벤트 (안전한 바인딩)
        const mobileWatchAdBtn = document.getElementById('mobileWatchAdBtn');
        const mobileNewGameBtn = document.getElementById('mobileNewGameBtn');
        const mobileBackToMenuBtn = document.getElementById('mobileBackToMenuBtn');
        const mobileContinueAfterAdBtn = document.getElementById('mobileContinueAfterAdBtn');
        
        if (mobileWatchAdBtn) {
            mobileWatchAdBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('모바일 광고 시청 버튼 클릭');
                this.showMobileAd();
            });
        }
        
        if (mobileNewGameBtn) {
            mobileNewGameBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('모바일 새 게임 버튼 클릭');
                this.startNewGame();
            });
        }
        
        if (mobileBackToMenuBtn) {
            mobileBackToMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('모바일 메인 메뉴 버튼 클릭');
                this.showStartScreen();
            });
        }
        
        if (mobileContinueAfterAdBtn) {
            mobileContinueAfterAdBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('모바일 광고 후 계속하기 버튼 클릭');
                this.continueAfterMobileAd();
            });
        }
        
        // 전체화면 버튼
        document.getElementById('fullscreenBtn')?.addEventListener('click', () => this.toggleFullscreen());
        
        // 모바일 컨트롤 버튼들
        document.getElementById('rotateBtn')?.addEventListener('click', () => this.rotatePiece());
        document.getElementById('dropBtn')?.addEventListener('click', () => this.hardDrop());
        
        // 키보드 컨트롤
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // 터치 컨트롤
        if (this.canvas) {
            this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), {passive: false});
            this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), {passive: false});
            this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), {passive: false});
            
            // 마우스 컨트롤 (데스크탑에서도 사용 가능)
            this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        }
        
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
        console.log('시작 화면 표시 요청');
        
        this.hideAllScreens();
        this.hideMobileGameOverPopup(); // 모바일 팝업도 숨기기
        
        // PC용 게임 오버 화면도 확실히 숨기기
        const pcGameOverScreen = document.getElementById('gameOverScreen');
        if (pcGameOverScreen) {
            pcGameOverScreen.classList.add('hidden');
            pcGameOverScreen.style.display = 'none';
        }
        
        const startScreen = document.getElementById('startScreen');
        if (startScreen) {
            startScreen.classList.remove('hidden');
            startScreen.style.display = 'flex';
        }
        
        this.gameRunning = false;
        this.gamePaused = false;
        this.isStarting = false;
        
        // 메인 메뉴에서는 자유로운 스크롤 허용
        this.enableScroll();
        
        // modal-active 클래스 제거
        document.body.classList.remove('modal-active');
        
        if (soundManager) soundManager.stopBgm();
        
        console.log('시작 화면 표시 완료');
    }
    
    showGameScreen() {
        this.hideAllScreens();
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.classList.remove('hidden');
            gameScreen.style.display = 'block'; // 명시적으로 display 설정
        }
        // 게임 화면에서는 modal-active 클래스 제거
        document.body.classList.remove('modal-active');
    }
    
    showGameOverScreen() {
        // 모바일 상태를 다시 확인 (동적 변경 대응)
        const isMobileNow = this.detectMobile();
        
        console.log('게임 오버 화면 표시:', {
            originalMobile: this.isMobile,
            currentMobile: isMobileNow,
            screenSize: { width: window.innerWidth, height: window.innerHeight }
        });
        
        // 게임 오버 시 modal-active 클래스 추가 (화면 전환을 위해)
        document.body.classList.add('modal-active');
        
        // 모바일에서는 팝업으로 표시, PC에서는 일반 화면으로 표시
        if (isMobileNow) {
            console.log('모바일 게임 오버 팝업 표시');
            this.showMobileGameOverPopup();
        } else {
            console.log('PC 게임 오버 화면 표시');
            // PC에서는 기존 방식 사용
            this.hideAllScreens();
            const gameOverScreen = document.getElementById('gameOverScreen');
            if (gameOverScreen) {
                gameOverScreen.classList.remove('hidden');
                gameOverScreen.style.display = 'block'; // 명시적으로 display 설정
            }
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
        console.log('모바일 팝업 표시 시작');
        
        // PC용 게임 오버 화면 강제로 숨기기
        const pcGameOverScreen = document.getElementById('gameOverScreen');
        if (pcGameOverScreen) {
            pcGameOverScreen.classList.add('hidden');
            pcGameOverScreen.style.display = 'none';
        }
        
        // 모든 다른 화면들도 숨기기
        this.hideAllScreens();
        
        // 모바일 팝업 표시
        const mobilePopup = document.getElementById('mobileGameOverPopup');
        if (mobilePopup) {
            mobilePopup.classList.remove('hidden');
            mobilePopup.style.display = 'flex';
            
            // 점수 정보 업데이트
            const scoreElement = document.getElementById('mobileFinalScore');
            const levelElement = document.getElementById('mobileFinalLevel');
            
            if (scoreElement) scoreElement.textContent = this.score.toLocaleString();
            if (levelElement) levelElement.textContent = this.level;
            
            console.log('모바일 팝업 표시 완료:', {
                score: this.score,
                level: this.level,
                popupVisible: !mobilePopup.classList.contains('hidden')
            });
        } else {
            console.error('모바일 게임 오버 팝업 요소를 찾을 수 없음');
        }
        
        // 팝업 오버레이 클릭 시 닫기 (중복 이벤트 방지)
        const overlay = document.querySelector('.popup-overlay');
        if (overlay) {
            // 기존 이벤트 리스너 제거
            overlay.removeEventListener('click', this.overlayClickHandler);
            
            // 새 이벤트 리스너 추가
            this.overlayClickHandler = () => {
                this.hideMobileGameOverPopup();
                this.showStartScreen();
            };
            overlay.addEventListener('click', this.overlayClickHandler);
        }
    }
    
    // 모바일 게임 오버 팝업 숨기기
    hideMobileGameOverPopup() {
        console.log('모바일 팝업 숨김 시작');
        
        const popup = document.getElementById('mobileGameOverPopup');
        const adSection = document.getElementById('mobileAdSection');
        
        if (popup) {
            popup.classList.add('hidden');
            popup.style.display = 'none';
            console.log('모바일 팝업 숨김 완료');
        } else {
            console.error('모바일 팝업 요소를 찾을 수 없음');
        }
        
        if (adSection) {
            adSection.classList.add('hidden');
        }
        
        // 팝업 숨길 때 modal-active 클래스도 제거
        document.body.classList.remove('modal-active');
        
        // 오버레이 이벤트 리스너 정리
        const overlay = document.querySelector('.popup-overlay');
        if (overlay && this.overlayClickHandler) {
            overlay.removeEventListener('click', this.overlayClickHandler);
        }
    }
    
    showPauseScreen() {
        this.hideAllScreens();
        const pauseScreen = document.getElementById('pauseScreen');
        if (pauseScreen) {
            pauseScreen.classList.remove('hidden');
            pauseScreen.style.display = 'flex'; // 명시적으로 display 설정
        }
    }
    
    hideAllScreens() {
        // 모든 화면 숨기기
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
            screen.style.display = 'none'; // 명시적으로 display none 설정
        });
        
        // 모바일 팝업도 숨기기
        this.hideMobileGameOverPopup();
    }
    
    // 게임 상태 초기화
    resetGame() {
        console.log("게임 상태 리셋 시작");
        
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.canContinue = false;
        this.dropInterval = 1000;
        this.lastTime = 0;
        this.currentPiece = null;
        this.nextPiece = null;
        
        // 보드 초기화를 더 안전하게
        this.initBoard();
        
        console.log("게임 상태 리셋 완료", {
            isMobile: this.isMobile,
            boardHeight: this.board ? this.board.length : 'undefined',
            canvasSize: this.canvas ? { width: this.canvas.width, height: this.canvas.height } : 'undefined'
        });
    }

    // 게임 시작 - 최종 개선 버전
    startGame() {
        // 이미 시작 중이면 중복 실행 방지
        if (this.isStarting) {
            console.log("게임이 이미 시작 중입니다.");
            return;
        }
        
        // 초기화가 완료되지 않았으면 대기
        if (!this.isInitialized) {
            console.log("초기화가 완료되지 않아 대기 중...");
            setTimeout(() => this.startGame(), 200);
            return;
        }
        
        this.isStarting = true;
        
        const nicknameInput = document.getElementById('nicknameInput');
        this.playerName = nicknameInput.value.trim() || 'Anonymous';
        
        if (this.playerName.length > 10) {
            alert('닉네임은 10자 이하로 입력해주세요.');
            this.isStarting = false;
            return;
        }
        
        console.log("게임 시작 요청", { playerName: this.playerName, isMobile: this.isMobile });
        
        document.getElementById('playerName').textContent = this.playerName;
        
        // 게임 상태를 완전히 초기화합니다.
        this.resetGame();
        
        // 모바일에서 더 긴 지연과 단계별 검증
        const delay = this.isMobile ? 300 : 100;
        
        setTimeout(() => {
            this.startGameStep1();
        }, delay);
    }
    
    // 게임 시작 1단계: 기본 검증
    startGameStep1() {
        console.log("게임 시작 1단계: 기본 검증");
        
        try {
            // 캔버스가 완전히 초기화되었는지 확인
            if (!this.canvas || !this.ctx) {
                throw new Error("캔버스가 초기화되지 않음");
            }
            
            // 보드가 올바르게 초기화되었는지 확인
            if (!this.board || this.board.length !== this.BOARD_HEIGHT) {
                throw new Error("보드가 올바르게 초기화되지 않음");
            }
            
            // 2단계로 진행
            setTimeout(() => this.startGameStep2(), 50);
            
        } catch (error) {
            console.error("게임 시작 1단계 실패:", error);
            this.isStarting = false;
            
            if (this.isMobile && confirm("게임 시작에 실패했습니다. 다시 시도하시겠습니까?")) {
                this.startGame();
            } else {
                this.showStartScreen();
            }
        }
    }
    
    // 게임 시작 2단계: 블록 생성
    startGameStep2() {
        console.log("게임 시작 2단계: 블록 생성");
        
        try {
            // 다음 블록 생성
            this.generateNextPiece();
            
            if (!this.nextPiece) {
                throw new Error("다음 블록 생성 실패");
            }
            
            // 3단계로 진행
            setTimeout(() => this.startGameStep3(), 50);
            
        } catch (error) {
            console.error("게임 시작 2단계 실패:", error);
            this.isStarting = false;
            this.showStartScreen();
        }
    }
    
    // 게임 시작 3단계: 현재 블록 생성 및 최종 검증
    startGameStep3() {
        console.log("게임 시작 3단계: 현재 블록 생성");
        
        try {
            // 현재 블록을 안전하게 생성
            this.createFirstPieceSafely();
            
            // 게임 오버 상태가 아닌지 확인
            if (this.gameOver) {
                throw new Error("블록 생성 시 게임 오버 발생");
            }
            
            if (!this.currentPiece) {
                throw new Error("현재 블록이 생성되지 않음");
            }
            
            // 4단계로 진행
            setTimeout(() => this.startGameStep4(), 50);
            
        } catch (error) {
            console.error("게임 시작 3단계 실패:", error);
            this.isStarting = false;
            
            if (this.isMobile && confirm("블록 생성에 실패했습니다. 다시 시도하시겠습니까?")) {
                this.startGame();
            } else {
                this.showStartScreen();
            }
        }
    }
    
    // 게임 시작 4단계: 게임 실행
    startGameStep4() {
        console.log("게임 시작 4단계: 게임 실행");
        
        try {
            this.updateDisplay();
            this.showGameScreen();
            
            this.disableScroll();
            document.body.classList.remove('modal-active');
            
            this.gameRunning = true;
            this.lastTime = performance.now();
            this.gameLoop();
            
            if (soundManager) soundManager.playBgm(this.level);
            
            this.isStarting = false;
            
            console.log("게임 시작 성공!", {
                isMobile: this.isMobile,
                boardSize: this.board.length,
                currentPiece: this.currentPiece ? this.currentPiece.type : 'none'
            });
            
        } catch (error) {
            console.error("게임 시작 4단계 실패:", error);
            this.isStarting = false;
            this.showStartScreen();
        }
    }
    
    // 첫 번째 블록을 안전하게 생성
    createFirstPieceSafely() {
        if (!this.nextPiece) {
            throw new Error("다음 블록이 없음");
        }
        
        // 블록 시작 위치를 보드 중앙으로 계산
        const startX = Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.nextPiece.shape[0].length / 2);
        const startY = 0;
        
        // 시작 위치가 보드 범위를 벗어나지 않는지 확인
        if (startX < 0 || startX + this.nextPiece.shape[0].length > this.BOARD_WIDTH) {
            throw new Error(`블록 시작 위치가 보드를 벗어남: startX=${startX}, pieceWidth=${this.nextPiece.shape[0].length}`);
        }
        
        // 보드 최상단이 완전히 비어있는지 확인
        for (let col = 0; col < this.BOARD_WIDTH; col++) {
            if (this.board[0][col] !== 0) {
                throw new Error(`보드 최상단이 비어있지 않음: col=${col}, value=${this.board[0][col]}`);
            }
        }
        
        // 현재 블록 생성
        this.currentPiece = {
            type: this.nextPiece.type,
            shape: JSON.parse(JSON.stringify(this.nextPiece.shape)), // 깊은 복사
            color: this.nextPiece.color,
            x: startX,
            y: startY
        };
        
        // 블록이 시작 위치에서 충돌하지 않는지 최종 확인
        // 게임 시작 시에는 매우 관대한 검사만 실행
        let hasImmediateCollision = false;
        for (let row = 0; row < this.currentPiece.shape.length && row < 2; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const boardX = this.currentPiece.x + col;
                    const boardY = this.currentPiece.y + row;
                    
                    if (boardY >= 0 && boardY < this.BOARD_HEIGHT && 
                        boardX >= 0 && boardX < this.BOARD_WIDTH) {
                        if (this.board[boardY][boardX] !== 0) {
                            hasImmediateCollision = true;
                            break;
                        }
                    }
                }
            }
            if (hasImmediateCollision) break;
        }
        
        if (hasImmediateCollision) {
            throw new Error("블록 시작 위치에서 충돌 감지");
        }
        
        // 다음 블록 생성
        this.generateNextPiece();
        this.drawNextPiece();
        
        console.log("첫 번째 블록 생성 성공:", {
            type: this.currentPiece.type,
            position: { x: this.currentPiece.x, y: this.currentPiece.y }
        });
    }
    
    // 새 게임 시작 (게임 오버 후)
    startNewGame() {
        console.log('새 게임 시작 요청');
        
        this.canContinue = false;
        
        // 모바일 팝업 숨기기
        this.hideMobileGameOverPopup();
        
        // PC용 게임 오버 화면도 숨기기
        const pcGameOverScreen = document.getElementById('gameOverScreen');
        if (pcGameOverScreen) {
            pcGameOverScreen.classList.add('hidden');
            pcGameOverScreen.style.display = 'none';
        }
        
        // modal-active 클래스 제거
        document.body.classList.remove('modal-active');
        
        // 약간의 지연 후 게임 시작
        setTimeout(() => {
            this.startGame();
        }, 100);
        
        console.log('새 게임 시작 처리 완료');
    }
    
    // 게임 종료
    quitGame() {
        console.log('게임 종료 요청');
        
        this.gameRunning = false;
        this.gamePaused = false;
        this.isStarting = false;
        
        // 게임 영역 터치 제어 비활성화
        this.enableScroll();
        
        // 모바일 팝업이 열려있으면 닫기
        this.hideMobileGameOverPopup();
        
        // modal-active 클래스 제거
        document.body.classList.remove('modal-active');
        
        // PC용 게임 오버 화면도 숨김
        const pcGameOverScreen = document.getElementById('gameOverScreen');
        if (pcGameOverScreen) {
            pcGameOverScreen.classList.add('hidden');
        }
        
        this.showStartScreen();
        
        console.log('게임 종료 완료');
    }
    
    // 새로운 피스 생성
    generateNextPiece() {
        const randomIndex = Math.floor(Math.random() * this.pieceTypes.length);
        const pieceType = this.pieceTypes[randomIndex];
        
        this.nextPiece = {
            type: pieceType,
            shape: JSON.parse(JSON.stringify(this.pieces[pieceType].shape)), // 깊은 복사
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
            type: this.nextPiece.type,
            shape: JSON.parse(JSON.stringify(this.nextPiece.shape)), // 깊은 복사
            color: this.nextPiece.color,
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
    
    // 입력 처리 메서드들 (터치, 키보드, 마우스)
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
            case 'ArrowUp':
                this.rotatePiece();
                break;
            case ' ':
                this.hardDrop();
                break;
            case 'Enter':
                this.hardDrop();
                break;
        }
        e.preventDefault();
    }
    
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
        
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            this.isDragging = true;
            
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
            this.rotatePiece();
        } else if (this.isDragging) {
            const touch = e.changedTouches[0];
            const deltaY = touch.clientY - this.touchStartY;
            
            if (deltaY > this.minSwipeDistance) {
                this.hardDrop();
            }
        }
    }
    
    handleMouseDown(e) {
        this.touchStartX = e.clientX;
        this.touchStartY = e.clientY;
        this.touchStartTime = Date.now();
        this.isDragging = false;
    }
    
    handleMouseMove(e) {
        if (e.buttons !== 1) return;
        
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
    
    // 일시정지 토글
    togglePause() {
        if (!this.gameRunning || this.gameOver) return;
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            this.enableScroll();
            this.hideAllScreens();
            document.getElementById('pauseScreen').classList.remove('hidden');
            
            if (soundManager) soundManager.playPause();
        } else {
            document.body.classList.remove('modal-active');
            this.disableScroll();
            this.hideAllScreens();
            document.getElementById('gameScreen').classList.remove('hidden');
            if (soundManager) soundManager.resumeFromPause();
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }
    
    // 전체화면 토글
    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }
    
    enterFullscreen() {
        const elem = document.documentElement;
        
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        
        document.body.classList.add('fullscreen-mode');
        this.isFullscreen = true;
        
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.innerHTML = '⤋';
            fullscreenBtn.title = '전체화면 해제';
        }
        
        setTimeout(() => {
            this.resizeCanvasForFullscreen();
        }, 100);
    }
    
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        document.body.classList.remove('fullscreen-mode');
        document.body.classList.remove('modal-active');
        this.isFullscreen = false;
        
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.innerHTML = '⛶';
            fullscreenBtn.title = '전체화면';
        }
        
        setTimeout(() => {
            this.initCanvas();
        }, 100);
    }
    
    resizeCanvasForFullscreen() {
        const availableHeight = window.innerHeight - 120;
        const availableWidth = window.innerWidth - 400;
        
        const gameRatio = 0.5;
        
        let canvasWidth, canvasHeight;
        
        if (availableWidth / gameRatio <= availableHeight) {
            canvasWidth = Math.min(availableWidth, 400);
            canvasHeight = canvasWidth / gameRatio;
        } else {
            canvasHeight = Math.min(availableHeight, 800);
            canvasWidth = canvasHeight * gameRatio;
        }
        
        if (canvasWidth < 250) {
            canvasWidth = 250;
            canvasHeight = canvasWidth / gameRatio;
        }
        if (canvasHeight < 500) {
            canvasHeight = 500;
            canvasWidth = canvasHeight * gameRatio;
        }
        
        this.BLOCK_SIZE = canvasWidth / this.BOARD_WIDTH;
        
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        this.canvas.width = canvasWidth * devicePixelRatio;
        this.canvas.height = canvasHeight * devicePixelRatio;
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
        
        if (this.gameRunning) {
            this.draw();
        }
    }
    
    handleFullscreenChange() {
        const isCurrentlyFullscreen = !!(document.fullscreenElement || 
                                        document.webkitFullscreenElement || 
                                        document.msFullscreenElement);
        
        if (!isCurrentlyFullscreen && this.isFullscreen) {
            this.isFullscreen = false;
            document.body.classList.remove('fullscreen-mode');
            document.body.classList.remove('modal-active');
            const fullscreenBtn = document.getElementById('fullscreenBtn');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '⛶';
                fullscreenBtn.title = '전체화면';
            }
            
            setTimeout(() => {
                this.initCanvas();
            }, 100);
        }
    }
    
    // 광고 관련 메서드들 (기본 버전만 포함)
    showAd() {
        const adSection = document.getElementById('adSection');
        if (adSection) {
            adSection.classList.remove('hidden');
            
            setTimeout(() => {
                const continueBtn = document.getElementById('continueAfterAdBtn');
                if (continueBtn) {
                    continueBtn.classList.remove('hidden');
                }
            }, 3000);
        }
    }
    
    continueAfterAd() {
        if (!this.canContinue) return;
        
        this.gameOver = false;
        this.canContinue = false;
        
        this.initBoard();
        this.generateNextPiece();
        this.spawnNewPiece();
        
        this.showGameScreen();
        this.disableScroll();
        document.body.classList.remove('modal-active');
        
        this.gameRunning = true;
        this.gamePaused = false;
        this.lastTime = performance.now();
        this.gameLoop();
        
        if (soundManager) soundManager.playBgm(this.level);
        
        const adSection = document.getElementById('adSection');
        if (adSection) adSection.classList.add('hidden');
    }
    
    showMobileAd() {
        const adSection = document.getElementById('mobileAdSection');
        if (adSection) {
            adSection.classList.remove('hidden');
            
            setTimeout(() => {
                const continueBtn = document.getElementById('mobileContinueAfterAdBtn');
                if (continueBtn) {
                    continueBtn.classList.remove('hidden');
                }
            }, 3000);
        }
    }
    
    continueAfterMobileAd() {
        if (!this.canContinue) return;
        
        this.gameOver = false;
        this.canContinue = false;
        
        this.initBoard();
        this.generateNextPiece();
        this.spawnNewPiece();
        
        this.hideMobileGameOverPopup();
        this.showGameScreen();
        this.disableScroll();
        document.body.classList.remove('modal-active');
        
        this.gameRunning = true;
        this.gamePaused = false;
        this.lastTime = performance.now();
        this.gameLoop();
        
        if (soundManager) soundManager.playBgm(this.level);
    }
}

// 게임 인스턴스 생성
let tetrisGame;

// DOM 로드 완료 시 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM 로드 완료 - 테트리스 게임 생성 시작");
    tetrisGame = new TetrisGame();
});
