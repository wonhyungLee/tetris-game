const express = require('express');
const path = require('path');
const compression = require('compression');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 8080;

// 데이터베이스 설정
const DB_FILE = path.join(__dirname, 'tetris.db');
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('데이터베이스 연결 실패:', err.message);
    } else {
        console.log('SQLite 데이터베이스에 연결되었습니다.');
        db.run(`CREATE TABLE IF NOT EXISTS rankings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nickname TEXT NOT NULL,
            score INTEGER NOT NULL,
            level INTEGER NOT NULL,
            lines INTEGER NOT NULL,
            date TEXT NOT NULL,
            ip TEXT
        )`, (err) => {
            if (err) {
                console.error('테이블 생성 실패:', err.message);
            } else {
                // 테이블이 비어있을 경우 기본 데이터 추가
                db.get('SELECT COUNT(*) as count FROM rankings', (err, row) => {
                    if (row.count === 0) {
                        console.log('기본 랭킹 데이터를 추가합니다.');
                        const stmt = db.prepare('INSERT INTO rankings (nickname, score, level, lines, date) VALUES (?, ?, ?, ?, ?)');
                        const defaultRankings = [
                            { nickname: 'Player1', score: 50000, level: 5, lines: 25 },
                            { nickname: 'Player2', score: 40000, level: 4, lines: 20 },
                            { nickname: 'Player3', score: 30000, level: 3, lines: 15 },
                            { nickname: 'Player4', score: 20000, level: 2, lines: 10 },
                            { nickname: 'Player5', score: 10000, level: 1, lines: 5 }
                        ];
                        defaultRankings.forEach(r => {
                            stmt.run(r.nickname, r.score, r.level, r.lines, new Date().toISOString());
                        });
                        stmt.finalize();
                    }
                });
            }
        });
    }
});

// JSON 바디 파싱을 위한 미들웨어
app.use(express.json());

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
    const query = `
        SELECT * FROM rankings 
        ORDER BY score DESC, level DESC, lines DESC 
        LIMIT 50
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('랭킹 조회 오류:', err.message);
            return res.status(500).json({ success: false, error: '랭킹 데이터를 불러올 수 없습니다.' });
        }
        
        db.get('SELECT COUNT(*) as total FROM rankings', (err, countRow) => {
            if (err) {
                console.error('랭킹 총계 조회 오류:', err.message);
                return res.status(500).json({ success: false, error: '랭킹 데이터를 불러올 수 없습니다.' });
            }
            
            res.json({
                success: true,
                data: rows,
                total: countRow.total
            });
        });
    });
});

// 새 점수 추가
app.post('/api/rankings', (req, res) => {
    const { nickname, score, level, lines } = req.body;
    
    if (!nickname || typeof score !== 'number' || typeof level !== 'number' || typeof lines !== 'number' || score < 0 || level < 1 || lines < 0 || nickname.length > 20) {
        return res.status(400).json({ success: false, error: '올바른 데이터를 입력해주세요.' });
    }
    
    const newEntry = {
        nickname: nickname.trim(),
        score: parseInt(score),
        level: parseInt(level),
        lines: parseInt(lines),
        date: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress
    };
    
    const insertQuery = 'INSERT INTO rankings (nickname, score, level, lines, date, ip) VALUES (?, ?, ?, ?, ?, ?)';
    
    db.run(insertQuery, [newEntry.nickname, newEntry.score, newEntry.level, newEntry.lines, newEntry.date, newEntry.ip], function(err) {
        if (err) {
            console.error('점수 추가 오류:', err.message);
            return res.status(500).json({ success: false, error: '점수를 등록할 수 없습니다.' });
        }
        
        const newId = this.lastID;
        
        // 순위 계산
        const rankQuery = `
            SELECT COUNT(*) + 1 as rank 
            FROM rankings 
            WHERE score > ? OR 
                  (score = ? AND level > ?) OR 
                  (score = ? AND level = ? AND lines > ?)
        `;
        
        db.get(rankQuery, [newEntry.score, newEntry.score, newEntry.level, newEntry.score, newEntry.level, newEntry.lines], (err, row) => {
            if (err) {
                console.error('순위 계산 오류:', err.message);
                return res.status(500).json({ success: false, error: '순위를 계산할 수 없습니다.' });
            }
            
            console.log(`새 점수 추가: ${newEntry.nickname} - ${newEntry.score}점 (${row.rank}위)`);
            
            // 상위 1000개만 유지 (서버 용량 관리)
            db.run(`
                DELETE FROM rankings 
                WHERE id NOT IN (
                    SELECT id FROM rankings 
                    ORDER BY score DESC, level DESC, lines DESC 
                    LIMIT 1000
                )
            `);

            res.json({
                success: true,
                data: {
                    rank: row.rank,
                    entry: { id: newId, ...newEntry },
                }
            });
        });
    });
});

// 특정 플레이어의 최고 기록 조회
app.get('/api/rankings/player/:nickname', (req, res) => {
    const nickname = req.params.nickname;
    const bestRecordQuery = `
        SELECT * FROM rankings 
        WHERE nickname = ? 
        ORDER BY score DESC, level DESC, lines DESC 
        LIMIT 1
    `;
    
    db.get(bestRecordQuery, [nickname], (err, bestRecord) => {
        if (err) {
            console.error('플레이어 기록 조회 오류:', err.message);
            return res.status(500).json({ success: false, error: '플레이어 기록을 조회할 수 없습니다.' });
        }
        
        if (!bestRecord) {
            return res.json({ success: true, data: null, message: '해당 플레이어의 기록이 없습니다.' });
        }
        
        const rankQuery = `
            SELECT COUNT(*) + 1 as rank 
            FROM rankings 
            WHERE score > ? OR 
                  (score = ? AND level > ?) OR 
                  (score = ? AND level = ? AND lines > ?)
        `;
        
        db.get(rankQuery, [bestRecord.score, bestRecord.score, bestRecord.level, bestRecord.score, bestRecord.level, bestRecord.lines], (err, rankRow) => {
            if (err) {
                console.error('플레이어 순위 조회 오류:', err.message);
                return res.status(500).json({ success: false, error: '플레이어 기록을 조회할 수 없습니다.' });
            }
            
            db.get('SELECT COUNT(*) as totalGames FROM rankings WHERE nickname = ?', [nickname], (err, gamesRow) => {
                 if (err) {
                    console.error('플레이어 게임 수 조회 오류:', err.message);
                    return res.status(500).json({ success: false, error: '플레이어 기록을 조회할 수 없습니다.' });
                }
                
                res.json({
                    success: true,
                    data: {
                        ...bestRecord,
                        rank: rankRow.rank,
                        totalGames: gamesRow.totalGames
                    }
                });
            });
        });
    });
});

// 랭킹 초기화 (관리용)
app.delete('/api/rankings', (req, res) => {
    const { password } = req.body;
    
    if (password !== 'admin123') {
        return res.status(401).json({ success: false, error: '권한이 없습니다.' });
    }
    
    db.run('DELETE FROM rankings', (err) => {
        if (err) {
            console.error('랭킹 초기화 오류:', err.message);
            return res.status(500).json({ success: false, error: '랭킹 데이터를 초기화할 수 없습니다.' });
        }
        
        // 테이블 비우고 자동 증가 카운터 리셋
        db.run('DELETE FROM sqlite_sequence WHERE name="rankings"', () => {
            console.log('랭킹 데이터가 초기화되었습니다.');
            res.json({ success: true, message: '랭킹 데이터가 초기화되었습니다.' });
        });
    });
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

const server = app.listen(PORT, () => {
    console.log(`테트리스 게임 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`브라우저에서 http://localhost:${PORT} 를 방문하세요.`);
    console.log(`랭킹 API: http://localhost:${PORT}/api/rankings`);
});

// Graceful shutdown
const shutdown = () => {
    console.log('서버를 종료합니다...');
    server.close(() => {
        console.log('HTTP 서버가 닫혔습니다.');
        db.close((err) => {
            if (err) {
                console.error('데이터베이스 연결 종료 실패:', err.message);
            } else {
                console.log('데이터베이스 연결이 닫혔습니다.');
            }
            process.exit(0);
        });
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('처리되지 않은 프로미스 거부:', reason);
});
