const fetch = require('isomorphic-unfetch');
const { getTracks, getData } = require('spotify-url-info')(fetch);

async function testLib() {
    try {
        console.log("Probando spotify-url-info...");
        const data = await getData('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M');
        console.log("ÉXITO!");
        console.log("Nombre:", data.name);
        
        const tracks = await getTracks('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M');
        console.log("Canciones:", tracks.length);
        if(tracks.length > 0) {
            console.log("Track 1:", tracks[0].name, "-", tracks[0].artists[0].name);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testLib();
