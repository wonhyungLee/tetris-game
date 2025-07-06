// 랭킹 관리 클래스
class RankingManager {
    constructor() {
        this.maxRankings = 10; // 디스플레이용 최대 랭킹 개수
        this.serverUrl = this.getServerUrl();
        this.rankings = [];
        this.isOnline = true;
        this.loadRankings();
    }
    
    // 서버 URL 결정
    getServerUrl() {
        // 개발 환경에서는 localhost, 프로덕션에서는 현재 도메인
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return `http://${window.location.hostname}:${window.location.port || 3000}`;
        }
        // 운영 환경에서는 현재 도메인 사용
        return window.location.origin;
    }
    
    // 서버에서 랭킹 로드
    async loadRankings() {
        try {
            const response = await fetch(`${this.serverUrl}/api/rankings`);
            const result = await response.json();
            
            if (result.success) {
                this.rankings = result.data.slice(0, this.maxRankings);
                this.isOnline = true;
                console.log('온라인 랭킹 로드 성공:', this.rankings.length, '개 기록');
            } else {
                throw new Error(result.error || '랭킹 데이터 로드 실패');
            }
        } catch (error) {
            console.warn('온라인 랭킹 로드 실패, 로컬 데이터 사용:', error.message);
            this.isOnline = false;
            this.loadLocalRankings();
        }
        
        this.updateRankingDisplay();
    }
    
    // 로컬 스토리지에서 랭킹 로드 (대체 수단)
    loadLocalRankings() {
        try {
            const saved = localStorage.getItem('tetrisRankings');
            if (saved) {
                this.rankings = JSON.parse(saved).slice(0, this.maxRankings);
                return;
            }
        } catch (error) {
            console.error('로컬 랭킹 로드 실패:', error);
        }
        
        // 기본 랭킹 데이터
        this.rankings = [
            { nickname: 'Player1', score: 50000, level: 5, lines: 25, date: new Date().toISOString() },
            { nickname: 'Player2', score: 40000, level: 4, lines: 20, date: new Date().toISOString() },
            { nickname: 'Player3', score: 30000, level: 3, lines: 15, date: new Date().toISOString() },
            { nickname: 'Player4', score: 20000, level: 2, lines: 10, date: new Date().toISOString() },
            { nickname: 'Player5', score: 10000, level: 1, lines: 5, date: new Date().toISOString() }
        ];
    }
    
    // 로컬 스토리지에 백업 랭킹 저장 (오프라인 상황에서 대체 수단)
    saveLocalRankings() {
        try {
            localStorage.setItem('tetrisRankings', JSON.stringify(this.rankings));
        } catch (error) {
            console.error('로컬 랭킹 저장 실패:', error);
        }
    }
    
    // 새로운 점수 추가
    async addScore(nickname, score, level, lines) {
        const newEntry = {
            nickname: nickname.trim() || 'Anonymous',
            score: score,
            level: level,
            lines: lines
        };
        
        let rank = -1;
        
        if (this.isOnline) {
            try {
                // 서버에 점수 전송
                const response = await fetch(`${this.serverUrl}/api/rankings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newEntry)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    rank = result.data.rank;
                    console.log(`서버에 점수 등록 성공: ${nickname} - ${score}점 (${rank}위)`);
                    
                    // 서버에서 최신 랭킹 데이터 다시 로드
                    await this.loadRankings();
                    return rank;
                } else {
                    throw new Error(result.error || '점수 등록 실패');
                }
            } catch (error) {
                console.warn('온라인 점수 등록 실패, 로컬에 저장:', error.message);
                this.isOnline = false;
            }
        }
        
        // 온라인 등록 실패 시 로컬에 저장
        newEntry.date = new Date().toISOString();
        this.rankings.push(newEntry);
        
        // 점수 순으로 정렬 (내림차순)
        this.rankings.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.level !== a.level) return b.level - a.level;
            return b.lines - a.lines;
        });
        
        // 최대 개수 유지
        this.rankings = this.rankings.slice(0, this.maxRankings);
        
        // 로컬 저장
        this.saveLocalRankings();
        
        // 순위 반환 (1부터 시작)
        rank = this.rankings.findIndex(entry => 
            entry.nickname === newEntry.nickname && 
            entry.score === newEntry.score && 
            entry.date === newEntry.date
        ) + 1;
        
        this.updateRankingDisplay();
        return rank;
    }
    
    // 특정 플레이어의 최고 기록 가져오기
    getPlayerBest(nickname) {
        const playerRecords = this.rankings.filter(entry => 
            entry.nickname.toLowerCase() === nickname.toLowerCase()
        );
        
        if (playerRecords.length === 0) return null;
        
        return playerRecords.reduce((best, current) => 
            current.score > best.score ? current : best
        );
    }
    
    // 순위 확인 (해당 점수가 랭킹에 들어가는지)
    wouldMakeRanking(score) {
        if (this.rankings.length < this.maxRankings) return true;
        return score > this.rankings[this.rankings.length - 1].score;
    }
    
    // 랭킹 리스트 HTML 생성
    generateRankingHTML() {
        if (this.rankings.length === 0) {
            return '<div class="no-rankings">아직 기록이 없습니다.</div>';
        }
        
        return this.rankings.map((entry, index) => {
            const rank = index + 1;
            const date = new Date(entry.date).toLocaleDateString('ko-KR');
            const medal = this.getMedalEmoji(rank);
            
            return `
                <div class="ranking-item ${rank <= 3 ? 'top-rank' : ''}">
                    <div class="rank-info">
                        <span class="rank">${medal}${rank}위</span>
                        <span class="nickname">${this.escapeHtml(entry.nickname)}</span>
                    </div>
                    <div class="score-info">
                        <span class="score">${entry.score.toLocaleString()}점</span>
                        <span class="level">Lv.${entry.level}</span>
                    </div>
                    <div class="date">${date}</div>
                </div>
            `;
        }).join('');
    }
    
    // 온라인 상태로 전환 시도
    async reconnect() {
        console.log('온라인 랭킹 서버 재연결 시도...');
        await this.loadRankings();
        return this.isOnline;
    }
    
    // 특정 플레이어의 전체 순위 조회
    async getPlayerGlobalRank(nickname) {
        if (!this.isOnline) {
            return null;
        }
        
        try {
            const response = await fetch(`${this.serverUrl}/api/rankings/player/${encodeURIComponent(nickname)}`);
            const result = await response.json();
            
            if (result.success && result.data) {
                return result.data;
            }
        } catch (error) {
            console.warn('플레이어 전체 순위 조회 실패:', error.message);
        }
        
        return null;
    }
    
    // 메달 이모지 반환
    getMedalEmoji(rank) {
        switch (rank) {
            case 1: return '🥇 ';
            case 2: return '🥈 ';
            case 3: return '🥉 ';
            default: return '';
        }
    }
    
    // HTML 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 랭킹 디스플레이 업데이트
    updateRankingDisplay() {
        const rankingList = document.getElementById('rankingList');
        if (rankingList) {
            let html = this.generateRankingHTML();
            
            // 온라인/오프라인 상태 표시
            const statusHtml = `
                <div class="ranking-status">
                    <span class="status-indicator ${this.isOnline ? 'online' : 'offline'}"></span>
                    ${this.isOnline ? '온라인 랭킹' : '오프라인 백업'}
                </div>
            `;
            
            rankingList.innerHTML = statusHtml + html;
        }
    }
    
    // 특정 플레이어의 통계 정보
    getPlayerStats(nickname) {
        const playerRecords = this.rankings.filter(entry => 
            entry.nickname.toLowerCase() === nickname.toLowerCase()
        );
        
        if (playerRecords.length === 0) {
            return {
                gamesPlayed: 0,
                bestScore: 0,
                bestLevel: 0,
                totalLines: 0,
                averageScore: 0
            };
        }
        
        const bestScore = Math.max(...playerRecords.map(r => r.score));
        const bestLevel = Math.max(...playerRecords.map(r => r.level));
        const totalLines = playerRecords.reduce((sum, r) => sum + r.lines, 0);
        const averageScore = Math.round(
            playerRecords.reduce((sum, r) => sum + r.score, 0) / playerRecords.length
        );
        
        return {
            gamesPlayed: playerRecords.length,
            bestScore,
            bestLevel,
            totalLines,
            averageScore
        };
    }
    
    // 로컬 랭킹 초기화
    clearLocalRankings() {
        if (confirm('로컬 랭킹 데이터를 삭제하시겠습니까?')) {
            this.rankings = [];
            this.saveLocalRankings();
            this.updateRankingDisplay();
            return true;
        }
        return false;
    }
    
    // 데이터 내보내기 (JSON)
    exportRankings() {
        const dataStr = JSON.stringify(this.rankings, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `tetris_rankings_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
    
    // 데이터 가져오기 (JSON)
    importRankings(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (Array.isArray(importedData)) {
                        this.rankings = importedData;
                        this.saveLocalRankings();
                        this.updateRankingDisplay();
                        resolve(true);
                    } else {
                        reject(new Error('잘못된 파일 형식입니다.'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }
}

// 글로벌 랭킹 매니저 인스턴스
let rankingManager;

// DOM 로드 완료 시 랭킹 매니저 초기화
document.addEventListener('DOMContentLoaded', async () => {
    rankingManager = new RankingManager();
    // 비동기 로드이므로 기다리지 않고 바로 다음 진행
});
