const fs = require('fs');
const path = require('path');
const https = require('https');

// Socrata API URLs
const POWERBALL_URL = 'https://data.ny.gov/resource/d6yy-54nr.json?$limit=50';
const MEGAMILLIONS_URL = 'https://data.ny.gov/resource/5xaw-6ayf.json?$limit=50';

const DATA_DIR = path.join(__dirname, 'public', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function fetchData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
                }
            });
            res.on('error', (err) => reject(err));
        }).on('error', (err) => reject(err));
    });
}

function transformPB(raw) {
    return raw.map(row => {
        if (!row.winning_numbers) return null;
        const date = row.draw_date.split('T')[0];
        const allNums = row.winning_numbers.trim().split(/\s+/);
        return {
            date,
            numbers: allNums.slice(0, 5).map(Number),
            special: Number(allNums[5]),
            multiplier: row.multiplier ? Number(row.multiplier) : null
        };
    }).filter(Boolean);
}

function transformMM(raw) {
    return raw.map(row => {
        if (!row.winning_numbers) return null;
        const date = row.draw_date.split('T')[0];
        const allNums = row.winning_numbers.trim().split(/\s+/);
        return {
            date,
            numbers: allNums.map(Number),
            special: Number(row.mega_ball),
            multiplier: row.multiplier ? Number(row.multiplier) : null
        };
    }).filter(Boolean);
}

async function start() {
    console.log('🔄 Starting Data Crawl with Merge...');

    try {
        // 1. Update Powerball
        console.log('📡 Fetching Powerball data...');
        const pbRaw = await fetchData(POWERBALL_URL);
        const pbNew = transformPB(pbRaw);

        const pbFile = path.join(DATA_DIR, 'powerball_history.json');
        let pbHistory = [];
        if (fs.existsSync(pbFile)) {
            pbHistory = JSON.parse(fs.readFileSync(pbFile, 'utf-8'));
        }

        // Merge and deduplicate by date
        const pbMap = new Map();
        [...pbNew, ...pbHistory].forEach(d => pbMap.set(d.date, d));
        const pbFinal = Array.from(pbMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));

        fs.writeFileSync(pbFile, JSON.stringify(pbFinal, null, 2));
        console.log(`✅ Powerball updated: ${pbFinal[0].date} (Total: ${pbFinal.length} draws)`);

        // 2. Update Mega Millions
        console.log('📡 Fetching Mega Millions data...');
        const mmRaw = await fetchData(MEGAMILLIONS_URL);
        const mmNew = transformMM(mmRaw);

        const mmFile = path.join(DATA_DIR, 'megamillions_history.json');
        let mmHistory = [];
        if (fs.existsSync(mmFile)) {
            mmHistory = JSON.parse(fs.readFileSync(mmFile, 'utf-8'));
        }

        const mmMap = new Map();
        [...mmNew, ...mmHistory].forEach(d => mmMap.set(d.date, d));
        const mmFinal = Array.from(mmMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));

        fs.writeFileSync(mmFile, JSON.stringify(mmFinal, null, 2));
        console.log(`✅ Mega Millions updated: ${mmFinal[0].date} (Total: ${mmFinal.length} draws)`);

        console.log('\n✨ All data successfully updated and merged in public/data/');
    } catch (error) {
        console.error('❌ Crawl failed:', error);
        process.exit(1);
    }
}

start();
