const youtubedl = require('youtube-dl-exec');
const fs = require('fs');

async function testYtDlp() {
    try {
        console.log("Probando yt-dlp...");
        const subprocess = youtubedl.exec('https://www.youtube.com/watch?v=hghqd1eBTYQ', {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: [
                'referer:youtube.com',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            ]
        });

        subprocess.then(output => {
            console.log("Título:", output.title);
            const audioFormat = output.formats.find(f => f.acodec !== 'none' && f.vcodec === 'none');
            console.log("Audio URL:", audioFormat ? audioFormat.url.substring(0, 50) + '...' : 'No audio found');
        }).catch(err => {
            console.error("Error exec:", err.message);
        });

    } catch (e) {
        console.error("Error catch:", e.message);
    }
}
testYtDlp();
