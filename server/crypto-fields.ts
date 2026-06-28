// Chiffrement au repos des contenus sensibles (messages DM) — AES-256-GCM.
//
// Pourquoi ce module : la politique de confidentialité annonce un chiffrement
// AES-256 du contenu des messages. On le rend RÉEL ici, côté application, pour
// que `dm_messages.message_text` et `media_urls` ne soient jamais stockés en
// clair dans la base SQLite (waler.db).
//
// Compatibilité ascendante : les lignes déjà présentes (en clair) ne sont PAS
// préfixées par `enc:v1:`. `decryptField()` les renvoie telles quelles, donc
// l'historique existant reste lisible sans migration. Les nouvelles écritures
// passent par `encryptField()`.

import crypto from "crypto";

const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";
const IV_LEN = 12; // GCM standard
const TAG_LEN = 16;

let cachedKey: Buffer | null = null;

/**
 * Dérive la clé AES-256 (32 octets) depuis l'environnement.
 * Priorité : DM_ENCRYPTION_KEY, sinon dérivée de SESSION_SECRET (pratique en
 * dev). En production, ne PAS démarrer la collecte sans DM_ENCRYPTION_KEY défini.
 */
function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.DM_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!raw || raw === "dev-secret-change-in-production") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "DM_ENCRYPTION_KEY doit être défini en production pour chiffrer les messages.",
      );
    }
    // Dev uniquement : clé déterministe pour ne pas casser le flux local.
    cachedKey = crypto.createHash("sha256").update("waler-dev-fallback-key").digest();
    return cachedKey;
  }

  // Accepte une clé hex 64 chars (32 octets) telle quelle, sinon dérive via SHA-256.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    cachedKey = Buffer.from(raw, "hex");
  } else {
    cachedKey = crypto.createHash("sha256").update(raw).digest();
  }
  return cachedKey;
}

/** Chiffre une valeur texte. Renvoie null/undefined inchangés. */
export function encryptField(value: string | null | undefined): string | null | undefined {
  if (value === null || value === undefined) return value;
  if (typeof value !== "string") value = String(value);
  // Ne pas re-chiffrer une valeur déjà chiffrée (idempotent).
  if (value.startsWith(PREFIX)) return value;

  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, ciphertext]).toString("base64");
  return PREFIX + payload;
}

/**
 * Déchiffre une valeur. Si elle n'est pas préfixée (donnée héritée en clair),
 * elle est renvoyée telle quelle. En cas d'échec d'authentification, renvoie la
 * valeur brute plutôt que de planter une route entière.
 */
export function decryptField(value: string | null | undefined): string | null | undefined {
  if (value === null || value === undefined) return value;
  if (typeof value !== "string" || !value.startsWith(PREFIX)) return value;

  try {
    const buf = Buffer.from(value.slice(PREFIX.length), "base64");
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const ciphertext = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch (err) {
    console.error("decryptField: échec de déchiffrement, valeur renvoyée brute", err);
    return value;
  }
}

/**
 * Déchiffre en place les champs sensibles d'une ligne `dm_messages` issue d'un
 * `SELECT *`. Mutualise les sites de lecture pour garder les fonctions intactes.
 */
export function decryptMessageRow(row: Record<string, any>): Record<string, any> {
  if (!row) return row;
  if ("message_text" in row) row.message_text = decryptField(row.message_text);
  if ("media_urls" in row) row.media_urls = decryptField(row.media_urls);
  return row;
}
