const admin = require('firebase-admin');
const https = require('https');

// Firebase Admin 초기화 (환경 변수 사용)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();

// Socrata API URLs
const POWERBALL_URL = 'https://data.ny.gov/resource/d6yy-54nr.json?$limit=10';
const MEGAMILLIONS_URL = 'https://data.ny.gov/resource/5xaw-6ayf.json?$limit=10';

async function fetchData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
            res.on('error', (err) => reject(err));
        });
    });
}

export default async function handler(req, res) {
    // Vercel Cron Secret 확인 (보안)
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).end('Unauthorized');
    }

    try {
        console.log('🔄 Starting Vercel Automated Crawl...');

        // 1. Powerball 업데이트
        const pbRaw = await fetchData(POWERBALL_URL);
        const pbBatch = db.batch();
        pbRaw.forEach(row => {
            if (!row.winning_numbers) return;
            const date = row.draw_date.split('T')[0];
            const allNums = row.winning_numbers.trim().split(/\s+/);
            const docRef = db.collection('pb_history').doc(date);
            pbBatch.set(docRef, {
                date,
                numbers: allNums.slice(0, 5).map(Number),
                special: Number(allNums[5]),
                multiplier: row.multiplier ? Number(row.multiplier) : null
            }, { merge: true });
        });
        await pbBatch.commit();

        // 2. Mega Millions 업데이트
        const mmRaw = await fetchData(MEGAMILLIONS_URL);
        const mmBatch = db.batch();
        mmRaw.forEach(row => {
            if (!row.winning_numbers) return;
            const date = row.draw_date.split('T')[0];
            const allNums = row.winning_numbers.trim().split(/\s+/);
            const docRef = db.collection('mm_history').doc(date);
            mmBatch.set(docRef, {
                date,
                numbers: allNums.map(Number),
                special: Number(row.mega_ball),
                multiplier: row.multiplier ? Number(row.multiplier) : null
            }, { merge: true });
        });
        await mmBatch.commit();

        res.status(200).json({ success: true, message: 'Crawl and Sync completed' });
    } catch (error) {
        console.error('❌ Crawl failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
