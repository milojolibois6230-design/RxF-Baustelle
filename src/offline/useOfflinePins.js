// offline/useOfflinePins.js
import { useCallback, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { savePinLocal, getPinsLocal, countUnsyncedPins } from "./pinsRepository";
import { syncEngine } from "./syncEngine";
import { useNetworkStatus } from "./useNetworkStatus";

// Liest Pins immer aus Dexie (reaktiv) und schreibt immer zuerst lokal.
// Optionen: { projectId, floorId, syncOnSave = true }
export function useOfflinePins({ projectId, floorId, syncOnSave = true } = {}) {
  const isOnline = useNetworkStatus();
  const { isSyncing, lastResult } = useSyncExternalStore(syncEngine.subscribe, syncEngine.getSnapshot);

  const pins = useLiveQuery(() => getPinsLocal({ projectId, floorId }), [projectId, floorId], []);
  const pendingCount = useLiveQuery(() => countUnsyncedPins(), [], 0);

  const syncWithSupabase = useCallback(() => syncEngine.syncWithSupabase(), []);

  // 1. lokal speichern (synced: false), 2. falls online, sofort im Hintergrund versuchen.
  const savePin = useCallback(
    async (input) => {
      const pin = await savePinLocal(input);
      if (syncOnSave && navigator.onLine) void syncEngine.syncWithSupabase();
      return pin;
    },
    [syncOnSave]
  );

  return { pins, pendingCount, isOnline, isSyncing, lastResult, savePin, syncWithSupabase };
}
