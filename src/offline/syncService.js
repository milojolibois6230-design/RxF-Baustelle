// offline/syncService.js
// Sync-Engine ohne React-Abhängigkeit: lokale, nicht synchronisierte Pins -> Supabase.
// Der Supabase-Client wird von außen übergeben (siehe offline/index.js).

const DEFAULTS = {
  table: "pins",
  bucket: "pin-photos",
  isOnline: () => (typeof navigator === "undefined" ? true : navigator.onLine),
};

// Spaltenzuordnung lokal -> Supabase an EINER Stelle. Das Zielschema ggf. hier anpassen.
// Lokale Hilfsfelder (local_image_blob, image_dirty, synced) gehen nie zum Server.
export function toRemoteRow(pin) {
  return {
    id: pin.id,
    project_id: pin.project_id,
    floor_id: pin.floor_id,
    x: pin.x,
    y: pin.y,
    description: pin.description,
    gewerk: pin.gewerk,
    status: pin.status,
    image_url: pin.image_url,
    updated_at: pin.updated_at,
  };
}

const EXT_BY_MIME = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic" };

function isNetworkError(err) {
  return err instanceof TypeError || /failed to fetch|network|load failed/i.test(err?.message ?? "");
}

export function createSyncEngine({ supabase, db, ...options }) {
  const cfg = { ...DEFAULTS, ...options };

  let runningPromise = null;
  let state = { isSyncing: false, lastResult: null };
  const listeners = new Set();

  const setState = (patch) => {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  };

  // Für useSyncExternalStore
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const getSnapshot = () => state;

  async function uploadPhoto(pin) {
    const blob = pin.local_image_blob;
    const ext = EXT_BY_MIME[blob.type] ?? "jpg";
    // Deterministischer Pfad + upsert: ein Wiederholungsversuch nach Abbruch erzeugt
    // keine verwaisten Dateien.
    const path = `${pin.id}/${pin.id}.${ext}`;
    const { error } = await supabase.storage.from(cfg.bucket).upload(path, blob, {
      upsert: true,
      contentType: blob.type || "image/jpeg",
      cacheControl: "3600",
    });
    if (error) throw error;
    return supabase.storage.from(cfg.bucket).getPublicUrl(path).data.publicUrl;
  }

  async function syncOne(pin) {
    let imageUrl = pin.image_url ?? null;

    // b) Foto hochladen und URL setzen
    if (pin.local_image_blob && pin.image_dirty) {
      imageUrl = await uploadPhoto(pin);
    }

    // c) Pin per upsert in die Tabelle schreiben
    const { error } = await supabase
      .from(cfg.table)
      .upsert(toRemoteRow({ ...pin, image_url: imageUrl }), { onConflict: "id" });
    if (error) throw error;

    // d) Lokal auf synced: true setzen, aber nur, wenn der Pin während des Syncs nicht
    // erneut geändert wurde. Sonst bleibt er unsynchronisiert und kommt im nächsten Lauf dran.
    return db.transaction("rw", db.pins, async () => {
      const current = await db.pins.get(pin.id);
      if (!current) return false;
      if (current.updated_at !== pin.updated_at) {
        await db.pins.update(pin.id, { image_url: imageUrl });
        return false;
      }
      await db.pins.update(pin.id, { image_url: imageUrl, image_dirty: false, synced: true });
      return true;
    });
  }

  async function run() {
    setState({ isSyncing: true });
    const result = { synced: 0, failed: 0, errors: [], aborted: null };
    try {
      // a) Alle nicht synchronisierten Pins laden (älteste Änderung zuerst)
      const pending = (await db.pins.filter((p) => !p.synced).toArray()).sort((a, b) =>
        a.updated_at.localeCompare(b.updated_at)
      );

      // Bewusst nacheinander: schont mobile Verbindungen, Fehler bleiben pro Pin isoliert.
      for (const pin of pending) {
        try {
          if (await syncOne(pin)) result.synced += 1;
        } catch (err) {
          result.failed += 1;
          result.errors.push({ id: pin.id, message: err?.message ?? String(err) });
          if (isNetworkError(err)) {
            // Verbindung weg: restliche Pins gar nicht erst versuchen.
            result.aborted = "network";
            break;
          }
        }
      }
    } finally {
      setState({ isSyncing: false, lastResult: { ...result, at: new Date().toISOString() } });
    }
    return result;
  }

  // Parallele Aufrufe (online-Event, Sichtbarkeitswechsel, manueller Button) teilen sich einen Lauf.
  function syncWithSupabase() {
    if (!cfg.isOnline()) return Promise.resolve({ synced: 0, failed: 0, errors: [], aborted: "offline" });
    if (!runningPromise) {
      runningPromise = run().finally(() => {
        runningPromise = null;
      });
    }
    return runningPromise;
  }

  return { syncWithSupabase, subscribe, getSnapshot };
}
