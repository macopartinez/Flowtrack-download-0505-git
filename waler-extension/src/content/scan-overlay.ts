/**
 * Scan Overlay - Affiche un indicateur de progression discret sur Instagram
 */

const ICON_HOURGLASS = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#02c950" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>`;

const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#02c950" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

const ICON_X = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

class ScanOverlay {
  private overlay: HTMLDivElement | null = null;
  private progressBar: HTMLDivElement | null = null;
  private statusText: HTMLSpanElement | null = null;
  private iconEl: HTMLDivElement | null = null;
  private pctText: HTMLSpanElement | null = null;
  private actionBtn: HTMLButtonElement | null = null;

  show(message: string = 'Analyse en cours...') {
    if (this.overlay) this.overlay.remove();

    const style = document.createElement('style');
    style.id = 'waler-overlay-style';
    style.textContent = `
      @keyframes waler-in  { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes waler-out { from { transform: translateY(0);    opacity: 1; } to { transform: translateY(12px); opacity: 0; } }
      @keyframes waler-spin {
        0%   { transform: rotate(0deg); }
        40%  { transform: rotate(180deg); }
        50%  { transform: rotate(180deg); }
        90%  { transform: rotate(360deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    if (!document.getElementById('waler-overlay-style')) {
      document.head.appendChild(style);
    }

    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #000;
      border: 1px solid rgba(2,201,80,0.18);
      color: #fff;
      padding: 14px 16px;
      border-radius: 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(2,201,80,0.06);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-width: 260px;
      max-width: 320px;
      animation: waler-in 0.25s ease-out;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:10px;';

    this.iconEl = document.createElement('div');
    this.iconEl.innerHTML = ICON_HOURGLASS;
    this.iconEl.style.cssText = 'display:flex;align-items:center;flex-shrink:0;animation:waler-spin 2s ease-in-out infinite;';

    const title = document.createElement('span');
    title.textContent = 'Waler';
    title.style.cssText = 'font-weight:600;font-size:13px;letter-spacing:0.02em;color:#02c950;flex:1;';

    this.pctText = document.createElement('span');
    this.pctText.textContent = '';
    this.pctText.style.cssText = 'font-size:11px;color:rgba(255,255,255,0.4);font-variant-numeric:tabular-nums;';

    header.appendChild(this.iconEl);
    header.appendChild(title);
    header.appendChild(this.pctText);

    // Status
    this.statusText = document.createElement('span');
    this.statusText.textContent = message;
    this.statusText.style.cssText = 'display:block;font-size:12px;color:rgba(255,255,255,0.65);margin-bottom:10px;line-height:1.4;';

    // Progress track
    const track = document.createElement('div');
    track.style.cssText = 'width:100%;height:2px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;';

    this.progressBar = document.createElement('div');
    this.progressBar.style.cssText = 'width:0%;height:100%;background:#02c950;border-radius:2px;transition:width 0.4s ease;box-shadow:0 0 6px rgba(2,201,80,0.5);';

    track.appendChild(this.progressBar);

    this.overlay.appendChild(header);
    this.overlay.appendChild(this.statusText);
    this.overlay.appendChild(track);

    document.body.appendChild(this.overlay);
  }

  updateProgress(current: number, total: number, message?: string) {
    if (!this.overlay) return;
    const pct = Math.min(100, Math.floor((current / total) * 100));
    if (this.progressBar) this.progressBar.style.width = `${pct}%`;
    if (this.statusText) this.statusText.textContent = message || `${current} / ${total} (${pct}%)`;
    if (this.pctText) this.pctText.textContent = `${pct}%`;
  }

  showSuccess(message: string = 'Analyse terminée !') {
    if (!this.overlay) return;
    if (this.iconEl) { this.iconEl.innerHTML = ICON_CHECK; this.iconEl.style.animation = 'none'; }
    if (this.statusText) this.statusText.textContent = message;
    if (this.progressBar) this.progressBar.style.width = '100%';
    if (this.pctText) this.pctText.textContent = '100%';
    setTimeout(() => this.hide(), 3000);
  }

  showError(message: string = 'Erreur lors de l\'analyse') {
    if (!this.overlay) return;
    if (this.iconEl) { this.iconEl.innerHTML = ICON_X; this.iconEl.style.animation = 'none'; }
    if (this.overlay) this.overlay.style.borderColor = 'rgba(255,77,77,0.3)';
    if (this.statusText) this.statusText.textContent = message;
    if (this.progressBar) { this.progressBar.style.background = '#ff4d4d'; this.progressBar.style.boxShadow = '0 0 6px rgba(255,77,77,0.5)'; }
    setTimeout(() => this.hide(), 5000);
  }

  /**
   * Ajoute (ou remplace) un bouton d'action sous la barre de progression — ex.
   * « Terminer l'analyse » pour clore une capture manuelle. Recréé à chaque
   * `show()` (le bouton est détruit avec l'overlay).
   */
  setActionButton(label: string, onClick: () => void) {
    if (!this.overlay) return;
    this.actionBtn?.remove();
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText =
      'margin-top:12px;width:100%;padding:8px 12px;border:1px solid rgba(2,201,80,0.35);' +
      'background:rgba(2,201,80,0.12);color:#02c950;font-size:12px;font-weight:600;' +
      'border-radius:8px;cursor:pointer;font-family:inherit;transition:background 0.15s ease;';
    btn.onmouseenter = () => (btn.style.background = 'rgba(2,201,80,0.22)');
    btn.onmouseleave = () => (btn.style.background = 'rgba(2,201,80,0.12)');
    btn.onclick = () => onClick();
    this.actionBtn = btn;
    this.overlay.appendChild(btn);
  }

  /** Retire le bouton d'action s'il existe. */
  clearActionButton() {
    this.actionBtn?.remove();
    this.actionBtn = null;
  }

  hide() {
    if (!this.overlay) return;
    this.overlay.style.animation = 'waler-out 0.25s ease-out forwards';
    setTimeout(() => {
      if (this.overlay) { this.overlay.remove(); this.overlay = null; }
      this.progressBar = null;
      this.statusText = null;
      this.iconEl = null;
      this.pctText = null;
      this.actionBtn = null;
    }, 250);
  }

  isVisible(): boolean {
    return this.overlay !== null;
  }
}

export default ScanOverlay;
