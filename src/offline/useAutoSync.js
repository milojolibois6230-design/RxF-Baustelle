// offline/useAutoSync.js
import { useEffect } from "react";
import { syncEngine } from "./syncEngine";
import { requestPersistentStorage } from "./db";

// Einmal im App-Root einbinden. Startet den Sync beim Laden, beim 'online'-Event und
// wenn die PWA wieder in den Vordergrund kommt (iOS feuert 'online' nicht zuverlässig).
export function useAutoSync() {
  useEffect(() => {
    const trigger = () => void syncEngine.syncWithSupabase();
    const onVisible = () => {
      if (document.visibilityState === "visible") trigger();
    };

    requestPersistentStorage();
    trigger();

    window.addEventListener("online", trigger);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", trigger);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
