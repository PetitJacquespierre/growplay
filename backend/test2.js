const axios = require('axios');
const cheerio = require('cheerio');

async function testScrape() {
    try {
        console.log("Scraping playlist page...");
        // Use a generic user agent
        const { data } = await axios.get('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        const $ = cheerio.load(data);
        
        // Spotify stores initial state in <script id="initial-state" type="text/plain"> base64 encoded? No, usually it's JSON somewhere.
        // Let's find script tags with JSON
        let found = false;
        $('script').each((i, el) => {
            const html = $(el).html() || '';
            const id = $(el).attr('id');
            if (id === 'initial-state') {
                console.log("Encontrado initial-state!");
                const decoded = Buffer.from(html, 'base64').toString('utf8');
                console.log(decoded.substring(0, 200));
                found = true;
            }
        });
        if(!found) console.log("No se encontró initial-state. Estructura diferente.");
        
    } catch (e) {
        console.error("Error scraping:", e.message);
    }
}

testScrape();
