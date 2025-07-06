const express = require('express');
const path = require('path');
const compression = require('compression');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON 바디 파싱을 위한 미들웨어
app.use(express.json());

// 랭킹 데이터 배열 (메모리에 저장)
let rankings = [];

// 랭킹 데이터 파일 경로
const RANKINGS_FILE = path.join(__dirname, 'rankings.json');

// 랭킹 데이터 로드
function loadRankings() {
    try {
        if (fs.existsSync(RANKINGS_FILE)) {
            const data = fs.readFileSync(RANKINGS_FILE, 'utf8');
            rankings = JSON.parse(data);
            console.log(`랭킹 데이터 로드 완료: ${rankings.length}개 기록`);
        } else {
            // 기본 랭킹 데이터 생성
            rankings = [
                { nickname: 'Player1', score: 50000, level: 5, lines: 25, date: new Date().toISOString() },
                { nickname: 'Player2', score: 40000, level: 4, lines: 20, date: new Date().toISOString() },
                { nickname: 'Player3', score: 30000, level: 3, lines: 15, date: new Date().toISOString() },
                { nickname: 'Player4', score: 20000, level: 2, lines: 10, date: new Date().toISOString() },
                { nickname: 'Player5', score: 10000, level: 1, lines: 5, date: new Date().toISOString() }
            ];
            saveRankings();
        }
    } catch (error) {
        console.error('랭킹 데이터 로드 실패:', error);
        rankings = [];
    }
}

// 랭킹 데이터 저장
function saveRankings() {
    try {
        fs.writeFileSync(RANKINGS_FILE, JSON.stringify(rankings, null, 2));
    } catch (error) {
        console.error('랭킹 데이터 저장 실패:', error);
    }
}

// 서버 시작 시 랭킹 데이터 로드
loadRankings();

// CORS 헤더 설정
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Gzip 압축 활성화
app.use(compression());

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, '/')));

// 기본 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 랭킹 API 라우트

// 랭킹 목록 조회
app.get('/api/rankings', (req, res) => {
    try {
        // 점수 순으로 정렬 후 상위 50개만 반환
        const sortedRankings = rankings
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (b.level !== a.level) return b.level - a.level;
                return b.lines - a.lines;
            })
            .slice(0, 50);
        
        res.json({
            success: true,
            data: sortedRankings,
            total: rankings.length
        });
    } catch (error) {
        console.error('랭킹 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '랭킹 데이터를 불러올 수 없습니다.'
        });
    }
});

// 새 점수 추가
app.post('/api/rankings', (req, res) => {
    try {
        const { nickname, score, level, lines } = req.body;
        
        // 입력 값 검증
        if (!nickname || typeof score !== 'number' || typeof level !== 'number' || typeof lines !== 'number') {
            return res.status(400).json({
                success: false,
                error: '올바른 데이터를 입력해주세요.'
            });
        }
        
        if (score < 0 || level < 1 || lines < 0) {
            return res.status(400).json({
                success: false,
                error: '점수, 레벨, 라인 값이 올바르지 않습니다.'
            });
        }
        
        if (nickname.length > 20) {
            return res.status(400).json({
                success: false,
                error: '닉네임은 20자 이하로 입력해주세요.'
            });
        }
        
        // 새 점수 추가
        const newEntry = {
            nickname: nickname.trim(),
            score: parseInt(score),
            level: parseInt(level),
            lines: parseInt(lines),
            date: new Date().toISOString(),
            ip: req.ip || req.connection.remoteAddress // 기본적인 중복 방지
        };
        
        rankings.push(newEntry);
        
        // 점수 순으로 정렬
        rankings.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.level !== a.level) return b.level - a.level;
            return b.lines - a.lines;
        });
        
        // 순위 찾기 (1부터 시작)
        const rank = rankings.findIndex(entry => 
            entry.nickname === newEntry.nickname && 
            entry.score === newEntry.score && 
            entry.date === newEntry.date
        ) + 1;
        
        // 상위 1000개만 유지 (서버 용량 관리)
        if (rankings.length > 1000) {
            rankings = rankings.slice(0, 1000);
        }
        
        // 파일에 저장
        saveRankings();
        
        console.log(`새 점수 추가: ${nickname} - ${score}점 (${rank}위)`);
        
        res.json({
            success: true,
            data: {
                rank: rank,
                entry: newEntry,
                total: rankings.length
            }
        });
        
    } catch (error) {
        console.error('점수 추가 오류:', error);
        res.status(500).json({
            success: false,
            error: '점수를 등록할 수 없습니다.'
        });
    }
});

// 특정 플레이어의 최고 기록 조회
app.get('/api/rankings/player/:nickname', (req, res) => {
    try {
        const nickname = req.params.nickname;
        const playerRecords = rankings.filter(entry => 
            entry.nickname.toLowerCase() === nickname.toLowerCase()
        );
        
        if (playerRecords.length === 0) {
            return res.json({
                success: true,
                data: null,
                message: '해당 플레이어의 기록이 없습니다.'
            });
        }
        
        // 최고 점수 찾기
        const bestRecord = playerRecords.reduce((best, current) => 
            current.score > best.score ? current : best
        );
        
        // 전체 랭킹에서의 순위
        const sortedRankings = rankings.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.level !== a.level) return b.level - a.level;
            return b.lines - a.lines;
        });
        
        const rank = sortedRankings.findIndex(entry => 
            entry.nickname === bestRecord.nickname && 
            entry.score === bestRecord.score && 
            entry.date === bestRecord.date
        ) + 1;
        
        res.json({
            success: true,
            data: {
                ...bestRecord,
                rank: rank,
                totalGames: playerRecords.length
            }
        });
        
    } catch (error) {
        console.error('플레이어 기록 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '플레이어 기록을 조회할 수 없습니다.'
        });
    }
});

// 랭킹 초기화 (관리용)
app.delete('/api/rankings', (req, res) => {
    try {
        const { password } = req.body;
        
        // 간단한 비밀번호 확인
        if (password !== 'admin123') {
            return res.status(401).json({
                success: false,
                error: '권한이 없습니다.'
            });
        }
        
        rankings = [];
        saveRankings();
        
        console.log('랭킹 데이터가 초기화되었습니다.');
        
        res.json({
            success: true,
            message: '랭킹 데이터가 초기화되었습니다.'
        });
        
    } catch (error) {
        console.error('랭킹 초기화 오류:', error);
        res.status(500).json({
            success: false,
            error: '랭킹 데이터를 초기화할 수 없습니다.'
        });
    }
});

// 404 핸들러
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// 에러 핸들러
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('서버 오류가 발생했습니다.');
});

app.listen(PORT, () => {
    console.log(`테트리스 게임 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`브라우저에서 http://localhost:${PORT} 를 방문하세요.`);
    console.log(`랭킹 API: http://localhost:${PORT}/api/rankings`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('서버를 종료합니다...');
    saveRankings(); // 종료 시 랭킹 데이터 저장
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('서버를 종료합니다...');
    saveRankings(); // 종료 시 랭킹 데이터 저장
    process.exit(0);
});