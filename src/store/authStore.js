import { create } from 'zustand';
import { auth, db } from '../services/firebase';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  arrayUnion, 
  query, 
  orderBy 
} from 'firebase/firestore';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  playlists: [],

  // Inicializar el observador de sesión
  initAuthListener: () => {
    // Procesar resultado de redirección (para móviles)
    getRedirectResult(auth).catch(err => {
      console.error("Error recuperando redirección de sesión:", err);
    });

    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        set({ user: currentUser, loading: false });
        get().fetchPlaylists(currentUser.uid);
      } else {
        set({ user: null, loading: false, playlists: [] });
      }
    });
  },

  // Login con Google
  loginWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Intentar popup primero (ideal para PC)
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.log("Popup cancelado o bloqueado. Intentando redirección...", error.code);
      
      try {
        // Fallback a redirección para navegadores móviles o in-app browsers
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
      } catch (redirectError) {
        console.error("Error en redirección:", redirectError);
        alert("Error: " + redirectError.message + "\n\nSi estás en Vercel, asegúrate de añadir este dominio en Firebase Console -> Authentication -> Settings -> Authorized Domains.");
      }
    }
  },

  // Cerrar Sesión
  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  },

  // --- LÓGICA DE CARPETAS (PLAYLISTS) EN FIRESTORE ---

  fetchPlaylists: async (uid) => {
    try {
      const q = query(collection(db, 'users', uid, 'playlists'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const loadedPlaylists = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      set({ playlists: loadedPlaylists });
    } catch (error) {
      console.error("Error cargando carpetas:", error);
    }
  },

  createPlaylist: async (name) => {
    const { user, playlists } = get();
    if (!user) return;
    try {
      const newPlaylist = {
        name,
        tracks: [],
        createdAt: new Date().getTime()
      };
      const docRef = await addDoc(collection(db, 'users', user.uid, 'playlists'), newPlaylist);
      
      set({ 
        playlists: [{ id: docRef.id, ...newPlaylist }, ...playlists] 
      });
    } catch (error) {
      console.error("Error creando carpeta:", error);
    }
  },

  addTrackToPlaylist: async (playlistId, track) => {
    const { user, playlists } = get();
    if (!user) return;
    try {
      const playlistRef = doc(db, 'users', user.uid, 'playlists', playlistId);
      
      // Guardar info esencial de la pista
      const trackToSave = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        cover: track.cover,
        videoId: track.videoId || track.id
      };

      await updateDoc(playlistRef, {
        tracks: arrayUnion(trackToSave)
      });

      // Actualizar estado local
      set({
        playlists: playlists.map(p => {
          if (p.id === playlistId) {
            return { ...p, tracks: [...p.tracks, trackToSave] };
          }
          return p;
        })
      });
    } catch (error) {
      console.error("Error añadiendo pista:", error);
    }
  },

  removeTrackFromPlaylist: async (playlistId, trackId) => {
    const { user, playlists } = get();
    if (!user) return;
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return;

      const playlistRef = doc(db, 'users', user.uid, 'playlists', playlistId);
      const updatedTracks = playlist.tracks.filter(t => t.id !== trackId);

      await updateDoc(playlistRef, { tracks: updatedTracks });

      // Actualizar estado local
      set({
        playlists: playlists.map(p => {
          if (p.id === playlistId) {
            return { ...p, tracks: updatedTracks };
          }
          return p;
        })
      });
    } catch (error) {
      console.error("Error eliminando pista:", error);
    }
  }
}));
