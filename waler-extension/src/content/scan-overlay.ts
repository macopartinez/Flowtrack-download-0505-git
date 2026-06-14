/**
 * Scan Overlay - Affiche un indicateur de progression discret sur Instagram
 */

class ScanOverlay {
  private overlay: HTMLDivElement | null = null;
  private progressBar: HTMLDivElement | null = null;
  private statusText: HTMLSpanElement | null = null;

  /**
   * Afficher l'overlay avec un message
   */
  show(message: string = 'Analyse en cours...') {
    if (this.overlay) {
      this.overlay.remove();
    }

    // Créer l'overlay
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: hsl(240, 3.7%, 15.9%);
      border: 1px solid hsl(142, 70%, 50.4%, 0.3);
      color: hsl(0, 0%, 98%);
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 20px hsl(142, 70%, 50.4%, 0.2);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-width: 280px;
      animation: slideIn 0.3s ease-out;
    `;

    // Ajouter l'animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    // Contenu
    const content = document.createElement('div');
    
    // Header avec icône
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    `;
    
    const icon = document.createElement('div');
    icon.innerHTML = '⏳';
    icon.style.cssText = `
      font-size: 20px;
      animation: pulse 1.5s ease-in-out infinite;
    `;
    
    const title = document.createElement('span');
    title.textContent = 'Waler';
    title.style.cssText = `
      font-weight: 600;
      font-size: 14px;
    `;
    
    header.appendChild(icon);
    header.appendChild(title);
    
    // Message de statut
    this.statusText = document.createElement('span');
    this.statusText.textContent = message;
    this.statusText.style.cssText = `
      display: block;
      font-size: 13px;
      opacity: 0.9;
      margin-bottom: 10px;
    `;
    
    // Barre de progression
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      overflow: hidden;
    `;
    
    this.progressBar = document.createElement('div');
    this.progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: hsl(142, 70%, 50.4%);
      border-radius: 2px;
      transition: width 0.3s ease;
      box-shadow: 0 0 10px hsl(142, 70%, 50.4%, 0.5);
    `;
    
    progressContainer.appendChild(this.progressBar);
    
    content.appendChild(header);
    content.appendChild(this.statusText);
    content.appendChild(progressContainer);
    
    this.overlay.appendChild(content);
    document.body.appendChild(this.overlay);
  }

  /**
   * Mettre à jour la progression
   */
  updateProgress(current: number, total: number, message?: string) {
    if (!this.overlay) return;

    const percentage = Math.floor((current / total) * 100);
    
    if (this.progressBar) {
      this.progressBar.style.width = `${percentage}%`;
    }
    
    if (this.statusText) {
      this.statusText.textContent = message || `${current}/${total} followers (${percentage}%)`;
    }
  }

  /**
   * Afficher un message de succès
   */
  showSuccess(message: string = 'Analyse terminée !') {
    if (!this.overlay) return;

    if (this.overlay) {
      this.overlay.style.background = 'hsl(240, 3.7%, 15.9%)';
      this.overlay.style.borderColor = 'hsl(142, 70%, 50.4%)';
      this.overlay.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 30px hsl(142, 70%, 50.4%, 0.4)';
    }

    if (this.statusText) {
      this.statusText.textContent = message;
    }

    if (this.progressBar) {
      this.progressBar.style.width = '100%';
    }

    // Masquer après 3 secondes
    setTimeout(() => {
      this.hide();
    }, 3000);
  }

  /**
   * Afficher un message d'erreur
   */
  showError(message: string = 'Erreur lors de l\'analyse') {
    if (!this.overlay) return;

    if (this.overlay) {
      this.overlay.style.background = 'hsl(240, 3.7%, 15.9%)';
      this.overlay.style.borderColor = 'hsl(0, 70%, 50.4%)';
      this.overlay.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 30px hsl(0, 70%, 50.4%, 0.4)';
    }

    if (this.statusText) {
      this.statusText.textContent = message;
    }

    // Masquer après 5 secondes
    setTimeout(() => {
      this.hide();
    }, 5000);
  }

  /**
   * Masquer l'overlay
   */
  hide() {
    if (!this.overlay) return;

    this.overlay.style.animation = 'slideOut 0.3s ease-out';
    
    setTimeout(() => {
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
        this.progressBar = null;
        this.statusText = null;
      }
    }, 300);
  }

  /**
   * Vérifier si l'overlay est visible
   */
  isVisible(): boolean {
    return this.overlay !== null;
  }
}

export default ScanOverlay;
