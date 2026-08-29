import React from 'react';
import { Play, Pause, Music, Heart, ChevronLeft } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';

export default function FavoritesView({ setActiveTab }) {
  const { favorites, toggleFavorite, currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();

  const handlePlay = (track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, favorites);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto h-full overflow-y-auto">
      <header className="flex items-center gap-4 mb-8 pt-4 md:mt-0">
        <button 
           onClick={() => setActiveTab('library')}
           className="p-2 -ml-2 text-white hover:text-cyan-neon transition rounded-full"
        >
           <ChevronLeft size={32} />
        </button>
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          Tus Favoritos
        </h2>
      </header>

      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
           <Heart className="text-cyan-neon" size={24} fill="currentColor" />
           <p className="text-gray-400 text-sm">Canciones que te han encantado.</p>
        </div>
        
        {favorites.length === 0 ? (
           <div className="bg-[#12141a] border border-[#252830] rounded-xl p-10 text-center shadow-lg">
             <Heart size={48} className="mx-auto text-gray-600 mb-4" />
             <p className="text-gray-400 font-bold text-lg">Aún no tienes favoritos.</p>
             <p className="text-sm text-gray-500 mt-2">Dale al corazón en el reproductor para guardarlas aquí.</p>
           </div>
        ) : (
          <div className="flex flex-col gap-3">
            {favorites.map((track) => {
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
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(track); }}
                    className="p-3 text-cyan-neon hover:text-white rounded-full transition shrink-0 z-10"
                    title="Quitar de favoritos"
                  >
                    <Heart size={24} fill="currentColor" />
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
