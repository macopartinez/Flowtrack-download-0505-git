import { customAlphabet } from 'nanoid';
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Générateurs de codes
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);
const tokenGenerator = customAlphabet('0123456789', 6);

/**
 * Génère un code de vérification unique incluant le username
 * Format: VERIFY-ABC123-@username
 */
export function generateVerificationCode(username: string): string {
  const code = nanoid();
  return `VERIFY-${code}-@${username}`;
}

/**
 * Génère un token à 6 chiffres
 */
export function generateVerificationToken(): string {
  return tokenGenerator();
}

/**
 * Crée une vérification pour un utilisateur
 */
export async function createVerification(userId: number): Promise<{
  verificationCode: string;
  verificationToken: string;
  expiresAt: Date;
}> {
  // Récupérer l'utilisateur
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    throw new Error("Utilisateur non trouvé");
  }

  // Générer les codes
  const verificationCode = generateVerificationCode(user.username);
  const verificationToken = generateVerificationToken();
  
  // Expiration dans 15 minutes
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Mettre à jour l'utilisateur
  await db.update(users)
    .set({
      verificationCode,
      verificationToken,
      verificationTokenExpiry: expiresAt,
      verificationAttempts: 0,
    })
    .where(eq(users.id, userId));

  return {
    verificationCode,
    verificationToken,
    expiresAt,
  };
}

/**
 * Vérifie le token entré par l'utilisateur
 */
export async function verifyToken(
  userId: number,
  token: string
): Promise<{ success: boolean; message: string }> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (!user) {
    return { success: false, message: "Utilisateur non trouvé" };
  }

  // Vérifier si déjà vérifié
  if (user.isVerified) {
    return { success: true, message: "Compte déjà vérifié" };
  }

  // Vérifier le nombre de tentatives
  if ((user.verificationAttempts || 0) >= 5) {
    return {
      success: false,
      message: "Trop de tentatives. Demandez un nouveau code.",
    };
  }

  // Vérifier l'expiration
  if (user.verificationTokenExpiry) {
    const expiry = new Date(user.verificationTokenExpiry);
    if (expiry < new Date()) {
      return {
        success: false,
        message: "Code expiré. Demandez un nouveau code.",
      };
    }
  }

  // Vérifier le token
  if (user.verificationToken !== token) {
    // Incrémenter les tentatives
    await db.update(users)
      .set({
        verificationAttempts: (user.verificationAttempts || 0) + 1,
      })
      .where(eq(users.id, userId));

    return {
      success: false,
      message: `Code incorrect. ${4 - (user.verificationAttempts || 0)} tentatives restantes.`,
    };
  }

  // Succès ! Marquer comme vérifié
  await db.update(users)
    .set({
      isVerified: true,
      verificationCode: null,
      verificationToken: null,
      verificationTokenExpiry: null,
      verificationAttempts: 0,
    })
    .where(eq(users.id, userId));

  return { success: true, message: "Compte vérifié avec succès !" };
}

/**
 * Régénère un nouveau code de vérification
 */
export async function resendVerificationCode(userId: number): Promise<{
  verificationCode: string;
  expiresAt: Date;
}> {
  return createVerification(userId);
}
