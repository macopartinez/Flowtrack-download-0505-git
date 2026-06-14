/**
 * Gestionnaire de consentement RGPD
 */
export class ConsentManager {
    /**
     * Vérifie si l'utilisateur a donné son consentement
     */
    static hasConsent() {
        const consent = this.getConsent();
        return consent !== null && consent.dmCollection && consent.dataStorage;
    }
    /**
     * Récupère les paramètres de consentement
     */
    static getConsent() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (!stored) {
            return null;
        }
        try {
            return JSON.parse(stored);
        }
        catch {
            return null;
        }
    }
    /**
     * Enregistre le consentement
     */
    static setConsent(settings) {
        const consent = {
            dmCollection: settings.dmCollection ?? false,
            scoreCalculation: settings.scoreCalculation ?? false,
            dataStorage: settings.dataStorage ?? false,
            analytics: settings.analytics ?? false,
            consentDate: Date.now(),
            version: this.CONSENT_VERSION,
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(consent));
        // Log pour audit
        console.log('✅ Consent updated:', {
            dmCollection: consent.dmCollection,
            scoreCalculation: consent.scoreCalculation,
            dataStorage: consent.dataStorage,
            analytics: consent.analytics,
        });
    }
    /**
     * Révoque le consentement
     */
    static revokeConsent() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('❌ Consent revoked');
    }
    /**
     * Vérifie si le consentement est à jour
     */
    static isConsentUpToDate() {
        const consent = this.getConsent();
        if (!consent) {
            return false;
        }
        return consent.version === this.CONSENT_VERSION;
    }
    /**
     * Demande le consentement à l'utilisateur
     */
    static async requestConsent() {
        return new Promise((resolve) => {
            // Afficher le dialog de consentement
            const dialog = this.createConsentDialog();
            document.body.appendChild(dialog);
            // Gérer les boutons
            const acceptBtn = dialog.querySelector('#consent-accept');
            const rejectBtn = dialog.querySelector('#consent-reject');
            acceptBtn?.addEventListener('click', () => {
                this.setConsent({
                    dmCollection: true,
                    scoreCalculation: true,
                    dataStorage: true,
                    analytics: false, // Opt-in séparé
                });
                dialog.remove();
                resolve(true);
            });
            rejectBtn?.addEventListener('click', () => {
                this.revokeConsent();
                dialog.remove();
                resolve(false);
            });
        });
    }
    /**
     * Crée le dialog de consentement
     */
    static createConsentDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'waler-consent-dialog';
        dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
        dialog.innerHTML = `
      <div style="
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 500px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      ">
        <h2 style="
          margin: 0 0 16px 0;
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
        ">
          🔐 Protection de vos données
        </h2>
        
        <p style="
          margin: 0 0 24px 0;
          font-size: 14px;
          line-height: 1.6;
          color: #666;
        ">
          Waler collecte et analyse vos conversations Instagram pour vous aider à classifier vos contacts.
        </p>

        <div style="
          background: #f5f5f5;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        ">
          <h3 style="
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            color: #1a1a1a;
          ">
            Nous collectons :
          </h3>
          <ul style="
            margin: 0;
            padding-left: 20px;
            font-size: 13px;
            color: #666;
            line-height: 1.8;
          ">
            <li>Contenu de vos messages Instagram (chiffré)</li>
            <li>Statistiques d'engagement (likes, vues, etc.)</li>
            <li>Scores de classification calculés</li>
          </ul>
        </div>

        <div style="
          background: #e8f5e9;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        ">
          <h3 style="
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            color: #2e7d32;
          ">
            ✅ Vos garanties :
          </h3>
          <ul style="
            margin: 0;
            padding-left: 20px;
            font-size: 13px;
            color: #2e7d32;
            line-height: 1.8;
          ">
            <li>Messages chiffrés localement (AES-256)</li>
            <li>Aucun partage avec des tiers</li>
            <li>Export et suppression à tout moment</li>
            <li>Conformité RGPD complète</li>
          </ul>
        </div>

        <div style="
          display: flex;
          gap: 12px;
        ">
          <button id="consent-reject" style="
            flex: 1;
            background: #f5f5f5;
            border: none;
            border-radius: 8px;
            padding: 12px;
            font-size: 14px;
            font-weight: 600;
            color: #666;
            cursor: pointer;
          ">
            Refuser
          </button>
          <button id="consent-accept" style="
            flex: 1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 8px;
            padding: 12px;
            font-size: 14px;
            font-weight: 600;
            color: white;
            cursor: pointer;
          ">
            Accepter
          </button>
        </div>

        <p style="
          margin: 16px 0 0 0;
          font-size: 11px;
          color: #999;
          text-align: center;
        ">
          En acceptant, vous consentez au traitement de vos données selon notre 
          <a href="/privacy" target="_blank" style="color: #667eea;">politique de confidentialité</a>
        </p>
      </div>
    `;
        return dialog;
    }
    /**
     * Vérifie les permissions spécifiques
     */
    static canCollectDMs() {
        const consent = this.getConsent();
        return consent?.dmCollection ?? false;
    }
    static canCalculateScores() {
        const consent = this.getConsent();
        return consent?.scoreCalculation ?? false;
    }
    static canStoreData() {
        const consent = this.getConsent();
        return consent?.dataStorage ?? false;
    }
    static canUseAnalytics() {
        const consent = this.getConsent();
        return consent?.analytics ?? false;
    }
}
ConsentManager.STORAGE_KEY = 'user_consent';
ConsentManager.CONSENT_VERSION = '1.0';
/**
 * Audit log pour la conformité RGPD
 */
export class AuditLog {
    static log(action, details) {
        const entry = {
            timestamp: Date.now(),
            action,
            details,
        };
        const log = this.getLog();
        log.push(entry);
        // Garder seulement les dernières entrées
        if (log.length > this.MAX_ENTRIES) {
            log.splice(0, log.length - this.MAX_ENTRIES);
        }
        localStorage.setItem(this.LOG_KEY, JSON.stringify(log));
    }
    static getLog() {
        const stored = localStorage.getItem(this.LOG_KEY);
        if (!stored) {
            return [];
        }
        try {
            return JSON.parse(stored);
        }
        catch {
            return [];
        }
    }
    static clearLog() {
        localStorage.removeItem(this.LOG_KEY);
    }
    static exportLog() {
        const log = this.getLog();
        return JSON.stringify(log, null, 2);
    }
}
AuditLog.LOG_KEY = 'audit_log';
AuditLog.MAX_ENTRIES = 1000;
