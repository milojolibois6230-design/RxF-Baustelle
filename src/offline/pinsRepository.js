// offline/pinsRepository.js
// Lokale Schreib-/Lesezugriffe auf Dexie. Schreibt immer zuerst lokal (synced: false).
import { db } from "./db";

const PIN_DEFAULTS = {
  project_id: null,
  floor_id: null,
  x: 0,
  y: 0,
  description: "",
  gewerk: null,
  status: "offen",
  local_image_blob: null,
  image_url: null,
  image_dirty: false,
};

// Neuen Pin anlegen oder bestehenden ändern (Teil-Update möglich, wenn input.id gesetzt ist).
// Wird ein Foto übergeben (input.local_image_blob), wird es als "noch hochzuladen" markiert.
export async function savePinLocal(input) {
  const now = new Date().toISOString();
  const existing = input.id ? await db.pins.get(input.id) : undefined;

  const photoChanged = input.local_image_blob instanceof Blob;

  const pin = {
    ...PIN_DEFAULTS,
    ...existing,
    ...input,
    id: existing?.id ?? input.id ?? crypto.randomUUID(),
    image_dirty: photoChanged ? true : (existing?.image_dirty ?? false),
    synced: false,
    updated_at: now,
  };

  await db.pins.put(pin);
  return pin;
}

export function getPinsLocal({ projectId, floorId } = {}) {
  if (projectId && floorId) return db.pins.where("[project_id+floor_id]").equals([projectId, floorId]).toArray();
  if (projectId) return db.pins.where("project_id").equals(projectId).toArray();
  return db.pins.toArray();
}

export function getUnsyncedPins() {
  return db.pins.filter((p) => !p.synced).toArray();
}

export function countUnsyncedPins() {
  return db.pins.filter((p) => !p.synced).count();
}
