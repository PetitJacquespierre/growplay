const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const ytSearch = require('yt-search');
const SpotifyWebApi = require('spotify-web-api-node');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Configuración de Spotify con las credenciales del usuario
const spotifyApi = new SpotifyWebApi({
  clientId: 'b9abd02c75b44996b98c723338ed6782',
  clientSecret: '821a00daedbe4fca99b6943c07adaf78'
});

// Función para renovar el token de Spotify de forma automática
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

// 2. Endpoint: Stream COMPLETO de YouTube (Usando yt-dlp.exe)
app.get('/api/stream-yt', (req, res) => {
    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: 'Falta videoId' });

    const url = `https://youtube.com/watch?v=${videoId}`;
    console.log(`[YT-DLP] Extrayendo audio de: ${url}`);

    // Restaurar audio/mpeg ya que permitía a Chrome hacer fallback y reproducir el webm
    res.header('Content-Type', 'audio/mpeg');
    
    const ytDlpCommand = process.platform === 'win32' ? './yt-dlp.exe' : 'yt-dlp';
    const ytDlp = spawn(ytDlpCommand, [
        '-f', 'bestaudio', 
        '--no-playlist', 
        '-o', '-',         
        url
    ]);

    ytDlp.stdout.pipe(res);

    ytDlp.stderr.on('data', (data) => {
        // console.error(`[yt-dlp] ${data}`);
    });

    ytDlp.on('close', (code) => {
        console.log(`[YT-DLP] Proceso finalizado con código ${code}`);
    });

    // CRÍTICO: Si el usuario cambia de canción o cierra la pestaña, matamos el proceso para no consumir RAM/Internet
    req.on('close', () => {
        console.log(`[YT-DLP] Conexión cerrada por el cliente, deteniendo proceso...`);
        ytDlp.kill('SIGINT');
    });
});

// 3. Endpoint: Importador de Spotify (API Oficial)
app.post('/api/import-spotify', async (req, res) => {
    try {
        const { playlistUrl } = req.body;
        if (!playlistUrl) return res.status(400).json({ error: 'Falta la URL' });

        // Extraer ID de la URL
        // Ej: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
        const match = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
        if (!match) return res.status(400).json({ error: 'URL de playlist inválida' });
        
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
        console.error("Error en extracción:", error);
        res.status(500).json({ error: 'Error procesando la playlist oficial' });
    }
});

app.listen(PORT, async () => {
    console.log(`🎵 Servidor Backend activo en el puerto ${PORT}`);
    await getSpotifyToken();
    console.log(`✅ Token de Spotify generado exitosamente.`);
});

