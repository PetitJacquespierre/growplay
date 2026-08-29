import React, { useState } from 'react';
import { Heart, Plus, Folder, Music, ChevronRight, ChevronLeft, Play, ChevronDown, Download, Loader2, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePlayerStore } from '../../store/playerStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { saveTrackOffline } from '../../services/db';

export default function LibraryView({ setActiveTab }) {
  const { user, playlists } = useAuthStore();
  const { favorites, playTrack } = usePlayerStore();
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const { addTrackToPlaylist, removeTrackFromPlaylist } = useAuthStore.getState();
  const [showManageTracksModal, setShowManageTracksModal] = useState(false);

  // Estados para Modo Búnker (Descargar Carpeta Completa)
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      useAuthStore.getState().createPlaylist(newFolderName.trim());
      setNewFolderName("");
      setShowNewFolderModal(false);
    }
  };

  const handleMoveTrack = async (playlist, index, direction) => {
    if (!user) return;
    if (index === 0 && direction === -1) return;
    if (index === playlist.tracks.length - 1 && direction === 1) return;
    
    const newTracks = [...playlist.tracks];
    const temp = newTracks[index];
    newTracks[index] = newTracks[index + direction];
    newTracks[index + direction] = temp;
    
    const playlistRef = doc(db, 'users', user.uid, 'playlists', playlist.id);
    try {
      await updateDoc(playlistRef, { tracks: newTracks });
      useAuthStore.setState(state => ({
        playlists: state.playlists.map(p => p.id === playlist.id ? { ...p, tracks: newTracks } : p)
      }));
      setSelectedPlaylist({ ...playlist, tracks: newTracks });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadFolder = async (playlist) => {
    if (!playlist.tracks || playlist.tracks.length === 0) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    
    let count = 0;
    for (const track of playlist.tracks) {
      try {
        const streamUrl = track.streamUrl || `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/stream-yt?videoId=${track.id}`;
        const response = await fetch(streamUrl);
        if (response.ok) {
          const blob = await response.blob();
          await saveTrackOffline(track, blob);
        }
      } catch (e) {
        console.error("Fallo descargando para Modo Búnker:", track.title);
      }
      count++;
      setDownloadProgress(Math.round((count / playlist.tracks.length) * 100));
    }
    
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadProgress(0);
    }, 1500);
  };

  // VISTA DETALLE DE CARPETA
  if (selectedPlaylist) {
    const currentPl = playlists.find(p => p.id === selectedPlaylist.id) || selectedPlaylist;
    
    const allKnownTracksMap = new Map();
    favorites.forEach(t => allKnownTracksMap.set(t.id, t));
    playlists.forEach(pl => pl.tracks?.forEach(t => allKnownTracksMap.set(t.id, t)));
    const allKnownTracks = Array.from(allKnownTracksMap.values());

    return (
      <div className="p-4 md:p-8 pb-32 max-w-5xl mx-auto h-full overflow-y-auto animate-in slide-in-from-right-4 fade-in relative">
        <header className="flex items-center gap-2 md:gap-4 mb-8 pt-2">
          <button onClick={() => setSelectedPlaylist(null)} className="p-2 -ml-2 text-white hover:text-cyan-neon transition rounded-full shrink-0">
            <ChevronLeft size={32} />
          </button>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight truncate">{currentPl.name}</h2>
            <p className="text-gray-400 text-sm md:text-base">{currentPl.tracks?.length || 0} canciones</p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => handleDownloadFolder(currentPl)}
              disabled={isDownloading || !currentPl.tracks?.length}
              className="w-10 h-10 md:w-12 md:h-12 bg-[#12141a] border border-[#252830] text-electric-orange rounded-full flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg transition disabled:opacity-50"
              title="Modo Búnker (Descargar Carpeta)"
            >
              {isDownloading ? (
                <div className="relative flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-electric-orange" />
                  <span className="absolute text-[8px] font-bold">{downloadProgress}%</span>
                </div>
              ) : (
                <Download size={20} />
              )}
            </button>
            <button 
              onClick={() => setShowManageTracksModal(true)}
              className="w-10 h-10 md:w-12 md:h-12 bg-[#12141a] border border-[#252830] text-gray-300 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg transition"
              title="Añadir/Quitar canciones"
            >
              <Plus size={24} />
            </button>
            {currentPl.tracks?.length > 0 && (
              <button 
                onClick={() => playTrack(currentPl.tracks[0], currentPl.tracks)}
                className="w-10 h-10 md:w-12 md:h-12 bg-cyan-neon text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,229,255,0.3)] transition"
              >
                <Play size={24} fill="currentColor" className="ml-1" />
              </button>
            )}
          </div>
        </header>

        <div className="space-y-2">
          {currentPl.tracks?.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <Folder size={48} className="mx-auto mb-4 opacity-20" />
              <p>Esta carpeta está vacía.</p>
              <p className="text-sm mt-2">Usa el botón <strong>+</strong> arriba para añadir canciones.</p>
            </div>
          ) : (
            currentPl.tracks?.map((track, idx) => (
              <div key={track.id + idx} className="flex items-center p-3 bg-[#0a0c0f] border border-transparent hover:border-[#252830] rounded-xl transition group">
                <div onClick={() => playTrack(track, currentPl.tracks)} className="w-12 h-12 bg-[#12141a] rounded-lg overflow-hidden shrink-0 cursor-pointer relative">
                  {track.cover ? (
                    <img src={track.cover} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Music size={20} className="text-gray-600" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Play size={20} className="text-white" fill="white" />
                  </div>
                </div>
                
                <div onClick={() => playTrack(track, currentPl.tracks)} className="ml-4 flex-1 cursor-pointer overflow-hidden pr-2">
                  <h4 className="text-white font-bold truncate group-hover:text-cyan-neon transition">{track.title}</h4>
                  <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                </div>

                <div className="flex flex-col gap-1 mx-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    disabled={idx === 0} 
                    onClick={() => handleMoveTrack(currentPl, idx, -1)} 
                    className="p-1 text-gray-500 hover:text-white disabled:opacity-20 hover:bg-[#1a1c23] rounded transition"
                    title="Mover arriba"
                  >
                    <ChevronUp size={20}/>
                  </button>
                  <button 
                    disabled={idx === currentPl.tracks.length - 1} 
                    onClick={() => handleMoveTrack(currentPl, idx, 1)} 
                    className="p-1 text-gray-500 hover:text-white disabled:opacity-20 hover:bg-[#1a1c23] rounded transition"
                    title="Mover abajo"
                  >
                    <ChevronDown size={20}/>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal: Administrar Canciones */}
        {showManageTracksModal && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col md:items-center justify-end md:justify-center p-0 md:p-4">
            <div className="bg-[#12141a] border-t md:border border-[#252830] w-full md:max-w-md h-[80vh] md:h-[600px] rounded-t-3xl md:rounded-3xl flex flex-col animate-in slide-in-from-bottom-full md:zoom-in-95 duration-200">
              
              <div className="flex justify-between items-center p-6 border-b border-[#252830]">
                <div>
                  <h3 className="text-xl font-bold text-white">Administrar Carpeta</h3>
                  <p className="text-xs text-gray-400">Selecciona las canciones para '{currentPl.name}'</p>
                </div>
                <button onClick={() => setShowManageTracksModal(false)} className="text-gray-400 hover:text-white bg-[#0a0c0f] p-2 rounded-full">
                  <ChevronDown size={24} className="md:hidden" />
                  <span className="hidden md:block leading-none text-xl">&times;</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
                {allKnownTracks.length === 0 ? (
                   <p className="text-center text-gray-500 py-10 text-sm">Aún no has agregado o descargado ninguna canción en tu biblioteca. Escucha y guarda canciones para que aparezcan aquí.</p>
                ) : (
                  allKnownTracks.map(track => {
                    const isInPlaylist = currentPl.tracks?.some(t => t.id === track.id);
                    return (
                      <div key={track.id} className="flex items-center justify-between p-3 bg-[#0a0c0f] hover:bg-[#1a1c23] border border-[#252830] rounded-xl transition">
                        <div className="flex items-center gap-3 overflow-hidden flex-1 mr-4">
                          <div className="w-10 h-10 bg-gray-900 rounded-md overflow-hidden shrink-0">
                            {track.cover ? <img src={track.cover} className="w-full h-full object-cover" /> : <Music size={16} className="m-auto mt-3 text-gray-600" />}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-white text-sm font-bold truncate">{track.title}</h4>
                            <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                          </div>
                        </div>
                        
                        <div 
                          onClick={() => {
                            if (isInPlaylist) {
                              removeTrackFromPlaylist(currentPl.id, track.id);
                            } else {
                              addTrackToPlaylist(currentPl.id, track);
                            }
                          }}
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors shrink-0 ${isInPlaylist ? 'bg-cyan-neon border-cyan-neon' : 'border-gray-600 hover:border-cyan-neon'}`}
                        >
                          {isInPlaylist && <span className="text-black text-lg font-black leading-none mb-1">✓</span>}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              
              <div className="p-4 border-t border-[#252830]">
                <button 
                  onClick={() => setShowManageTracksModal(false)}
                  className="w-full bg-cyan-neon text-black font-bold py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition shadow-lg"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-32 max-w-5xl mx-auto h-full overflow-y-auto">
      <header className="mb-8 pt-2">
        <h2 className="text-3xl font-black text-white tracking-tight">Tu Biblioteca</h2>
        <p className="text-gray-400 mt-2">Sincronizado con {user?.email}</p>
      </header>

      {/* Favoritos Rápidos */}
      <div 
        onClick={() => setActiveTab('favorites')}
        className="w-full flex items-center p-4 bg-gradient-to-r from-cyan-neon/20 to-transparent rounded-2xl mb-8 cursor-pointer hover:scale-[1.02] transition"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-cyan-neon to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-neon/20">
          <Heart size={28} className="text-white" fill="white" />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-xl font-bold text-white">Canciones que te gustan</h3>
          <p className="text-sm text-cyan-neon">{favorites.length} canciones</p>
        </div>
        <ChevronRight className="text-gray-400" />
      </div>

      {/* Carpetas / Playlists */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Tus Carpetas</h3>
        <button 
          onClick={() => setShowNewFolderModal(true)}
          className="p-2 bg-electric-orange text-black rounded-full hover:scale-110 active:scale-95 transition shadow-lg"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {playlists.map(folder => (
          <div key={folder.id} onClick={() => setSelectedPlaylist(folder)} className="bg-[#12141a] p-4 rounded-2xl border border-[#252830] hover:border-electric-orange cursor-pointer transition group">
            <div className="w-full aspect-square bg-[#0a0c0f] rounded-xl mb-3 flex items-center justify-center text-gray-600 group-hover:text-electric-orange transition overflow-hidden">
              {folder.tracks?.length > 0 && folder.tracks[0].cover ? (
                 <img src={folder.tracks[0].cover} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                 <Folder size={40} />
              )}
            </div>
            <h4 className="text-white font-bold truncate">{folder.name}</h4>
            <p className="text-xs text-gray-400">{folder.tracks?.length || 0} pistas</p>
          </div>
        ))}
        {playlists.length === 0 && (
          <div className="col-span-2 text-gray-500 text-sm">
            No has creado ninguna carpeta aún.
          </div>
        )}
      </div>

      {/* Modal Nueva Carpeta */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#12141a] border border-[#252830] p-6 rounded-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-4">Crear Carpeta</h3>
            <input 
              type="text" 
              placeholder="Ej: Salsa, Rock, Electrónica..." 
              className="w-full bg-[#0a0c0f] text-white border border-[#252830] rounded-xl p-3 mb-6 focus:outline-none focus:border-cyan-neon"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-cyan-neon text-black font-bold rounded-xl hover:scale-105 active:scale-95 transition"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

