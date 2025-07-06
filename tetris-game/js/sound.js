// Web Audio API를 사용한 사운드 관리 클래스
class SoundManager {
    constructor() {
        this.enabled = true;
        this.bgmVolume = 0.2;
        this.sfxVolume = 0.3;
        this.audioContext = null;
        this.currentBgm = null;
        this.currentLevel = 1;
        this.bgmGainNode = null;
        this.sfxGainNode = null;
        
        this.initializeAudioContext();
        this.bindEvents();
    }
    
    initializeAudioContext() {
        try {
            // Web Audio API 초기화
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 게인 노드 생성 (볼륨 조절용)
            this.bgmGainNode = this.audioContext.createGain();
            this.sfxGainNode = this.audioContext.createGain();
            
            this.bgmGainNode.connect(this.audioContext.destination);
            this.sfxGainNode.connect(this.audioContext.destination);
            
            this.bgmGainNode.gain.value = this.bgmVolume;
            this.sfxGainNode.gain.value = this.sfxVolume;
            
            console.log('Web Audio API 초기화 완료');
        } catch (error) {
            console.log('Web Audio API 초기화 실패:', error);
            this.enabled = false;
        }
    }
    
    bindEvents() {
        // 사운드 토글 버튼
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => this.toggleSound());
        }
        
        // 사용자 상호작용 후 오디오 컨텍스트 활성화
        document.addEventListener('click', () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('오디오 컨텍스트 활성화됨');
                });
            }
        }, { once: true });
    }
    
    // 간단한 비프음 생성
    createBeep(frequency, duration, volume = 0.3) {
        if (!this.audioContext || !this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGainNode);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // 코드 진행을 사용한 배경음악
    createBgmLoop(baseFreq, pattern, duration = 0.5) {
        if (!this.audioContext || !this.enabled) return null;
        
        let patternIndex = 0;
        const intervalId = setInterval(() => {
            if (!this.enabled) {
                clearInterval(intervalId);
                return;
            }
            
            const note = pattern[patternIndex % pattern.length];
            const frequency = baseFreq * Math.pow(2, note / 12); // 반음계
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.bgmGainNode);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = 'triangle';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration * 0.8);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
            patternIndex++;
        }, duration * 1000);
        
        return intervalId;
    }
    
    toggleSound() {
        this.enabled = !this.enabled;
        const soundToggle = document.getElementById('soundToggle');
        
        if (this.enabled) {
            soundToggle.textContent = '🔊';
            // 오디오 컨텍스트 재개
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        } else {
            soundToggle.textContent = '🔇';
            this.stopBgm();
        }
    }
    
    playBgm(level = 1) {
        if (!this.audioContext || !this.enabled) return;
        
        // 현재 BGM 정지
        this.stopBgm();
        
        // 레벨에 따른 음악 패턴
        const patterns = [
            // 레벨 1-3: 밝고 경쾌한 멜로디
            [0, 4, 7, 4, 0, 4, 7, 4],
            // 레벨 4-6: 조금 더 복잡한 멜로디
            [0, 2, 4, 7, 9, 7, 4, 2],
            // 레벨 7+: 빠르고 긴장감 있는 멜로디
            [-5, 0, 3, 7, 12, 7, 3, 0]
        ];
        
        const basePitches = [220, 247, 277]; // A3, B3, C#4
        const speeds = [600, 500, 400]; // ms
        
        let patternIndex = Math.min(Math.floor((level - 1) / 3), 2);
        
        this.currentBgm = this.createBgmLoop(
            basePitches[patternIndex],
            patterns[patternIndex],
            speeds[patternIndex] / 1000
        );
        
        this.currentLevel = level;
    }
    
    stopBgm() {
        if (this.currentBgm) {
            clearInterval(this.currentBgm);
            this.currentBgm = null;
        }
    }
    
    playLineClear(linesCleared) {
        if (!this.enabled) return;
        
        // 라인 수에 따른 다른 효과음
        if (linesCleared === 1) {
            this.createBeep(440, 0.2); // A4
        } else if (linesCleared === 2) {
            this.createBeep(440, 0.15);
            setTimeout(() => this.createBeep(554, 0.15), 100); // C#5
        } else if (linesCleared === 3) {
            this.createBeep(440, 0.15);
            setTimeout(() => this.createBeep(554, 0.15), 100);
            setTimeout(() => this.createBeep(659, 0.15), 200); // E5
        } else if (linesCleared === 4) {
            // 테트리스! 특별한 소리
            const frequencies = [440, 554, 659, 831]; // A4, C#5, E5, G#5
            frequencies.forEach((freq, index) => {
                setTimeout(() => this.createBeep(freq, 0.3, 0.4), index * 80);
            });
        }
    }
    
    playGameOver() {
        this.stopBgm();
        if (this.enabled) {
            // 하강하는 음계로 게임 오버 표현
            const frequencies = [523, 494, 440, 392, 349]; // C5 -> F4
            frequencies.forEach((freq, index) => {
                setTimeout(() => this.createBeep(freq, 0.4, 0.3), index * 200);
            });
        }
    }
    
    playLevelUp() {
        if (!this.enabled) return;
        
        // 상승하는 아르페지오
        const frequencies = [440, 554, 659, 880]; // A4, C#5, E5, A5
        frequencies.forEach((freq, index) => {
            setTimeout(() => this.createBeep(freq, 0.2, 0.4), index * 100);
        });
        
        // 레벨에 따른 BGM 변경
        const newBgmIndex = Math.min(Math.floor((this.currentLevel - 1) / 3), 2);
        const currentBgmIndex = Math.min(Math.floor((this.currentLevel - 2) / 3), 2);
        
        if (newBgmIndex !== currentBgmIndex) {
            setTimeout(() => {
                this.playBgm(this.currentLevel);
            }, 500);
        }
    }
    
    playPieceDrop() {
        if (this.enabled) {
            this.createBeep(220, 0.1, 0.2); // 낮은 톤의 짧은 소리
        }
    }
    
    playPieceRotate() {
        if (this.enabled) {
            this.createBeep(330, 0.08, 0.15); // 중간 톤의 매우 짧은 소리
        }
    }
    
    playPause() {
        if (this.enabled) {
            this.createBeep(294, 0.3, 0.25); // D4
        }
        // BGM 일시정지는 하지 않음 (게임 일시정지시에는 별도 처리)
    }
    
    resumeFromPause() {
        // BGM이 없다면 다시 시작
        if (this.enabled && !this.currentBgm) {
            this.playBgm(this.currentLevel);
        }
    }
    
    stopAllSounds() {
        this.stopBgm();
    }
    
    // 볼륨 조절
    setBgmVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.bgmGainNode) {
            this.bgmGainNode.gain.value = this.bgmVolume;
        }
    }
    
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGainNode) {
            this.sfxGainNode.gain.value = this.sfxVolume;
        }
    }
}

// 글로벌 사운드 매니저 인스턴스
let soundManager;

// DOM 로드 완료 시 사운드 매니저 초기화
document.addEventListener('DOMContentLoaded', () => {
    soundManager = new SoundManager();
    
    // 테스트용 - 5초 후 테스트 사운드 재생
    setTimeout(() => {
        if (soundManager.enabled) {
            console.log('사운드 시스템 테스트 중...');
            soundManager.createBeep(440, 0.2, 0.3);
        }
    }, 2000);
});