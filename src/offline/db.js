// offline/db.js
// Lokale IndexedDB-Datenbank (Dexie) für den Offline-First-Betrieb.
import Dexie from "dexie";

export const db = new Dexie("baudoc_offline");

// Nur Felder, nach denen gesucht wird, gehören ins Schema (Primärschlüssel zuerst).
// Wichtig: "synced" (boolean) wird bewusst NICHT indiziert. Booleans sind in IndexedDB
// keine gültigen Schlüssel, where("synced").equals(true) würde nie etwas finden.
// Nicht synchronisierte Pins werden daher per .filter() geladen (siehe pinsRepository.js).
db.version(1).stores({
  pins: "id, project_id, floor_id, updated_at, [project_id+floor_id]",
});

// Pin-Satz, wie er lokal abgelegt wird:
// {
//   id,                 // UUID, clientseitig erzeugt (crypto.randomUUID)
//   project_id, floor_id,
//   x, y,               // Position auf dem Plan (Prozent)
//   description, gewerk, status,
//   local_image_blob,   // Blob | null, Foto, solange es noch nicht hochgeladen ist
//   image_url,          // string | null, öffentliche URL aus Supabase Storage
//   image_dirty,        // boolean, Erweiterung: Foto wurde lokal neu gesetzt und muss hochgeladen werden
//   synced,             // boolean
//   updated_at,         // ISO-String
// }

// Bittet den Browser, die Daten nicht automatisch zu verwerfen (Speicherdruck, Safari-Eviction).
// Für Offline-First-Daten, die noch nicht auf dem Server liegen, sinnvoll.
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      return await navigator.storage.persist();
    }
  } catch {
    // nicht kritisch
  }
  return false;
}
