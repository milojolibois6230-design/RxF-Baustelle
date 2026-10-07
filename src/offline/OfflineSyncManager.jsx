// offline/OfflineSyncManager.jsx
import { useOfflinePins } from "./useOfflinePins";
import { useAutoSync } from "./useAutoSync";

// Einmal im App-Root rendern: <OfflineSyncManager />
// Startet den Auto-Sync und zeigt einen kleinen Statuschip (Tailwind).
export default function OfflineSyncManager({ showBadge = true }) {
  useAutoSync();
  const { isOnline, isSyncing, pendingCount, lastResult, syncWithSupabase } = useOfflinePins();

  if (!showBadge) return null;

  let label;
  let tone;
  if (!isOnline) {
    label = pendingCount > 0 ? `Offline, ${pendingCount} ausstehend` : "Offline";
    tone = "bg-amber-100 text-amber-800";
  } else if (isSyncing) {
    label = "Synchronisiere ...";
    tone = "bg-sky-100 text-sky-800";
  } else if (pendingCount > 0) {
    label = lastResult?.failed ? `${pendingCount} nicht übertragen, erneut versuchen` : `${pendingCount} ausstehend`;
    tone = "bg-rose-100 text-rose-800";
  } else {
    label = "Synchronisiert";
    tone = "bg-emerald-100 text-emerald-800";
  }

  return (
    <button
      type="button"
      onClick={syncWithSupabase}
      disabled={!isOnline || isSyncing}
      className={`fixed bottom-3 right-3 z-50 rounded-full px-3 py-1 text-xs font-medium shadow ${tone}`}
    >
      {label}
    </button>
  );
}
