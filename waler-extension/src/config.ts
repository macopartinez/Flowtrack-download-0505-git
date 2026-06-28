// ──────────────────────────────────────────────────────────────────────────
// Backend de l'extension — SOURCE UNIQUE de l'URL.
//
// DEV (local)  : 'http://localhost:5000'  ← serveur lancé via `npm run dev`.
// PROD         : 'https://waler.website'.
//
// Bascule ICI (un seul endroit) puis rebuild l'extension (`npm run build`) et
// recharge-la dans chrome://extensions. En dev, le manifest doit AUSSI autoriser
// localhost (host_permissions + content_scripts) — déjà ajouté.
// ──────────────────────────────────────────────────────────────────────────
export const API_BASE = 'http://localhost:5000';

// Origine du site web (mêmes que l'API : le serveur sert l'app ET /api).
export const WEB_BASE = API_BASE;

// Préfixe des routes API.
export const API_URL = `${API_BASE}/api`;
