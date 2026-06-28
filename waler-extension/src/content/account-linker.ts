/**
 * account-linker.ts — Détection du compte Instagram et proposition de liaison.
 *
 * Quand l'utilisateur visite SON propre profil (bouton « Modifier le profil » /
 * « Edit profile » présent) et que le compte Insta connecté n'est pas encore
 * lié au login Waler, on affiche un popup proposant de le lier. L'utilisateur
 * peut accepter ou refuser. En cas de refus, on mémorise le choix pour ne pas
 * reproposer en boucle (re-liable depuis le popup d'extension).
 */

import { showConfirmDialog } from './confirm-dialog.js';
import { getAccountRegistry, upsertAccount } from '../background/account-storage.js';

interface LinkPromptParams {
  dsUserId: string;
  igUsername: string;
}

/**
 * Lie SILENCIEUSEMENT le compte PRINCIPAL (aucun popup). Le compte avec lequel on
 * s'est inscrit à Waler n'a pas à être "proposé" : il est rattaché
 * automatiquement au login. Fire-and-forget, idempotent.
 */
export async function autoLinkPrimaryAccount(params: LinkPromptParams): Promise<void> {
  const { dsUserId, igUsername } = params;
  try {
    const registry = await getAccountRegistry();
    if (registry.accounts[dsUserId]?.accountId) return; // déjà lié

    const response = (await chrome.runtime.sendMessage({
      type: 'LINK_ACCOUNT',
      data: { dsUserId, igUsername },
    })) as { success: boolean; error?: string };

    if (response?.success) {
      console.log(`✅ Compte principal @${igUsername} rattaché automatiquement`);
    } else {
      console.warn('⚠️ Rattachement auto du compte principal échoué:', response?.error);
    }
  } catch (error) {
    console.error('Error in autoLinkPrimaryAccount:', error);
  }
}

// Évite plusieurs popups simultanés / répétés dans la même session de page.
let promptInFlight = false;
const promptedThisSession = new Set<string>();

/**
 * Cherche le bouton « Modifier le profil » / « Edit profile » qui n'apparaît que
 * sur SON propre profil. Confirme qu'on a le droit de proposer la liaison.
 */
function hasEditProfileButton(): boolean {
  // Lien direct vers l'édition de profil (le plus fiable, indépendant de la langue)
  if (document.querySelector('a[href="/accounts/edit/"], a[href="/accounts/edit"]')) {
    return true;
  }
  // Fallback : bouton/élément cliquable au texte « Edit profile » / « Modifier le profil »
  const candidates = Array.from(
    document.querySelectorAll('a, button, div[role="button"]')
  );
  return candidates.some((el) => {
    const text = (el.textContent || '').trim().toLowerCase();
    return text === 'edit profile' || text === 'modifier le profil';
  });
}

/** Attend l'apparition du bouton d'édition (le profil charge en SPA). */
async function waitForEditProfileButton(timeoutMs = 6000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (hasEditProfileButton()) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

/**
 * Point d'entrée appelé depuis le content script quand on est sur son profil et
 * que le compte n'est pas encore lié. Fire-and-forget.
 */
export async function maybePromptAccountLink(params: LinkPromptParams): Promise<void> {
  const { dsUserId, igUsername } = params;

  if (promptInFlight || promptedThisSession.has(dsUserId)) return;

  try {
    // Ne pas reproposer si l'utilisateur a déjà refusé pour ce compte.
    const registry = await getAccountRegistry();
    const entry = registry.accounts[dsUserId];
    if (entry?.accountId) return; // déjà lié
    if (entry?.dismissed) return; // refusé précédemment

    // Confirmer la présence du bouton « Modifier le profil ».
    const onOwnProfile = await waitForEditProfileButton();
    if (!onOwnProfile) return;

    promptInFlight = true;
    promptedThisSession.add(dsUserId);

    const accepted = await showConfirmDialog(
      `Do you want to link the account @${igUsername} to Waler?\n\n` +
        `This account will have its own isolated database. You can switch ` +
        `between your accounts from the extension and the dashboard.`,
      {
        title: '🔗 Link this Instagram account',
        okLabel: 'Link account',
        cancelLabel: 'Not now',
      }
    );

    if (accepted) {
      const response = (await chrome.runtime.sendMessage({
        type: 'LINK_ACCOUNT',
        data: { dsUserId, igUsername },
      })) as { success: boolean; error?: string };

      if (response?.success) {
        console.log(`✅ Compte @${igUsername} lié à Waler`);
      } else {
        console.error('❌ Échec de la liaison du compte:', response?.error);
        // Permettre une nouvelle tentative plus tard (pas de dismissed).
        promptedThisSession.delete(dsUserId);
      }
    } else {
      // Refus mémorisé : ne plus reproposer automatiquement.
      await upsertAccount(dsUserId, { igUsername, dismissed: true });
      console.log(`ℹ️ Liaison de @${igUsername} refusée (mémorisé)`);
    }
  } catch (error) {
    console.error('Error in maybePromptAccountLink:', error);
  } finally {
    promptInFlight = false;
  }
}
