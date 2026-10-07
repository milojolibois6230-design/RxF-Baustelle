// offline/useNetworkStatus.js
import { useSyncExternalStore } from "react";

function subscribe(callback) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

// navigator.onLine meldet "true", sobald irgendein Netz verbunden ist (auch ohne Internet).
// Deshalb ist es nur ein Hinweis: ob der Sync wirklich durchgeht, zeigt erst der Request.
export function useNetworkStatus() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}
