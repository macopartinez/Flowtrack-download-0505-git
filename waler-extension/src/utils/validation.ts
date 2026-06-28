/**
 * Module de validation et sanitization des données
 */

export class DataValidator {
  /**
   * Valide un username Instagram
   */
  static isValidUsername(username: string): boolean {
    if (!username || typeof username !== 'string') {
      return false;
    }

    // Instagram usernames: 1-30 caractères, alphanumériques + . _
    const usernameRegex = /^[a-zA-Z0-9._]{1,30}$/;
    return usernameRegex.test(username);
  }

  /**
   * Valide un message text
   */
  static isValidMessageText(text: string): boolean {
    if (typeof text !== 'string') {
      return false;
    }

    // Max 5000 caractères (limite Instagram)
    if (text.length > 5000) {
      return false;
    }

    return true;
  }

  /**
   * Valide un timestamp
   */
  static isValidTimestamp(timestamp: number): boolean {
    if (typeof timestamp !== 'number') {
      return false;
    }

    // Doit être entre 2020 et 2030
    const min = new Date('2020-01-01').getTime();
    const max = new Date('2030-12-31').getTime();

    return timestamp >= min && timestamp <= max;
  }

  /**
   * Valide un score (0-100)
   */
  static isValidScore(score: number): boolean {
    return typeof score === 'number' && score >= 0 && score <= 100;
  }

  /**
   * Valide une catégorie
   */
  static isValidCategory(category: string): boolean {
    const validCategories = ['lead', 'prospect', 'client', 'network'];
    return validCategories.includes(category);
  }

  /**
   * Valide une URL
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Valide un objet DM Message
   */
  static isValidDMMessage(message: any): boolean {
    if (!message || typeof message !== 'object') {
      return false;
    }

    return (
      this.isValidUsername(message.conversationWith) &&
      this.isValidMessageText(message.text) &&
      this.isValidTimestamp(message.timestamp) &&
      typeof message.isSent === 'boolean'
    );
  }

  /**
   * Valide un objet Contact Score
   */
  static isValidContactScore(score: any): boolean {
    if (!score || typeof score !== 'object') {
      return false;
    }

    return (
      this.isValidUsername(score.username) &&
      this.isValidScore(score.total) &&
      this.isValidScore(score.dms) &&
      this.isValidScore(score.engagement) &&
      this.isValidScore(score.activity) &&
      this.isValidScore(score.seniority) &&
      this.isValidScore(score.reciprocity)
    );
  }
}

export class DataSanitizer {
  /**
   * Nettoie un username
   */
  static sanitizeUsername(username: string): string {
    if (!username) return '';
    
    // Supprimer @ si présent
    username = username.replace(/^@/, '');
    
    // Garder seulement les caractères valides
    username = username.replace(/[^a-zA-Z0-9._]/g, '');
    
    // Limiter à 30 caractères
    return username.substring(0, 30);
  }

  /**
   * Nettoie un message text
   */
  static sanitizeMessageText(text: string): string {
    if (!text) return '';
    
    // Supprimer les caractères de contrôle
    text = text.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Limiter à 5000 caractères
    return text.substring(0, 5000);
  }

  /**
   * Nettoie une URL
   */
  static sanitizeUrl(url: string): string {
    if (!url) return '';
    
    try {
      const parsed = new URL(url);
      // Garder seulement HTTPS
      if (parsed.protocol !== 'https:') {
        return '';
      }
      return parsed.toString();
    } catch {
      return '';
    }
  }

  /**
   * Échappe les caractères HTML
   */
  static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * Nettoie un objet DM Message
   */
  static sanitizeDMMessage(message: any): any {
    return {
      conversationWith: this.sanitizeUsername(message.conversationWith),
      text: this.sanitizeMessageText(message.text),
      timestamp: typeof message.timestamp === 'number' ? message.timestamp : Date.now(),
      isSent: Boolean(message.isSent),
      messageId: message.messageId || `${message.conversationWith}_${Date.now()}`,
      mediaUrls: Array.isArray(message.mediaUrls) 
        ? message.mediaUrls.map((url: string) => this.sanitizeUrl(url)).filter(Boolean)
        : [],
      reactions: Array.isArray(message.reactions) ? message.reactions : [],
      isRead: Boolean(message.isRead),
    };
  }

  /**
   * Nettoie un objet Contact Score
   */
  static sanitizeContactScore(score: any): any {
    const clamp = (value: number, min: number, max: number) => 
      Math.max(min, Math.min(max, value));

    return {
      username: this.sanitizeUsername(score.username),
      total: clamp(score.total || 0, 0, 100),
      dms: clamp(score.dms || 0, 0, 30),
      engagement: clamp(score.engagement || 0, 0, 25),
      activity: clamp(score.activity || 0, 0, 20),
      seniority: clamp(score.seniority || 0, 0, 10),
      reciprocity: clamp(score.reciprocity || 0, 0, 15),
    };
  }
}

/**
 * Rate limiter pour prévenir les abus
 */
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();

  /**
   * Vérifie si une action est autorisée
   */
  static isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Supprimer les requêtes hors de la fenêtre
    const validRequests = requests.filter(time => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return false;
    }

    // Ajouter la nouvelle requête
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  /**
   * Nettoie les anciennes entrées
   */
  static cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 heure

    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => now - time < maxAge);
      
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

/**
 * Content Security Policy helper
 */
export class CSPHelper {
  /**
   * Vérifie si une URL est autorisée
   */
  static isAllowedOrigin(url: string): boolean {
    const allowedOrigins = [
      'https://www.instagram.com',
      'https://i.instagram.com',
      'https://scontent.cdninstagram.com',
    ];

    try {
      const parsed = new URL(url);
      return allowedOrigins.some(origin => parsed.origin === origin);
    } catch {
      return false;
    }
  }

  /**
   * Vérifie si un script est autorisé
   */
  static isAllowedScript(scriptUrl: string): boolean {
    const allowedScripts = [
      'https://www.instagram.com',
    ];

    return allowedScripts.some(allowed => scriptUrl.startsWith(allowed));
  }
}

/**
 * Input sanitization pour prévenir les injections
 */
export class InputSanitizer {
  /**
   * Prévient les injections SQL
   */
  static sanitizeSQLInput(input: string): string {
    // Échapper les caractères dangereux
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }

  /**
   * Prévient les injections XSS
   */
  static sanitizeXSS(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  /**
   * Prévient les injections de commandes
   */
  static sanitizeCommand(input: string): string {
    return input
      .replace(/[;&|`$()]/g, '')
      .replace(/\.\./g, '');
  }
}


