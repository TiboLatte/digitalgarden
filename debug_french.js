const https = require('https');

// STRICT JOINED (Current)
const normalizeJoined = (text) => {
    let t = text.toLowerCase();
    t = t.replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/ß/g, 'ss');
    return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/['"‘’“”]/g, '') // DELETE
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ').trim();
};

// STRICT SPACED (Proposed Fallback)
const normalizeSpaced = (text) => {
    let t = text.toLowerCase();
    t = t.replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/ß/g, 'ss');
    return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        // REPLACE QUOTES WITH SPACE instead of delete
        .replace(/['"‘’“”]/g, ' ')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ').trim();
};

const getInfoFromQuery = (q) => {
    return new Promise((resolve) => {
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=1`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.items && json.items[0]) {
                        resolve({ found: true, title: json.items[0].volumeInfo.title });
                    } else {
                        resolve({ found: false });
                    }
                } catch (e) {
                    resolve({ found: false, error: e.message });
                }
            });
        }).on('error', (e) => resolve({ found: false, error: e.message }));
    });
};

(async () => {
    const title = "L'Étranger";

    console.log(`Testing: "${title}"`);

    // 1. Joined (Current) -> "letranger"
    const joined = normalizeJoined(title);
    console.log(`[Joined] Norm: "${joined}" -> Query: intitle:(${joined})`);
    let res = await getInfoFromQuery(`intitle:(${joined})`);
    console.log(`    Result: ${res.found ? '✅ ' + res.title : '❌ Not Found'}`);

    // 2. Spaced (Fallback) -> "l etranger"
    const spaced = normalizeSpaced(title);
    console.log(`[Spaced] Norm: "${spaced}" -> Query: intitle:(${spaced})`);
    res = await getInfoFromQuery(`intitle:(${spaced})`);
    console.log(`    Result: ${res.found ? '✅ ' + res.title : '❌ Not Found'}`);

    // Verify English regression?
    const eng = "Don't Make Me Think";
    console.log(`\nRegression Test: "${eng}"`);

    // Joined -> "dont make me think" (Should work)
    const engJoined = normalizeJoined(eng);
    console.log(`[Joined] Norm: "${engJoined}" -> Query: intitle:(${engJoined})`);
    res = await getInfoFromQuery(`intitle:(${engJoined})`);
    console.log(`    Result: ${res.found ? '✅ ' + res.title : '❌ Not Found'}`);

    // Spaced -> "don t make me think" (Should also work, but less ideal?)
    const engSpaced = normalizeSpaced(eng);
    console.log(`[Spaced] Norm: "${engSpaced}" -> Query: intitle:(${engSpaced})`);
    res = await getInfoFromQuery(`intitle:(${engSpaced})`);
    console.log(`    Result: ${res.found ? '✅ ' + res.title : '❌ Not Found'}`);

})();
