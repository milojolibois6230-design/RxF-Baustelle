// offline/syncEngine.js
// Verdrahtung: Dexie-DB + Supabase-Client -> Sync-Engine (Singleton).
// Passe den Import des Supabase-Clients an dein Projekt an
// (z. B. src/lib/supabaseClient.js mit: export const supabase = createClient(url, anonKey)).
import { supabase } from "../lib/supabaseClient";
import { db } from "./db";
import { createSyncEngine } from "./syncService";

export const syncEngine = createSyncEngine({
  supabase,
  db,
  table: "pins",
  bucket: "pin-photos",
});
