/**
 * TuroTugma — Real-Time XAMPP MySQL & Multi-Device LAN Synchronization Engine
 *
 * Bridges `window.localStorage` with `http://<host-ip>/SchedulingSystem/api/sync.php`
 * so all browsers (Chrome, Edge, Firefox) and all devices on the same Wi-Fi/LAN
 * share the exact same live database automatically.
 */

const EXCLUDED_LOCAL_ONLY_KEYS = new Set([
  "turotugma_sidebar_collapsed",
  "turotugma_admin_session",
]);

function isSyncableKey(key) {
  if (!key || typeof key !== "string") return false;
  if (EXCLUDED_LOCAL_ONLY_KEYS.has(key)) return false;
  return key.startsWith("turotugma_");
}

function getApiEndpoint() {
  if (typeof window === "undefined") {
    return "http://localhost/SchedulingSystem/api/sync.php";
  }
  const host = window.location.hostname || "localhost";
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${host}/SchedulingSystem/api/sync.php`;
}

const CLIENT_ID = `client-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

let latestKnownVersion = 0;
let isApplyingRemoteUpdate = false;
let syncState = {
  connected: false,
  engine: "offline",
  version: 0,
  lastSyncedAt: null,
  apiUrl: "",
};

const syncListeners = new Set();

export function getXamppSyncStatus() {
  return syncState;
}

export function subscribeXamppSyncStatus(listener) {
  syncListeners.add(listener);
  listener(syncState);
  return () => syncListeners.delete(listener);
}

function updateSyncStatus(partial) {
  syncState = { ...syncState, ...partial };
  syncListeners.forEach((fn) => {
    try {
      fn(syncState);
    } catch (e) {}
  });
}

function dispatchSyncEventsForChangedKeys(changedKeys = []) {
  if (typeof window === "undefined" || changedKeys.length === 0) return;

  try {
    changedKeys.forEach((key) => {
      try {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key,
            newValue: window.localStorage.getItem(key),
          })
        );
      } catch (e) {
        window.dispatchEvent(new Event("storage"));
      }
    });

    if (changedKeys.includes("turotugma_school_profile")) {
      window.dispatchEvent(new Event("turotugma:profile-updated"));
    }
    if (changedKeys.includes("turotugma_schedule_configurations")) {
      window.dispatchEvent(new Event("turotugma:config-updated"));
    }
    if (
      changedKeys.includes("turotugma_faculty") ||
      changedKeys.includes("turotugma_schedule_unavailable_periods")
    ) {
      window.dispatchEvent(new Event("turotugma:faculty-updated"));
      window.dispatchEvent(new Event("turotugma_faculty_updated"));
    }
    if (changedKeys.includes("turotugma_subjects")) {
      try {
        const parsed = JSON.parse(window.localStorage.getItem("turotugma_subjects") || "[]");
        window.dispatchEvent(new CustomEvent("turotugma_subjects_updated", { detail: parsed }));
      } catch (e) {}
    }
    if (
      changedKeys.includes("turotugma_sections_created") ||
      changedKeys.includes("turotugma_naming_schemes")
    ) {
      window.dispatchEvent(new Event("turotugma:sections-updated"));
    }
    if (
      changedKeys.includes("turotugma_schedule_drafts") ||
      changedKeys.includes("turotugma_published_schedules")
    ) {
      window.dispatchEvent(new Event("turotugma:schedule-updated"));
    }

    window.dispatchEvent(
      new CustomEvent("turotugma:xampp-remote-update", { detail: { changedKeys } })
    );
  } catch (e) {}
}

/**
 * Initializes the XAMPP MySQL synchronization bridge before React mounts.
 */
export async function initXamppSync() {
  if (typeof window === "undefined") return;

  const apiUrl = getApiEndpoint();
  updateSyncStatus({ apiUrl });

  const nativeSetItem = window.Storage.prototype.setItem;
  const nativeRemoveItem = window.Storage.prototype.removeItem;
  const rawSetLocalItem = (k, v) => nativeSetItem.call(window.localStorage, k, v);
  const pendingTimers = new Map();

  const pushKeyToServer = async (key, value) => {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert",
          key,
          value,
          clientId: CLIENT_ID,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.ok) {
        if (data.version && data.version > latestKnownVersion) {
          latestKnownVersion = data.version;
        }
        updateSyncStatus({
          connected: true,
          engine: data.engine || "mysql",
          version: latestKnownVersion,
          lastSyncedAt: new Date(),
        });
      }
    } catch (err) {
      updateSyncStatus({ connected: false, engine: "offline" });
    }
  };

  const removeKeyFromServer = async (key) => {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          key,
          clientId: CLIENT_ID,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.version > latestKnownVersion) {
          latestKnownVersion = data.version;
        }
        updateSyncStatus({
          connected: true,
          engine: data?.engine || "mysql",
          version: latestKnownVersion,
          lastSyncedAt: new Date(),
        });
      }
    } catch (err) {
      updateSyncStatus({ connected: false, engine: "offline" });
    }
  };

  // 1. Intercept localStorage writes so every change automatically pushes to XAMPP MySQL
  window.Storage.prototype.setItem = function (key, value) {
    const isLocalStorage = this === window.localStorage;
    const previousValue = isLocalStorage ? window.localStorage.getItem(key) : null;
    nativeSetItem.call(this, key, value);

    if (isLocalStorage && !isApplyingRemoteUpdate && isSyncableKey(key) && previousValue !== String(value)) {
      if (pendingTimers.has(key)) {
        clearTimeout(pendingTimers.get(key));
      }
      const timer = setTimeout(() => {
        pendingTimers.delete(key);
        pushKeyToServer(key, String(value));
      }, 80);
      pendingTimers.set(key, timer);
    }
  };

  window.Storage.prototype.removeItem = function (key) {
    const isLocalStorage = this === window.localStorage;
    nativeRemoveItem.call(this, key);
    if (isLocalStorage && !isApplyingRemoteUpdate && isSyncableKey(key)) {
      removeKeyFromServer(key);
    }
  };

  // 2. Perform initial pull / seed with a fast 1.8s timeout so app boot is never blocked
  const pullAndReconcile = async (isInitialBoot = false) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), isInitialBoot ? 1800 : 3500);

    try {
      const res = await fetch(`${apiUrl}?action=all&_t=${Date.now()}`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data || !data.ok) return;

      const remoteItems = data.items && typeof data.items === "object" ? data.items : {};
      const remoteKeys = Object.keys(remoteItems);

      // Collect current local browser's syncable keys
      const localItems = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (isSyncableKey(k)) {
          localItems[k] = window.localStorage.getItem(k);
        }
      }
      const localKeys = Object.keys(localItems);

      // Case A: XAMPP Database has records -> apply remote records into this browser
      const changedKeys = [];
      if (remoteKeys.length > 0) {
        isApplyingRemoteUpdate = true;
        try {
          remoteKeys.forEach((k) => {
            if (!isSyncableKey(k)) return;
            const remoteVal = remoteItems[k]?.value;
            if (typeof remoteVal === "string") {
              const currentLocalVal = window.localStorage.getItem(k);
              if (currentLocalVal !== remoteVal) {
                rawSetLocalItem(k, remoteVal);
                changedKeys.push(k);
              }
            }
          });
        } finally {
          isApplyingRemoteUpdate = false;
        }

        // If this browser has additional keys that don't exist on the server yet, push only those missing keys
        if (isInitialBoot) {
          const missingOnServer = {};
          localKeys.forEach((k) => {
            if (!Object.prototype.hasOwnProperty.call(remoteItems, k) && localItems[k]) {
              missingOnServer[k] = localItems[k];
            }
          });
          if (Object.keys(missingOnServer).length > 0) {
            await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "bulk_upsert",
                clientId: CLIENT_ID,
                items: missingOnServer,
              }),
            });
          }
        }
      } else if (isInitialBoot && localKeys.length > 0) {
        // Case B: XAMPP Database is empty, and this browser already has data -> Seed XAMPP MySQL with this browser's data!
        await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "bulk_upsert",
            clientId: CLIENT_ID,
            items: localItems,
          }),
        });
      }

      if (data.version && data.version > latestKnownVersion) {
        latestKnownVersion = data.version;
      }

      updateSyncStatus({
        connected: true,
        engine: data.engine || "mysql",
        version: latestKnownVersion,
        lastSyncedAt: new Date(),
      });

      if (!isInitialBoot && changedKeys.length > 0) {
        dispatchSyncEventsForChangedKeys(changedKeys);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      updateSyncStatus({ connected: false, engine: "offline" });
    }
  };

  await pullAndReconcile(true);

  // 3. Background polling every 2.5 seconds + on window focus for live multi-browser / multi-device updates
  const checkRemoteVersion = async () => {
    if (pendingTimers.size > 0) return; // Wait until local debounced writes finish
    try {
      const res = await fetch(`${apiUrl}?action=meta&_t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const meta = await res.json();
      if (meta && meta.ok) {
        updateSyncStatus({
          connected: true,
          engine: meta.engine || "mysql",
        });
        const remoteVer = Number(meta.version) || 0;
        if (remoteVer > latestKnownVersion || (latestKnownVersion === 0 && Number(meta.keyCount) === 0)) {
          await pullAndReconcile(false);
        }
      }
    } catch (err) {
      updateSyncStatus({ connected: false, engine: "offline" });
    }
  };

  setInterval(checkRemoteVersion, 2500);
  window.addEventListener("focus", checkRemoteVersion);
}

