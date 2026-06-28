/**
 * Nombre maximum de comptes Instagram autorisés selon le plan d'abonnement.
 * - Base ('premium') : 1 compte (personnel)
 * - Pro              : 3 comptes (perso + comptes professionnels)
 * - Aucun plan       : uniquement le compte principal.
 *
 * Source de vérité partagée entre le serveur (enforcement) et le client
 * (affichage du compteur N/max).
 */
export type AccountTier = "premium" | "pro" | null | undefined;

export function maxAccountsForTier(tier: AccountTier): number {
  if (tier === "pro") return 3;
  if (tier === "premium") return 1;
  return 1;
}

/** Libellé d'affichage du maximum. */
export function maxAccountsLabel(tier: AccountTier): string {
  return String(maxAccountsForTier(tier));
}
