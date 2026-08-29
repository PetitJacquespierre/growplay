import { openDB } from 'idb';

const DB_NAME = 'GrowPlayOfflineDB';
const STORE_NAME = 'tracks';

// Iniciar o actualizar la base de datos interna del navegador
export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // La llave primaria será el ID del video/canción
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

// Guardar una canción FÍSICAMENTE en el disco (El Blob es el archivo MP3/WebM)
export async function saveTrackOffline(trackInfo, audioBlob) {
  const db = await initDB();
  await db.put(STORE_NAME, {
    id: trackInfo.id,
    title: trackInfo.title,
    artist: trackInfo.artist,
    cover: trackInfo.cover,
    audioData: audioBlob, // ¡Este es el archivo de música real!
    downloadedAt: Date.now()
  });
  console.log(`[Offline Engine] Canción guardada con éxito: ${trackInfo.title}`);
}

// Recuperar todas las canciones descargadas (Para cuando no hay internet)
export async function getOfflineTracks() {
  const db = await initDB();
  return await db.getAll(STORE_NAME);
}

// Eliminar una canción para liberar espacio en el teléfono
export async function deleteTrackOffline(id) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}
