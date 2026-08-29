const yt = require('youtube-ext');

async function testExt() {
    try {
        console.log("Probando youtube-ext...");
        const info = await yt.videoInfo('https://www.youtube.com/watch?v=hghqd1eBTYQ');
        const formats = info.streamingData.formats.concat(info.streamingData.adaptiveFormats);
        const audioFormats = formats.filter(f => f.mimeType.includes('audio'));
        console.log("Encontrados formatos de audio:", audioFormats.length);
        if(audioFormats.length > 0) {
            console.log("Audio URL:", audioFormats[0].url.substring(0, 50));
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}
testExt();
