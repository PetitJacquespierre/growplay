const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const ytSearch = require('yt-search');
const SpotifyWebApi = require('spotify-web-api-node');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ConfiguraciÃ³n de Spotify con las credenciales del usuario
const spotifyApi = new SpotifyWebApi({
  clientId: 'b9abd02c75b44996b98c723338ed6782',
  clientSecret: '821a00daedbe4fca99b6943c07adaf78'
});

// FunciÃ³n para renovar el token de Spotify de forma automÃ¡tica
const getSpotifyToken = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    return true;
  } catch (error) {
    console.error('Error obteniendo token de Spotify', error);
    return false;
  }
};

// 1. Endpoint: Buscar en YouTube (Para obtener el ID)
app.get('/api/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ error: 'Falta query' });
        
        const r = await ytSearch(query);
        res.json(r.videos.slice(0, 5));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Endpoint: Stream COMPLETO (Motor Híbrido SoundCloud usando yt-dlp)
app.get('/api/stream-yt', async (req, res) => {
    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: 'Falta videoId' });

    try {
        let trackTitle = videoId;
        try {
            const response = await fetch('https://youtube.com/watch?v=' + videoId);
            const html = await response.text();
            const match = html.match(/<title>(.*?) - YouTube<\/title>/);
            if (match && match[1]) {
                trackTitle = match[1].replace(/official|music|video|audio|lyric|hd|4k/gi, '').replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();
            }
        } catch(e) {
            console.log(`[SOUNDCLOUD HYBRID] Fallo fetch rápido, usando ytSearch...`);
            try {
                const ytSearch = require('yt-search');
                const videoData = await ytSearch({ videoId: videoId });
                if (videoData && videoData.title) {
                    trackTitle = videoData.title.replace(/official|music|video|audio|lyric|hd|4k/gi, '').replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();
                }
            } catch(err) { }
        }

        const scQuery = `scsearch1:${trackTitle}`;
        console.log(`[SOUNDCLOUD HYBRID] Buscando: ${scQuery}`);
        
        const ytDlpCommand = process.platform === 'win32' ? './yt-dlp.exe' : 'yt-dlp';
        // Volvemos a pedir SOLO la URL (--get-url)
        const ytDlp = spawn(ytDlpCommand, ['-f', 'bestaudio', '--get-url', scQuery]);

        let audioUrl = '';
        ytDlp.stdout.on('data', data => { audioUrl += data.toString(); });
        ytDlp.stderr.on('data', data => { console.error(`[yt-dlp] ${data.toString().trim()}`); });

        ytDlp.on('close', async code => {
            const finalUrl = audioUrl.trim().split('\n').pop(); // Asegurar obtener solo el link
            if (code === 0 && finalUrl) {
                // MAGIA: Detectar si es una descarga (Modo Búnker) o si es el reproductor normal
                const isDownload = req.headers['sec-fetch-mode'] === 'cors' || req.headers['origin'];
                
                if (isDownload) {
                    console.log('[SOUNDCLOUD HYBRID] MODO BÚNKER (Descarga) detectado. Proxeando audio sin CORS...');
                    try {
                        const axios = require('axios');
                        const response = await axios({ method: 'get', url: finalUrl, responseType: 'stream' });
                        res.setHeader('Content-Type', response.headers['content-type'] || 'audio/mpeg');
                        res.setHeader('Access-Control-Allow-Origin', '*');
                        response.data.pipe(res);
                    } catch(err) {
                        console.error('[SOUNDCLOUD] Fallo al proxear la descarga:', err.message);
                        if (!res.headersSent) res.status(500).json({ error: 'Error en Proxy' });
                    }
                } else {
                    console.log('[SOUNDCLOUD HYBRID] REPRODUCTOR NORMAL detectado. Redirigiendo a CDN...');
                    return res.redirect(finalUrl);
                }
            } else {
                return res.status(500).json({ error: 'Error extrayendo audio' });
            }
        });

        req.on('close', () => { ytDlp.kill('SIGINT'); });
    } catch (error) {
        if (!res.headersSent) res.status(500).json({ error: error.message });
    }
});
app.post('/api/import-spotify', async (req, res) => {
    try {
        const { playlistUrl } = req.body;
        if (!playlistUrl) return res.status(400).json({ error: 'Falta la URL' });

        // Extraer ID de la URL
        // Ej: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
        const match = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
        if (!match) return res.status(400).json({ error: 'URL de playlist invÃ¡lida' });
        
        const playlistId = match[1];

        // Obtener/Renovar Token
        await getSpotifyToken();

        // Obtener la playlist
        const response = await spotifyApi.getPlaylist(playlistId);
        const data = response.body;

        const tracks = data.tracks.items.map(item => {
            const track = item.track;
            if (!track) return null;
            return {
                title: track.name,
                artist: track.artists.map(a => a.name).join(', '),
                cover: track.album?.images?.[0]?.url || null,
                previewUrl: track.preview_url || null
            };
        }).filter(Boolean); // Remover nulos

        res.json({ 
            name: data.name,
            description: data.description || 'Lista importada',
            cover: data.images?.[0]?.url || null,
            tracks: tracks
        });
        
    } catch (error) {
        console.error("Error en extracciÃ³n:", error);
        res.status(500).json({ error: 'Error procesando la playlist oficial' });
    }
});

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`ðŸŽµ Servidor Backend activo en el puerto ${PORT}`);
    await getSpotifyToken();
    console.log(`âœ… Token de Spotify generado exitosamente.`);
});






















