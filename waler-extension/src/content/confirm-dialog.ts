/**
 * Confirm Dialog — petite modale in-page (Oui/Non) pour demander une
 * autorisation à l'utilisateur. ScanOverlay n'a pas de boutons ; ce module
 * fournit une vraie confirmation bloquante via Promise<boolean>.
 */

export interface ConfirmOptions {
  title?: string;
  okLabel?: string;
  cancelLabel?: string;
}

export function showConfirmDialog(message: string, opts: ConfirmOptions = {}): Promise<boolean> {
  const title = opts.title ?? 'Waler';
  const okLabel = opts.okLabel ?? 'Autoriser';
  const cancelLabel = opts.cancelLabel ?? 'Refuser';

  return new Promise<boolean>((resolve) => {
    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed; inset: 0; z-index: 1000000;
      background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      animation: walerFadeIn 0.2s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes walerFadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes walerPop { from { transform: scale(0.95); opacity: 0 } to { transform: scale(1); opacity: 1 } }
    `;
    document.head.appendChild(style);

    // Carte
    const card = document.createElement('div');
    card.style.cssText = `
      background: hsl(240, 3.7%, 15.9%);
      border: 1px solid hsl(142, 70%, 50.4%, 0.3);
      color: hsl(0, 0%, 98%);
      border-radius: 14px;
      padding: 22px;
      width: 340px; max-width: calc(100vw - 40px);
      box-shadow: 0 10px 40px rgba(0,0,0,0.6);
      animation: walerPop 0.2s ease-out;
    `;

    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    titleEl.style.cssText = 'font-weight: 700; font-size: 15px; margin-bottom: 10px;';

    const msgEl = document.createElement('div');
    msgEl.textContent = message;
    msgEl.style.cssText = 'font-size: 13px; line-height: 1.6; opacity: 0.92; margin-bottom: 18px; white-space: pre-line;';

    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = cancelLabel;
    cancelBtn.style.cssText = `
      padding: 10px 16px; border-radius: 9px; cursor: pointer; font-weight: 600; font-size: 13px;
      background: transparent; color: hsl(0,0%,90%); border: 1px solid hsl(240,3.7%,30%);
      font-family: inherit;
    `;

    const okBtn = document.createElement('button');
    okBtn.textContent = okLabel;
    okBtn.style.cssText = `
      padding: 10px 16px; border-radius: 9px; cursor: pointer; font-weight: 700; font-size: 13px;
      background: hsl(142, 70%, 50.4%); color: hsl(240,10%,3.9%); border: 1px solid hsl(142, 70%, 50.4%);
      font-family: inherit;
    `;

    let settled = false;
    const cleanup = (result: boolean) => {
      if (settled) return;
      settled = true;
      backdrop.remove();
      style.remove();
      resolve(result);
    };

    okBtn.addEventListener('click', () => cleanup(true));
    cancelBtn.addEventListener('click', () => cleanup(false));
    backdrop.addEventListener('click', (e) => {
      // Clic en dehors de la carte = refus (sécurité).
      if (e.target === backdrop) cleanup(false);
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    card.appendChild(titleEl);
    card.appendChild(msgEl);
    card.appendChild(actions);
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);
  });
}
