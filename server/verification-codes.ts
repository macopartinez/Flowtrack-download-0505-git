import { db } from './db';
import { verificationCodes } from '@shared/schema';
import { eq, and, gt, lt } from 'drizzle-orm';

/**
 * Génère un code à 6 chiffres unique
 */
function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Génère un code unique à envoyer (format: VERIFY-ABC123)
 */
function generateCodeToSend(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'VERIFY-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Crée un nouveau code de vérification dans Supabase
 * Retourne le code que l'utilisateur doit envoyer à Waler
 */
export async function createVerificationCode(instagramUsername: string, userId?: number): Promise<string> {
  // Générer un code unique à envoyer
  let codeToSend = generateCodeToSend();
  let attempts = 0;
  const maxAttempts = 10;

  // S'assurer que le code est unique
  while (attempts < maxAttempts) {
    const existing = await db
      .select()
      .from(verificationCodes)
      .where(eq(verificationCodes.codeToSend, codeToSend))
      .limit(1);

    if (existing.length === 0) {
      break;
    }

    codeToSend = generateCodeToSend();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique verification code');
  }

  // Calculer l'expiration (15 minutes)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Insérer le code dans la DB (sans le code à 6 chiffres pour l'instant)
  await db.insert(verificationCodes).values({
    codeToSend,
    code: null,
    instagramUsername,
    userId: userId || null,
    expiresAt,
    used: false,
  });

  console.log(`✅ Created verification code ${codeToSend} for @${instagramUsername}`);
  return codeToSend;
}

/**
 * Traite le code reçu de l'utilisateur et génère le code à 6 chiffres en réponse
 */
export async function processReceivedCode(codeToSend: string): Promise<{ success: boolean; code6Digit?: string; instagramUsername?: string }> {
  const now = new Date();

  // Chercher le codeToSend dans la DB
  const [result] = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.codeToSend, codeToSend),
        gt(verificationCodes.expiresAt, now)
      )
    )
    .limit(1);

  if (!result) {
    console.log(`❌ Code ${codeToSend} not found or expired`);
    return { success: false };
  }

  // Si le code à 6 chiffres existe déjà, le retourner
  if (result.code) {
    console.log(`✅ Code ${codeToSend} already processed, returning existing 6-digit code`);
    return {
      success: true,
      code6Digit: result.code,
      instagramUsername: result.instagramUsername,
    };
  }

  // Générer un code à 6 chiffres
  let code6Digit = generate6DigitCode();
  let attempts = 0;
  const maxAttempts = 10;

  // S'assurer que le code est unique
  while (attempts < maxAttempts) {
    const existing = await db
      .select()
      .from(verificationCodes)
      .where(eq(verificationCodes.code, code6Digit))
      .limit(1);

    if (existing.length === 0) {
      break;
    }

    code6Digit = generate6DigitCode();
    attempts++;
  }

  // Mettre à jour le code dans la DB
  await db
    .update(verificationCodes)
    .set({ code: code6Digit })
    .where(eq(verificationCodes.id, result.id));

  console.log(`✅ Generated 6-digit code ${code6Digit} for ${codeToSend}`);
  return {
    success: true,
    code6Digit,
    instagramUsername: result.instagramUsername,
  };
}

/**
 * Vérifie un code de vérification à 6 chiffres
 */
export async function verifyCode(code: string): Promise<{ valid: boolean; instagramUsername?: string }> {
  const now = new Date();

  // Chercher le code dans la DB
  const [result] = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.code, code),
        eq(verificationCodes.used, false),
        gt(verificationCodes.expiresAt, now)
      )
    )
    .limit(1);

  if (!result) {
    console.log(`❌ Code ${code} not found, already used, or expired`);
    return { valid: false };
  }

  // Marquer le code comme utilisé
  await db
    .update(verificationCodes)
    .set({
      used: true,
      usedAt: now,
    })
    .where(eq(verificationCodes.id, result.id));

  console.log(`✅ Code ${code} verified for @${result.instagramUsername}`);
  return {
    valid: true,
    instagramUsername: result.instagramUsername,
  };
}

/**
 * Récupère le dernier code non utilisé pour un username Instagram
 */
export async function getLatestCodeForUser(instagramUsername: string): Promise<string | null> {
  const now = new Date();

  const [result] = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.instagramUsername, instagramUsername),
        eq(verificationCodes.used, false),
        gt(verificationCodes.expiresAt, now)
      )
    )
    .orderBy(verificationCodes.createdAt)
    .limit(1);

  return result?.code || null;
}

/**
 * Nettoie les codes expirés (à appeler périodiquement)
 */
export async function cleanupExpiredCodes(): Promise<number> {
  const now = new Date();

  const result = await db
    .delete(verificationCodes)
    .where(
      and(
        eq(verificationCodes.used, false),
        lt(verificationCodes.expiresAt, now)
      )
    );

  console.log(`🧹 Cleaned up expired verification codes`);
  return 0; // Drizzle doesn't return affected rows count easily
}
