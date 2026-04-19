const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { exec } = require('child_process');

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 3000;
// 정적 파일 서빙 (public 폴더를 루트로 설정)
app.use(express.static(path.join(__dirname, 'public')));

// 모든 경로를 index.html로 리다이렉트 (SPA 방식)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// /data 경로를 public/data로 연결
app.use('/data', express.static(path.join(__dirname, 'public', 'data')));

// --- 데이터 업데이트 자동화 로직 ---
const runCrawler = () => {
    console.log(`[${new Date().toLocaleString()}] 🔄 Starting automated crawl...`);
    exec('node crawler.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Crawl Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`⚠️ Crawl Warning: ${stderr}`);
            return;
        }
        console.log(`✅ Crawl Success: ${stdout.trim()}`);
    });
};

/**
 * 미국 로또 추첨 시간 (ET 기준)
 * Powerball: Mon, Wed, Sat 10:59 PM
 * Mega Millions: Tue, Fri 11:00 PM
 * 
 * 한국 시간 기준으로는 대략 낮 시간대입니다.
 * 매시간 10분에 한번씩 체크하거나, 특정 시간대에 집중적으로 돌릴 수 있습니다.
 * 상용화를 위해 매시간 5분에 자동으로 업데이트를 시도하도록 설정합니다.
 */
cron.schedule('5 * * * *', () => {
    runCrawler();
});

// 초기 실행 (서버 켜질 때 한번 업데이트)
runCrawler();

// API: 최신 당첨 번호 가져오기 (필요 시)
app.get('/api/latest', (req, res) => {
    try {
        const pb = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'powerball_history.json'), 'utf-8'));
        const mm = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'megamillions_history.json'), 'utf-8'));
        res.json({
            powerball: pb[0],
            mega: mm[0]
        });
    } catch (e) {
        res.status(500).json({ error: 'Data not found' });
    }
});

app.listen(PORT, () => {
    console.log(`
🚀 US Lotto Master Server is Running!
📱 URL: http://localhost:${PORT}
🕒 Auto-Crawl: Enabled (Every hour at :05)
    `);
});
