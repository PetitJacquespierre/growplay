import { create } from 'zustand';

export const usePlayerStore = create((set) => ({
  currentTrack: null,
  isPlaying: false,
  isExpanded: false,
  queue: [],
  favorites: JSON.parse(localStorage.getItem('growplay_favorites')) || [],
  
  setIsExpanded: (expanded) => set({ isExpanded: expanded }),
  
  toggleFavorite: (track) => set((state) => {
    const isFav = state.favorites.some(t => t.id === track.id);
    let newFavs;
    if (isFav) {
      newFavs = state.favorites.filter(t => t.id !== track.id);
    } else {
      // Guardar información esencial para reproducirla desde favoritos luego
      const trackToSave = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        cover: track.cover,
        streamUrl: track.streamUrl, // Si era stream en vivo
      };
      newFavs = [...state.favorites, trackToSave];
    }
    localStorage.setItem('growplay_favorites', JSON.stringify(newFavs));
    return { favorites: newFavs };
  }),

  // Iniciar reproducción de una canción (y opcionalmente cargar la cola entera)
  playTrack: (track, queue = []) => set({ 
      currentTrack: track, 
      isPlaying: true, 
      queue: queue.length > 0 ? queue : [track] 
  }),
  
  // Alternar play/pausa
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  // Forzar estado de reproducción (usado por eventos del <audio>)
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  
  // Estados de opciones Pro
  intervalMode: false,
  toggleIntervalMode: () => set(state => ({ intervalMode: !state.intervalMode })),

  // Siguiente canción (¡Con Radio Infinita Inteligente!)
  playNext: async () => {
     const state = usePlayerStore.getState();
     if (!state.currentTrack) return;

     const currentIndex = state.queue.findIndex(t => t.id === state.currentTrack.id);
     
     // 1. Si hay más canciones en la cola (playlist), reproducir la siguiente normalmente
     if (currentIndex >= 0 && currentIndex < state.queue.length - 1) {
         set({ currentTrack: state.queue[currentIndex + 1], isPlaying: true });
         return;
     }
     
     // 2. MAGIA: RADIO INFINITA
     // Si estamos al final de la cola o reprodujimos una canción suelta, buscamos similares.
     try {
       // Le pedimos al buscador algo similar al artista/título actual
       const searchQuery = `${state.currentTrack.artist || ''} mix exitos similares`;
       const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/search?query=${encodeURIComponent(searchQuery)}`);
       const searchData = await res.json();
       
       if (searchData && searchData.length > 0) {
         // Agarramos el primer resultado que NO sea la canción que acaba de sonar
         const nextResult = searchData.find(v => v.videoId !== state.currentTrack.videoId && v.videoId !== state.currentTrack.id) || searchData[1] || searchData[0];
         
         const nextTrack = {
           id: nextResult.videoId,
           title: nextResult.title,
           artist: nextResult.author?.name || state.currentTrack.artist,
           cover: nextResult.thumbnail || nextResult.image || `https://i.ytimg.com/vi/${nextResult.videoId}/hqdefault.jpg`,
           streamUrl: `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/stream-yt?videoId=${nextResult.videoId}`,
           videoId: nextResult.videoId
         };
         
         set({ 
           queue: [...state.queue, nextTrack], // La añadimos a la cola para poder retroceder
           currentTrack: nextTrack,
           isPlaying: true
         });
         return; // Éxito
       }
     } catch (error) {
       console.error("Error en Radio Infinita:", error);
     }

     // 3. Fallback si no hay internet o falla la búsqueda (volvemos a la primera)
     if (state.queue.length > 1) {
         set({ currentTrack: state.queue[0], isPlaying: true });
     }
  },
  
  // Canción anterior
  playPrev: () => set((state) => {
     if (!state.currentTrack || state.queue.length === 0) return state;
     const currentIndex = state.queue.findIndex(t => t.id === state.currentTrack.id);
     if (currentIndex > 0) {
         return { currentTrack: state.queue[currentIndex - 1], isPlaying: true };
     }
     return state;
  })
}));

