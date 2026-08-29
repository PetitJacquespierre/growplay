import React, { useState } from 'react';
import { Search, Download, Music, Loader2, Check, AlertCircle, Play, CheckCircle, Loader, CloudDownload, Mic } from 'lucide-react';
import { saveTrackOffline } from '../../services/db';
import { usePlayerStore } from '../../store/playerStore';

export default function ExploreView() {
  const { playTrack } = usePlayerStore();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playlistData, setPlaylistData] = useState(null);
  const [isListening, setIsListening] = useState(false);
  
  // Guardaremos el estado de descarga de cada canción por su índice
  const [downloadStatus, setDownloadStatus] = useState({});

  const handleSearch = async (eOrQuery) => {
    let searchQuery = query;
    if (typeof eOrQuery === 'string') {
      searchQuery = eOrQuery;
      setQuery(eOrQuery);
    } else if (eOrQuery && eOrQuery.preventDefault) {
      eOrQuery.preventDefault();
    }

    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setPlaylistData(null);
    setDownloadStatus({});

    try {
      if (searchQuery.includes('spotify.com')) {
        // MODO 1: Importar Playlist de Spotify
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/import-spotify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playlistUrl: searchQuery })
        });
        if (!res.ok) throw new Error('Error al importar');
        const data = await res.json();
        setPlaylistData(data);
      } else {
        // MODO 2: Búsqueda Directa en YouTube (o por Voz)
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/search?query=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) throw new Error('Error al buscar');
        const searchData = await res.json();
        
        if (searchData && searchData.length > 0) {
          const tracks = searchData.map(v => ({
            title: v.title,
            artist: v.author?.name || 'YouTube',
            cover: v.thumbnail || v.image || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            videoId: v.videoId 
          }));
          
          setPlaylistData({
            name: `Resultados para "${searchQuery}"`,
            description: 'Búsqueda de Asistente',
            cover: tracks[0].cover,
            tracks: tracks
          });
        } else {
          alert('No se encontraron resultados');
        }
      }
    } catch (error) {
      console.error(error);
      alert('Error en la búsqueda');
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta búsqueda por voz. Intenta usar Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onspeechend = () => recognition.stop();
    recognition.onerror = (event) => {
      console.error("Voice error:", event.error);
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      handleSearch(transcript); // Ejecutar búsqueda automáticamente
    };

    recognition.start();
  };

  const handleDownload = async (track, index) => {
    if (downloadStatus[index] === 'loading' || downloadStatus[index] === 'done') return;

    try {
      setDownloadStatus(prev => ({ ...prev, [index]: 'loading' }));
      
      let videoId = track.videoId;
      if (!videoId) {
        const searchRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/search?query=${encodeURIComponent(track.title + ' ' + track.artist)}`);
        const searchData = await searchRes.json();
        if (!searchData || searchData.length === 0) throw new Error('No encontrado');
        videoId = searchData[0].videoId;
      }

      const streamRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/stream-yt?videoId=${videoId}`);
      if (!streamRes.ok) throw new Error('Error obteniendo el audio completo');
      
      const blob = await streamRes.blob();
      const trackCover = track.cover || playlistData?.cover;

      await saveTrackOffline({
        id: track.title.replace(/\s+/g, '-').toLowerCase(),
        title: track.title,
        artist: track.artist,
        cover: trackCover,
        videoId: videoId
      }, blob);

      setDownloadStatus(prev => ({ ...prev, [index]: 'done' }));
    } catch (error) {
      console.error("Error en la descarga:", error);
      setDownloadStatus(prev => ({ ...prev, [index]: 'error' }));
    }
  };

  return (
    <div className="p-4 md:p-8 pb-32 max-w-5xl mx-auto h-full overflow-y-auto">
      <header className="mb-8 pt-2">
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          Asistente Grow Play
        </h2>
        <p className="text-gray-400 mt-2">Dime qué quieres escuchar y yo lo pongo.</p>
      </header>

      {/* Barra de Búsqueda y Botón de Voz */}
      <div className="mb-10">
        <div className="flex gap-4 items-center">
          <form onSubmit={handleSearch} className="relative flex items-center flex-1 bg-[#12141a] border border-[#252830] rounded-full overflow-hidden shadow-lg focus-within:border-cyan-neon transition-colors">
            <div className="pl-5 text-gray-400">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar manualmente..." 
              className="w-full bg-transparent text-white px-4 py-4 focus:outline-none placeholder-gray-600 text-sm md:text-base"
            />
          </form>
          
          {/* BOTÓN ASISTENTE DE VOZ */}
          <button 
            onClick={startVoiceRecognition}
            className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
              isListening ? 'bg-red-500 animate-pulse scale-110' : 'bg-cyan-neon hover:scale-105 active:scale-95'
            }`}
            title="Asistente de Voz"
          >
            <Mic size={28} className={isListening ? "text-white" : "text-black"} />
          </button>
        </div>
        {isListening && <p className="text-cyan-neon text-sm font-bold text-center mt-4 animate-pulse">Te escucho...</p>}
      </div>

      {isLoading && (
         <div className="text-center text-cyan-neon font-bold animate-pulse mt-10">
           Buscando la mejor pista para ti...
         </div>
      )}

      {!isLoading && playlistData && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-[#12141a] p-4 rounded-xl border border-[#252830]">
             {playlistData.cover ? (
                <img src={playlistData.cover} alt="Cover" className="w-20 h-20 rounded-md shadow-lg object-cover" />
             ) : (
                <div className="w-20 h-20 bg-gray-800 rounded-md flex items-center justify-center"><Music /></div>
             )}
             <div>
                <h3 className="text-xl font-bold text-white">{playlistData.name}</h3>
                <p className="text-sm text-gray-400">{playlistData.description}</p>
             </div>
          </div>

          <div className="space-y-3">
            {playlistData.tracks.map((track, i) => {
              const trackCover = track.cover || playlistData.cover;
              return (
              <div key={i} className="flex items-center justify-between bg-[#12141a] border border-[#252830] p-3 rounded-xl hover:bg-[#1a1d26] transition">
                <div className="flex items-center gap-4 w-2/3">
                  {trackCover ? (
                    <img src={trackCover} alt="cover" className="w-10 h-10 rounded-md object-cover shadow-md" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-800 rounded-md flex items-center justify-center shrink-0"><Music size={16}/></div>
                  )}
                  <div className="flex-col truncate w-full">
                    <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                    <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                       try {
                         let videoId = track.videoId;
                         if (!videoId) {
                           const searchQuery = `${track.title} ${track.artist} audio`;
                           const searchRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/search?query=${encodeURIComponent(searchQuery)}`);
                           const searchData = await searchRes.json();
                           if(searchData && searchData.length > 0) videoId = searchData[0].videoId;
                         }
                         if(videoId) {
                           playTrack({
                             id: track.videoId, // Usar videoId como ID
                             title: track.title,
                             artist: track.artist,
                             cover: trackCover,
                             streamUrl: `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/stream-yt?videoId=${videoId}`,
                             videoId: videoId
                           });
                         }
                       } catch(e) { console.error("Error al reproducir en vivo"); }
                    }}
                    className="p-2 rounded-full bg-gray-800 text-white hover:bg-electric-orange transition shadow-md"
                    title="Escuchar ahora"
                  >
                    <Play size={16} fill="currentColor" />
                  </button>

                  <button 
                    onClick={() => handleDownload(track, i)}
                    disabled={downloadStatus[i] === 'loading' || downloadStatus[i] === 'done'}
                    className={`p-2 rounded-full transition shadow-md ${
                      downloadStatus[i] === 'done' ? 'bg-green-500/20 text-green-500' :
                      downloadStatus[i] === 'loading' ? 'bg-electric-orange/20 text-electric-orange animate-spin' :
                      downloadStatus[i] === 'error' ? 'bg-red-500/20 text-red-500' :
                      'bg-gray-800 text-cyan-neon hover:bg-gray-700'
                    }`}
                    title="Descargar offline"
                  >
                    {downloadStatus[i] === 'done' ? <CheckCircle size={20} /> :
                     downloadStatus[i] === 'loading' ? <Loader size={20} /> :
                     downloadStatus[i] === 'error' ? <AlertCircle size={20} /> :
                     <CloudDownload size={20} />}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


