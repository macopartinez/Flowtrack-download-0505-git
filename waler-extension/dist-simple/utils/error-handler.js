/**
 * Gestionnaire d'erreurs centralisé
 */
export var ErrorType;
(function (ErrorType) {
    ErrorType["NETWORK"] = "NETWORK";
    ErrorType["AUTHENTICATION"] = "AUTHENTICATION";
    ErrorType["VALIDATION"] = "VALIDATION";
    ErrorType["ENCRYPTION"] = "ENCRYPTION";
    ErrorType["STORAGE"] = "STORAGE";
    ErrorType["RATE_LIMIT"] = "RATE_LIMIT";
    ErrorType["PERMISSION"] = "PERMISSION";
    ErrorType["UNKNOWN"] = "UNKNOWN";
})(ErrorType || (ErrorType = {}));
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "LOW";
    ErrorSeverity["MEDIUM"] = "MEDIUM";
    ErrorSeverity["HIGH"] = "HIGH";
    ErrorSeverity["CRITICAL"] = "CRITICAL";
})(ErrorSeverity || (ErrorSeverity = {}));
export class ErrorHandler {
    /**
     * Enregistre une erreur
     */
    static log(type, severity, message, details, userMessage) {
        const error = {
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
    static addListener(listener) {
        this.listeners.push(listener);
    }
    /**
     * Supprime un listener
     */
    static removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    /**
     * Notifie tous les listeners
     */
    static notifyListeners(error) {
        this.listeners.forEach(listener => {
            try {
                listener(error);
            }
            catch (e) {
                console.error('Error in listener:', e);
            }
        });
    }
    /**
     * Log dans la console
     */
    static logToConsole(error) {
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
    static async reportToBackend(error) {
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
        }
        catch (e) {
            console.error('Failed to report error to backend:', e);
        }
    }
    /**
     * Message utilisateur par défaut
     */
    static getDefaultUserMessage(type) {
        const messages = {
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
    static getErrors(filter) {
        let filtered = [...this.errors];
        if (filter?.type) {
            filtered = filtered.filter(e => e.type === filter.type);
        }
        if (filter?.severity) {
            filtered = filtered.filter(e => e.severity === filter.severity);
        }
        if (filter?.since !== undefined) {
            filtered = filtered.filter(e => e.timestamp >= filter.since);
        }
        return filtered.sort((a, b) => b.timestamp - a.timestamp);
    }
    /**
     * Nettoie l'historique
     */
    static clearErrors() {
        this.errors = [];
    }
    /**
     * Statistiques d'erreurs
     */
    static getStats() {
        const stats = {
            total: this.errors.length,
            byType: {},
            bySeverity: {},
        };
        this.errors.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
        });
        return stats;
    }
}
ErrorHandler.errors = [];
ErrorHandler.MAX_ERRORS = 100;
ErrorHandler.listeners = [];
/**
 * Wrapper pour les erreurs réseau
 */
export class NetworkError extends Error {
    constructor(message, statusCode, response) {
        super(message);
        this.statusCode = statusCode;
        this.response = response;
        this.name = 'NetworkError';
    }
}
/**
 * Wrapper pour les erreurs d'authentification
 */
export class AuthenticationError extends Error {
    constructor(message = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
    }
}
/**
 * Wrapper pour les erreurs de validation
 */
export class ValidationError extends Error {
    constructor(message, field, value) {
        super(message);
        this.field = field;
        this.value = value;
        this.name = 'ValidationError';
    }
}
/**
 * Wrapper pour les erreurs de rate limit
 */
export class RateLimitError extends Error {
    constructor(message = 'Rate limit exceeded', retryAfter) {
        super(message);
        this.retryAfter = retryAfter;
        this.name = 'RateLimitError';
    }
}
/**
 * Helper pour wrapper les fonctions async avec gestion d'erreur
 */
export function withErrorHandling(fn, errorType = ErrorType.UNKNOWN, severity = ErrorSeverity.MEDIUM) {
    return (async (...args) => {
        try {
            return await fn(...args);
        }
        catch (error) {
            ErrorHandler.log(errorType, severity, error.message || 'Unknown error', { error, args });
            throw error;
        }
    });
}
/**
 * Helper pour retry avec backoff exponentiel
 */
export async function retryWithBackoff(fn, options = {}) {
    const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000, backoffFactor = 2, onRetry, } = options;
    let lastError;
    let delay = initialDelay;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
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
