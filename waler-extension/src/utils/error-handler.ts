/**
 * Gestionnaire d'erreurs centralisé
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  ENCRYPTION = 'ENCRYPTION',
  STORAGE = 'STORAGE',
  RATE_LIMIT = 'RATE_LIMIT',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: any;
  timestamp: number;
  stack?: string;
  userMessage?: string;
}

export class ErrorHandler {
  private static errors: AppError[] = [];
  private static readonly MAX_ERRORS = 100;
  private static listeners: ((error: AppError) => void)[] = [];

  /**
   * Enregistre une erreur
   */
  static log(
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    details?: any,
    userMessage?: string
  ): AppError {
    const error: AppError = {
      type,
      severity,
      message,
      details,
      timestamp: Date.now(),
      stack: new Error().stack,
      userMessage: userMessage || this.getDefaultUserMessage(type),
    };

    // Ajouter à l'historique
    this.errors.push(error);
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors.shift();
    }

    // Log console selon la sévérité
    this.logToConsole(error);

    // Notifier les listeners
    this.notifyListeners(error);

    // Envoyer au backend si critique
    if (severity === ErrorSeverity.CRITICAL) {
      this.reportToBackend(error);
    }

    return error;
  }

  /**
   * Enregistre un listener
   */
  static addListener(listener: (error: AppError) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Supprime un listener
   */
  static removeListener(listener: (error: AppError) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notifie tous les listeners
   */
  private static notifyListeners(error: AppError): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in listener:', e);
      }
    });
  }

  /**
   * Log dans la console
   */
  private static logToConsole(error: AppError): void {
    const prefix = `[${error.severity}] [${error.type}]`;
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error(prefix, error.message, error.details);
        break;
      case ErrorSeverity.HIGH:
        console.error(prefix, error.message, error.details);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(prefix, error.message, error.details);
        break;
      case ErrorSeverity.LOW:
        console.log(prefix, error.message, error.details);
        break;
    }
  }

  /**
   * Envoie l'erreur au backend
   */
  private static async reportToBackend(error: AppError): Promise<void> {
    try {
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: error.type,
          severity: error.severity,
          message: error.message,
          details: error.details,
          timestamp: error.timestamp,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (e) {
      console.error('Failed to report error to backend:', e);
    }
  }

  /**
   * Message utilisateur par défaut
   */
  private static getDefaultUserMessage(type: ErrorType): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: 'Erreur de connexion. Vérifiez votre connexion internet.',
      [ErrorType.AUTHENTICATION]: 'Erreur d\'authentification. Veuillez vous reconnecter.',
      [ErrorType.VALIDATION]: 'Données invalides. Veuillez vérifier vos informations.',
      [ErrorType.ENCRYPTION]: 'Erreur de chiffrement. Vos données sont protégées.',
      [ErrorType.STORAGE]: 'Erreur de stockage. L\'espace disponible est peut-être insuffisant.',
      [ErrorType.RATE_LIMIT]: 'Trop de requêtes. Veuillez patienter quelques instants.',
      [ErrorType.PERMISSION]: 'Permission refusée. Vérifiez vos paramètres de confidentialité.',
      [ErrorType.UNKNOWN]: 'Une erreur inattendue s\'est produite.',
    };

    return messages[type];
  }

  /**
   * Récupère l'historique des erreurs
   */
  static getErrors(filter?: {
    type?: ErrorType;
    severity?: ErrorSeverity;
    since?: number;
  }): AppError[] {
    let filtered = [...this.errors];

    if (filter?.type) {
      filtered = filtered.filter(e => e.type === filter.type);
    }

    if (filter?.severity) {
      filtered = filtered.filter(e => e.severity === filter.severity);
    }

    if (filter?.since !== undefined) {
      filtered = filtered.filter(e => e.timestamp >= filter.since!);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Nettoie l'historique
   */
  static clearErrors(): void {
    this.errors = [];
  }

  /**
   * Statistiques d'erreurs
   */
  static getStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
  } {
    const stats = {
      total: this.errors.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
    };

    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }
}

/**
 * Wrapper pour les erreurs réseau
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Wrapper pour les erreurs d'authentification
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Wrapper pour les erreurs de validation
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Wrapper pour les erreurs de rate limit
 */
export class RateLimitError extends Error {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Helper pour wrapper les fonctions async avec gestion d'erreur
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorType: ErrorType = ErrorType.UNKNOWN,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      ErrorHandler.log(
        errorType,
        severity,
        error.message || 'Unknown error',
        { error, args }
      );
      throw error;
    }
  }) as T;
}

/**
 * Helper pour retry avec backoff exponentiel
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt + 1, error);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }
  }

  throw lastError;
}


