const http = require('http');
const fs = require('fs');
const path = require('path');

// Server under test: npm start serves on 3000; set PORT to test another instance
const BASE = 'http://localhost:' + (process.env.PORT || 3000);

http.get(BASE + '/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        // extract all img src
        const imgMatches = [...data.matchAll(/<img[^>]+src=["']([^"']+)["']/g)].map(m => m[1]);
        const uniqueImgs = [...new Set(imgMatches)];
        console.log(`Found ${uniqueImgs.length} unique images on homepage.`);

        let found = 0;
        let missing = 0;
        uniqueImgs.forEach(src => {
            if (src.startsWith('http')) {
                // external or absolute
                found++;
            } else {
                const localPath = path.join(__dirname, '..', '..', 'public', src);
                if (fs.existsSync(localPath)) {
                    found++;
                } else {
                    console.log('Missing local image:', src);
                    missing++;
                }
            }
        });
        console.log(`Asset Audit Result: ${found} found, ${missing} missing.`);
    });
});
