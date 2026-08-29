import React, { useState, useEffect } from 'react';
import { Play, Pause, Music, Trash2, FolderDown } from 'lucide-react';
import { getOfflineTracks, deleteTrackOffline } from '../../services/db';
import { usePlayerStore } from '../../store/playerStore';

export default function LocalView() {
  const [offlineTracks, setOfflineTracks] = useState([]);
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();

  const loadTracks = async () => {
    const tracks = await getOfflineTracks();
    setOfflineTracks(tracks.reverse());
  };

  useEffect(() => {
    loadTracks();
  }, []);

  const handlePlay = (track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, offlineTracks);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if(window.confirm('¿Eliminar esta canción permanentemente de las descargas offline?')) {
      await deleteTrackOffline(id);
      loadTracks();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto h-full overflow-y-auto">
      <header className="flex justify-between items-center mb-8 pt-4 md:mt-0">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
          Música Local
        </h2>
        <span className="text-xs font-bold text-cyan-neon border border-cyan-neon px-3 py-1 rounded-full shadow-[0_0_10px_rgba(0,229,255,0.2)]">
          SIN CONEXIÓN
        </span>
      </header>

      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
           <FolderDown className="text-cyan-neon" size={24} />
           <p className="text-gray-400 text-sm">Canciones guardadas físicamente en tu dispositivo.</p>
        </div>
        
        {offlineTracks.length === 0 ? (
           <div className="bg-[#12141a] border border-[#252830] rounded-xl p-10 text-center shadow-lg">
             <FolderDown size={48} className="mx-auto text-gray-600 mb-4" />
             <p className="text-gray-400 font-bold text-lg">Tu disco duro está vacío.</p>
             <p className="text-sm text-gray-500 mt-2">Ve a "Buscar" para descargar música y escucharla sin WiFi.</p>
           </div>
        ) : (
          <div className="flex flex-col gap-3">
            {offlineTracks.map((track) => {
              const isThisPlaying = currentTrack?.id === track.id && isPlaying;
              
              return (
                <div 
                  key={track.id}
                  onClick={() => handlePlay(track)}
                  className={`flex items-center justify-between bg-[#12141a] p-3 rounded-xl cursor-pointer transition border shadow-md
                    ${currentTrack?.id === track.id ? 'border-electric-orange bg-[#1a1c23]' : 'border-[#252830] hover:bg-[#1a1d26]'}`}
                >
                  <div className="flex items-center gap-4 w-3/4">
                    <div className="w-14 h-14 bg-gray-800 rounded-lg overflow-hidden relative shrink-0 shadow-md">
                      {track.cover ? (
                         <img src={track.cover} alt="cover" className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center"><Music size={20} className="text-gray-500"/></div>
                      )}
                      
                      <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity
                        ${isThisPlaying ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
                        {isThisPlaying ? (
                           <Pause size={24} className="text-electric-orange" fill="currentColor" />
                        ) : (
                           <Play size={24} className="text-white ml-1" fill="currentColor" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 truncate">
                      <h4 className={`text-base font-bold truncate ${currentTrack?.id === track.id ? 'text-electric-orange' : 'text-white'}`}>
                        {track.title}
                      </h4>
                      <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => handleDelete(e, track.id)}
                    className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition shrink-0 z-10"
                    title="Eliminar descarga"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
