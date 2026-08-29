import React, { useState } from 'react';
import { Play, Music, Loader2, Folder, Heart } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { useAuthStore } from '../../store/authStore';

// Datos curados para deportes (Mocks) - Imágenes contextuales restauradas
const mockSections = [
  {
    title: "Entrenamiento Running",
    items: [
      { id: '1', title: "Power Running 160 BPM", subtitle: "Grow Studio", cover: "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=300", query: "160 bpm workout music" },
      { id: '2', title: "Maratón 42K Focus", subtitle: "Grow Studio", cover: "https://images.unsplash.com/photo-1552674605-15c2145e9ca0?w=300", query: "marathon running motivation music" },
      { id: '3', title: "Trote Ligero Pop", subtitle: "Mix", cover: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=300", query: "pop running mix" }
    ]
  },
  {
    title: "Rutas Ciclistas",
    items: [
      { id: '4', title: "Cadencia 90 RPM", subtitle: "Electro Mix", cover: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300", query: "90 rpm cycling music" },
      { id: '5', title: "Montaña y Rock", subtitle: "Clásicos", cover: "https://images.unsplash.com/photo-1544158546-b3370607ce61?w=300", query: "classic rock workout" },
      { id: '6', title: "Sprint Final", subtitle: "Alta intensidad", cover: "https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?w=300", query: "sprint high intensity music" }
    ]
  },
  {
    title: "Enfriamiento & Yoga",
    items: [
      { id: '7', title: "Estiramiento Profundo", subtitle: "Ambient", cover: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300", query: "deep stretching ambient" },
      { id: '8', title: "Respiración", subtitle: "Sonidos de la Naturaleza", cover: "https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?w=300", query: "nature sounds breathing" }
    ]
  }
];

export default function HomeView({ setActiveTab }) {
  const { playTrack, favorites } = usePlayerStore();
  const { user, playlists } = useAuthStore();
  const [loadingId, setLoadingId] = useState(null);

  const handlePlayMock = async (item) => {
    try {
      setLoadingId(item.id);
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/search?query=${encodeURIComponent(item.query)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const topResult = data[0];
        playTrack({
          id: topResult.videoId,
          title: topResult.title,
          artist: topResult.author?.name || item.subtitle,
          cover: item.cover,
          streamUrl: `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/stream-yt?videoId=${topResult.videoId}`,
          videoId: topResult.videoId
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const handlePlayFolder = (tracksArray) => {
    if (tracksArray && tracksArray.length > 0) {
      playTrack(tracksArray[0], tracksArray);
    } else {
      alert("Esta lista está vacía. Añade canciones para reproducir.");
    }
  };

  // Determinar si hay contenido para mostrar en la fila superior
  const hasFavorites = favorites && favorites.length > 0;
  const hasPlaylists = playlists && playlists.length > 0;
  const showTopSection = hasFavorites || hasPlaylists;

  return (
    <div className="p-4 md:p-8 pb-32 max-w-5xl mx-auto h-full overflow-y-auto">
      {/* Cabecera (Header) */}
      <header className="flex justify-between items-center mb-8 pt-2">
        <div className="flex items-center">
          <img src="/assets/GrowPlayLogo.png" alt="Grow Play" className="w-32 md:w-40 object-contain drop-shadow-[0_0_10px_rgba(0,229,255,0.1)]" />
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveTab('settings')} className="w-10 h-10 rounded-full border border-[#252830] overflow-hidden hover:scale-105 transition shadow-lg bg-[#12141a]">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Perfil" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
            ) : (
              <div className="w-full h-full bg-cyan-neon flex items-center justify-center text-black font-bold">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            )}
          </button>
        </div>
      </header>

      <div className="space-y-10 mt-2">
        
        {/* SECCIÓN PRINCIPAL: FAVORITOS Y TUS CARPETAS */}
        {showTopSection && (
          <section>
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-2xl font-black text-white tracking-tight">Favoritos</h3>
              <button onClick={() => setActiveTab('library')} className="text-sm text-cyan-neon font-bold hover:underline">Ver todas</button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
              
              {/* Tarjeta de Canciones que te gustan (Solo si hay) */}
              {hasFavorites && (
                <div 
                  onClick={() => handlePlayFolder(favorites)}
                  className="min-w-[140px] md:min-w-[180px] group cursor-pointer snap-start relative"
                >
                  <div className="w-full aspect-square bg-gradient-to-br from-cyan-neon to-blue-500 rounded-2xl mb-3 overflow-hidden relative shadow-[0_0_15px_rgba(0,229,255,0.2)] border border-[#252830] group-hover:border-white transition-colors flex flex-col items-center justify-center">
                    <Heart size={48} className="text-white mb-2" fill="white" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                       <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                         <Play fill="currentColor" className="ml-1" />
                       </div>
                    </div>
                  </div>
                  <h4 className="text-white font-bold truncate text-sm md:text-base">Me Gusta</h4>
                  <p className="text-xs text-gray-400 mt-1">{favorites.length} canciones</p>
                </div>
              )}

              {/* Carpetas del Usuario */}
              {playlists && playlists.map((folder) => {
                const hasTracks = folder.tracks && folder.tracks.length > 0;
                const cover = hasTracks ? folder.tracks[0].cover : null;
                
                return (
                  <div 
                    key={folder.id} 
                    onClick={() => handlePlayFolder(folder.tracks)}
                    className="min-w-[140px] md:min-w-[180px] group cursor-pointer snap-start relative"
                  >
                    <div className="w-full aspect-square bg-[#12141a] rounded-2xl mb-3 overflow-hidden relative shadow-lg border border-[#252830] group-hover:border-cyan-neon transition-colors">
                      {cover ? (
                        <img 
                          src={cover} 
                          alt="Cover" 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      
                      {/* Fallback Icon si no hay imagen o falla */}
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 bg-[#0a0c0f]" style={{ display: cover ? 'none' : 'flex' }}>
                        <Folder size={40} className="mb-2" />
                        <span className="text-xs font-medium">Vacía</span>
                      </div>

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <div className="w-12 h-12 bg-cyan-neon text-black rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                           <Play fill="currentColor" className="ml-1" />
                         </div>
                      </div>
                    </div>
                    <h4 className="text-white font-bold truncate text-sm md:text-base">{folder.name}</h4>
                    <p className="text-xs text-gray-400 mt-1">{folder.tracks?.length || 0} canciones</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECCIONES DE DESCUBRIMIENTO (MOCKS) */}
        {mockSections.map((section, idx) => (
          <section key={idx}>
            <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{section.title}</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
              {section.items.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => handlePlayMock(item)}
                  className="min-w-[140px] md:min-w-[180px] group cursor-pointer snap-start relative"
                >
                  <div className="w-full aspect-square bg-[#12141a] rounded-2xl mb-3 overflow-hidden relative shadow-lg border border-[#252830] group-hover:border-electric-orange transition-colors">
                    
                    <img 
                      src={item.cover} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    
                    {/* Fallback Icon de Música */}
                    <div className="w-full h-full hidden items-center justify-center bg-[#0a0c0f]">
                       <Music size={40} className="text-gray-600" />
                    </div>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      {loadingId === item.id ? (
                        <Loader2 className="animate-spin text-electric-orange" size={32} />
                      ) : (
                        <div className="w-12 h-12 bg-electric-orange text-black rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                          <Play fill="currentColor" className="ml-1" />
                        </div>
                      )}
                    </div>
                  </div>
                  <h4 className="text-white font-bold truncate text-sm md:text-base">{item.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

      </div>
    </div>
  );
}

