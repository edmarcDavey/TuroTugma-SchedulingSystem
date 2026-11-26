/**
 * TuroTugma — Administrator Authentication & Session Guard
 *
 * Uses per-browser `sessionStorage` so logging in as Admin on one browser/laptop
 * NEVER logs in other browsers or public devices on the same Wi-Fi/XAMPP network.
 */

const ADMIN_SESSION_KEY = "turotugma_admin_session";
const ADMIN_CREDENTIALS_KEY = "turotugma_admin_credentials";

const DEFAULT_ADMIN_ACCOUNTS = [
  {
    employeeId: "EMP001",
    username: "admin",
    password: "admin123",
    name: "System Administrator",
    role: "Administrator",
  },
];

export function verifyAdminCredentials(identifier, password) {
  const cleanId = String(identifier || "").trim().toLowerCase();
  const cleanPass = String(password || "").trim();

  if (!cleanId || !cleanPass) {
    return {
      valid: false,
      error: "Please enter both your Employee ID and Password.",
    };
  }

  let accounts = [...DEFAULT_ADMIN_ACCOUNTS];
  if (typeof window !== "undefined") {
    try {
      const customRaw = window.localStorage.getItem(ADMIN_CREDENTIALS_KEY);
      if (customRaw) {
        const parsed = JSON.parse(customRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          accounts = [...parsed, ...DEFAULT_ADMIN_ACCOUNTS];
        }
      }
    } catch (e) {}
  }

  const matched = accounts.find(
    (acc) =>
      (String(acc.employeeId || "").trim().toLowerCase() === cleanId ||
        String(acc.username || "").trim().toLowerCase() === cleanId) &&
      String(acc.password || "").trim() === cleanPass
  );

  if (!matched) {
    return {
      valid: false,
      error: "Invalid Employee ID or Password. Access denied.",
    };
  }

  return {
    valid: true,
    account: {
      employeeId: matched.employeeId,
      name: matched.name,
      role: matched.role,
    },
  };
}

export function createAdminSession(account) {
  if (typeof window === "undefined") return;
  const sessionPayload = JSON.stringify({
    authenticated: true,
    employeeId: account?.employeeId || "EMP001",
    name: account?.name || "System Administrator",
    role: account?.role || "Administrator",
    loginAt: Date.now(),
  });
  try {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, sessionPayload);
  } catch (e) {}
  try {
    window.localStorage.setItem(ADMIN_SESSION_KEY, sessionPayload);
  } catch (e) {}
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch (e) {}
  try {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch (e) {}
}

export function isAdminAuthenticated() {
  if (typeof window === "undefined") return false;
  try {
    const raw =
      window.sessionStorage.getItem(ADMIN_SESSION_KEY) ||
      window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.authenticated === true && parsed.employeeId);
  } catch {
    return false;
  }
}

