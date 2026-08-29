const axios = require('axios');

async function testToken() {
    try {
        console.log("Obteniendo token anónimo...");
        const res = await axios.get('https://open.spotify.com/get_access_token?reason=transport&productType=web_player');
        const token = res.data.accessToken;
        console.log("Token obtenido:", token ? "SÍ" : "NO");

        console.log("Consultando playlist con token anónimo...");
        const playlistId = '37i9dQZF1DXcBWIGoYBM5M'; // Today's Top Hits
        const apiRes = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log("ÉXITO! Playlist:", apiRes.data.name);
        console.log("Canciones encontradas:", apiRes.data.tracks.items.length);
    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}

testToken();
