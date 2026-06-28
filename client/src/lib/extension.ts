/**
 * Pont page → extension Waler.
 *
 * Le dashboard (waler.website / localhost) parle à l'extension via
 * `chrome.runtime.sendMessage(extensionId, …)` (autorisé par
 * `externally_connectable` dans le manifest). L'extension a la session
 * Instagram de l'utilisateur : elle peut donc résoudre/valider un pseudo.
 */

// Identité de l'extension (mêmes valeurs que <ExtensionConnect>).
export const WALER_EXTENSION_ID =
  (import.meta as any).env?.VITE_WALER_EXTENSION_ID ||
  "adapccolepnlmimjemidkeamcbpgkeeo";

/**
 * Envoie un message externe à l'extension. Résout `null` si l'extension n'est
 * pas installée / ne répond pas (chrome absent, lastError, timeout).
 */
export function sendToExtension(payload: any, timeoutMs = 8000): Promise<any | null> {
  return new Promise((resolve) => {
    const chromeApi = (window as any).chrome;
    if (!chromeApi?.runtime?.sendMessage) {
      resolve(null);
      return;
    }
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, timeoutMs);
    try {
      chromeApi.runtime.sendMessage(WALER_EXTENSION_ID, payload, (response: any) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(chromeApi.runtime.lastError ? null : response ?? null);
      });
    } catch {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(null);
      }
    }
  });
}

export type UsernameCheck =
  | { status: "ok"; username: string; fullName?: string }
  | { status: "not_found" }
  | { status: "unknown" }; // extension absente / non connectée / erreur réseau

/**
 * Vérifie qu'un pseudo Instagram existe réellement (via l'extension + la session
 * IG de l'utilisateur). `"unknown"` quand on ne PEUT pas vérifier : l'appelant
 * ne doit alors pas bloquer l'utilisateur.
 */
export async function checkInstagramUsername(username: string): Promise<UsernameCheck> {
  const handle = username.trim().replace(/^@/, "");
  if (!handle) return { status: "unknown" };

  const res = await sendToExtension({ type: "CHECK_IG_USERNAME", username: handle });
  if (!res) return { status: "unknown" }; // extension indisponible
  if (res.error || res.loggedIn === false) return { status: "unknown" };
  if (res.exists) {
    return { status: "ok", username: res.username || handle, fullName: res.fullName };
  }
  return { status: "not_found" };
}
