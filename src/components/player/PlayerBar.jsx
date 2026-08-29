import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Heart, Shuffle, Repeat, Music, ChevronDown, FolderPlus, Volume2, Loader2 } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { useAuthStore } from '../../store/authStore';

export default function PlayerBar() {
  const { currentTrack, isPlaying, togglePlay, playNext, playPrev, setIsPlaying, favorites, toggleFavorite, isExpanded, setIsExpanded } = usePlayerStore();
  const { playlists, addTrackToPlaylist } = useAuthStore();
  
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  useEffect(() => { setImageError(false); }, [currentTrack]);

  const isFav = favorites.some(t => t.id === currentTrack?.id);

  // Efecto para cargar y reproducir el archivo físico (Blob) o Streaming en vivo
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    setIsBuffering(true);
    
    let objectUrl = null;

    if (currentTrack.audioData) {
      objectUrl = URL.createObjectURL(currentTrack.audioData);
      audioRef.current.src = objectUrl;
    } else if (currentTrack.streamUrl) {
      audioRef.current.src = currentTrack.streamUrl;
    } else {
      return;
    }
    
    // Al cambiar la canción, forzamos la carga y reproducción
    audioRef.current.load();
    const playPromise = audioRef.current.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.log("Autoplay prevenido / Interrupted:", e);
        // Silencioso, manejado por UI
      });
    }
  }, [currentTrack]);

  // Sincronizar botón central de Play/Pause
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    
    if (isPlaying) {
      if (audioRef.current.paused) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.log("Play interrupted", e);
          });
        }
      }
    } else {
      if (!audioRef.current.paused) {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sincronizar Progreso
  useEffect(() => {
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
  }, [currentTime, duration]);

  // Sincronizar Pantalla de Bloqueo (Media Session API)
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist || 'Grow Studio',
        album: 'Grow Play',
        artwork: [
          { src: currentTrack.cover || 'https://i.ibb.co/VvzK2B0/GrowPlayLogo.png', sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => { if (audioRef.current) audioRef.current.play(); setIsPlaying(true); });
      navigator.mediaSession.setActionHandler('pause', () => { if (audioRef.current) audioRef.current.pause(); setIsPlaying(false); });
      navigator.mediaSession.setActionHandler('previoustrack', playPrev);
      navigator.mediaSession.setActionHandler('nexttrack', playNext);
      navigator.mediaSession.setActionHandler('seekbackward', () => { if(audioRef.current) audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0); });
      navigator.mediaSession.setActionHandler('seekforward', () => { if(audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration); });
    }
  }, [currentTrack, playNext, playPrev, setIsPlaying, duration]);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  const displayTitle = currentTrack ? currentTrack.title : "Grow Play";
  const displayArtist = currentTrack ? currentTrack.artist : "Grow Studio";
  const displayCover = currentTrack?.cover || "/assets/GrowPlayIsotipo.png";

  // MANTENER EL AUDIO EN LA RAÍZ PARA EVITAR DESCONEXIONES AL ABRIR/CERRAR
  return (
    <>
      <audio 
         ref={audioRef}
         onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
         onLoadedMetadata={(e) => { setDuration(e.target.duration); setIsBuffering(false); }}
         onEnded={() => playNext()}
         onPlay={() => { setIsPlaying(true); setIsBuffering(false); }}
         onPause={() => setIsPlaying(false)}
         onWaiting={() => setIsBuffering(true)}
         onCanPlay={() => setIsBuffering(false)}
      />

      {currentTrack && isExpanded ? (
        // VISTA PANTALLA COMPLETA (NOW PLAYING)
        <div 
          className="fixed inset-0 z-[100] bg-gradient-to-b from-[#1a1d26] to-[#000000] flex flex-col items-center justify-between p-4 pb-8 animate-in slide-in-from-bottom-full duration-300 ease-out overflow-y-auto"
          onTouchStart={(e) => {
            setTouchStartX(e.targetTouches[0].clientX);
            setTouchStartY(e.targetTouches[0].clientY);
          }}
          onTouchEnd={(e) => {
            if (!touchStartX || !touchStartY) return;
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;
            
            const minSwipeDistance = 50;

            if (Math.abs(diffX) > Math.abs(diffY)) {
               if (diffX > minSwipeDistance) playNext(); 
               else if (diffX < -minSwipeDistance) playPrev(); 
            } else {
               if (diffY > minSwipeDistance) {
                  if (audioRef.current) audioRef.current.volume = Math.min(audioRef.current.volume + 0.1, 1);
               } else if (diffY < -minSwipeDistance) {
                  if (touchStartY < 150 && diffY < -100) {
                     setIsExpanded(false);
                  } else {
                     if (audioRef.current) audioRef.current.volume = Math.max(audioRef.current.volume - 0.1, 0);
                  }
               }
            }
            setTouchStartX(null);
            setTouchStartY(null);
          }}
        >
          {/* Cabecera */}
          <div className="w-full max-w-md flex justify-between items-center mb-4 mt-2 px-2 shrink-0">
            <ChevronDown size={32} className="text-gray-400 cursor-pointer hover:text-white transition" onClick={() => setIsExpanded(false)} />
            <span className="text-[10px] font-bold text-gray-300 tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full">Reproduciendo</span>
            <div className="w-8"></div>
          </div>

          {/* Carátula */}
          <div className="w-full max-w-[260px] md:max-w-sm aspect-square bg-[#12141a] rounded-[2rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-[#252830]/50 mb-6 shrink-0 relative group">
             {currentTrack.cover && !imageError ? (
                <img src={displayCover} alt="Cover" className="w-full h-full object-cover" onError={() => setImageError(true)} />
             ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900"><Music size={80} className="text-gray-700"/></div>
             )}
          </div>

          {/* Textos y Corazón */}
          <div className="w-full max-w-sm flex justify-between items-end mb-4 px-4 shrink-0">
             <div className="flex flex-col truncate pr-4">
                <h2 className="text-xl md:text-2xl font-black text-white truncate mb-1">{displayTitle}</h2>
                <p className="text-sm md:text-base text-cyan-neon truncate font-medium">{displayArtist}</p>
             </div>
             <div className="flex gap-4 items-center">
               <button onClick={() => setShowFolderSelector(true)} className="mb-1 shrink-0 transition-transform active:scale-90 text-gray-400 hover:text-white">
                 <FolderPlus size={28} />
               </button>
               <button onClick={() => toggleFavorite(currentTrack)} className="mb-1 shrink-0 transition-transform active:scale-90">
                 <Heart 
                   size={28} 
                   className={isFav ? "text-cyan-neon" : "text-gray-400 hover:text-cyan-neon transition"} 
                   fill={isFav ? "currentColor" : "none"} 
                 />
               </button>
             </div>
          </div>

          {/* Barra de Progreso */}
          <div className="w-full max-w-sm mb-6 px-4 shrink-0">
             <input 
               type="range"
               min="0"
               max={duration || 100}
               value={currentTime || 0}
               onChange={(e) => {
                 if (audioRef.current) {
                   audioRef.current.currentTime = Number(e.target.value);
                   setCurrentTime(Number(e.target.value));
                 }
               }}
               className="w-full h-2 bg-gray-800 rounded-lg appearance-none accent-cyan-neon cursor-pointer"
             />
             <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400 font-medium">{formatTime(currentTime)}</span>
                <span className="text-xs text-gray-400 font-medium">{formatTime(duration)}</span>
             </div>
          </div>

          {/* Controles Principales */}
          <div className="w-full max-w-sm flex flex-col items-center mb-4 px-4 shrink-0">
             <div className="flex items-center justify-between w-full mb-6">
               <div className="flex items-center gap-2 relative group cursor-pointer">
                  <Volume2 size={24} className="text-gray-500 hover:text-white transition" />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-[#12141a] p-2 rounded-lg border border-[#252830]">
                    <input 
                      type="range" min="0" max="1" step="0.05"
                      defaultValue="1"
                      onChange={(e) => {
                        if (audioRef.current) audioRef.current.volume = Number(e.target.value);
                      }}
                      className="w-24 h-1 bg-gray-700 rounded-full appearance-none accent-cyan-neon"
                    />
                 </div>
               </div>
               
               <Shuffle size={24} className="text-gray-500 hover:text-white transition cursor-pointer" />
               
               <SkipBack onClick={playPrev} size={36} className="text-white hover:text-cyan-neon transition cursor-pointer active:scale-90 shrink-0" />
               
               <button 
                 onClick={togglePlay}
                 className="w-16 h-16 bg-cyan-neon text-black rounded-full flex items-center justify-center hover:scale-105 hover:bg-electric-orange transition-all active:scale-95 shadow-[0_0_20px_rgba(0,229,255,0.3)] shrink-0"
               >
                 {isBuffering ? (
                   <Loader2 size={32} className="animate-spin" />
                 ) : isPlaying ? (
                   <Pause size={32} fill="currentColor" />
                 ) : (
                   <Play size={32} fill="currentColor" className="ml-1" />
                 )}
               </button>
               
               <SkipForward onClick={playNext} size={36} className="text-white hover:text-cyan-neon transition cursor-pointer active:scale-90 shrink-0" />
               
               <Repeat size={24} className="text-gray-500 hover:text-white transition cursor-pointer" />
            </div>
          </div>
        </div>
      ) : currentTrack ? (
        // VISTA BARRA INFERIOR POR DEFECTO
        <div className="h-24 bg-[#0a0c0f] border-t border-[#1a1c23] flex items-center justify-between px-4 md:px-6 z-50 transition-all relative">
          <div 
            className="flex items-center gap-3 w-1/3 cursor-pointer group"
            onClick={() => { if(currentTrack) setIsExpanded(true); }}
            title="Abrir reproductor"
          >
            <div className={`w-14 h-14 bg-[#12141a] rounded-md overflow-hidden relative shadow-lg border border-[#252830] flex items-center justify-center group-hover:border-cyan-neon transition-colors ${!currentTrack ? 'p-1' : ''}`}>
               {(currentTrack && !currentTrack.cover) || imageError ? (
                  <Music size={24} className="text-gray-500" />
               ) : (
                  <img src={displayCover} alt="Track Cover" className={`w-full h-full ${!currentTrack ? 'object-contain' : 'object-cover'}`} onError={() => setImageError(true)} />
               )}
               {currentTrack && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <ChevronDown size={20} className="text-white rotate-180" />
                  </div>
               )}
            </div>
            <div className="hidden sm:flex flex-col truncate">
              <h4 className="text-sm font-bold text-white leading-tight truncate group-hover:text-cyan-neon transition-colors">{displayTitle}</h4>
              <p className="text-xs text-gray-400 truncate">{displayArtist}</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center w-full max-w-md">
            <div className="flex items-center gap-6">
              <Shuffle size={18} className="text-gray-400 hover:text-white cursor-pointer transition hidden sm:block" />
              <SkipBack onClick={playPrev} size={24} className="text-gray-300 hover:text-white cursor-pointer transition active:scale-95" />
              <button 
                onClick={togglePlay}
                disabled={!currentTrack}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-black transition shadow-[0_0_15px_rgba(255,85,0,0.4)]
                  ${currentTrack ? 'bg-electric-orange hover:scale-105 active:scale-95' : 'bg-gray-700 shadow-none cursor-not-allowed opacity-50'}`}
              >
                {isBuffering ? (
                   <Loader2 size={24} className="animate-spin" />
                 ) : isPlaying ? (
                   <Pause size={24} fill="currentColor" />
                 ) : (
                   <Play size={24} className="ml-1" fill="currentColor" />
                 )}
              </button>
              <SkipForward onClick={playNext} size={24} className="text-gray-300 hover:text-white cursor-pointer transition active:scale-95" />
              <Repeat size={18} className="text-gray-400 hover:text-white cursor-pointer transition hidden sm:block" />
            </div>
            
            <div className="w-full flex items-center gap-3 mt-2">
              <span className="text-[11px] text-gray-400 font-medium w-8 text-right">{formatTime(currentTime)}</span>
              <div className="h-2 flex-1 bg-gray-800 rounded-full overflow-hidden cursor-pointer group relative" onClick={handleSeek}>
                <div className="h-full bg-cyan-neon relative group-hover:bg-electric-orange transition-colors" style={{ width: `${progress}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_8px_#00E5FF] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>
              <span className="text-[11px] text-gray-400 font-medium w-8">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex justify-end w-1/3 items-center gap-4 pr-2">
            {currentTrack && (
              <>
                <button onClick={() => setShowFolderSelector(true)} className="transition-transform active:scale-90 text-gray-400 hover:text-white">
                  <FolderPlus size={24} />
                </button>
                <button onClick={() => toggleFavorite(currentTrack)} className="transition-transform active:scale-90">
                   <Heart 
                     size={24} 
                     className={isFav ? "text-cyan-neon" : "text-gray-400 hover:text-cyan-neon transition"} 
                     fill={isFav ? "currentColor" : "none"} 
                   />
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Modal Añadir a Carpeta */}
      {showFolderSelector && (
        <div className="fixed inset-0 z-[120] bg-black/80 flex items-end md:items-center justify-center">
          <div className="bg-[#12141a] w-full md:w-[400px] rounded-t-3xl md:rounded-3xl p-6 border-t md:border border-[#252830] animate-in slide-in-from-bottom-full md:zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Añadir a carpeta</h3>
              <button onClick={() => setShowFolderSelector(false)} className="text-gray-400 hover:text-white">
                <ChevronDown size={28} className="md:hidden" />
                <span className="hidden md:block text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto hide-scrollbar space-y-2 mb-6">
              {playlists.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No tienes carpetas. Crea una en la Biblioteca.</p>
              ) : (
                playlists.map(folder => (
                  <button 
                    key={folder.id}
                    onClick={() => {
                      addTrackToPlaylist(folder.id, currentTrack);
                      setShowFolderSelector(false);
                    }}
                    className="w-full text-left p-4 rounded-xl bg-[#0a0c0f] hover:bg-[#1a1c23] border border-[#252830] text-white flex items-center justify-between group transition"
                  >
                    <span className="font-bold">{folder.name}</span>
                    <span className="text-xs text-gray-500 group-hover:text-cyan-neon">{folder.tracks?.length || 0} pistas</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
