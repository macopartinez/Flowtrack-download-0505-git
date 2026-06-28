/**
 * Client API avec retry logic et gestion d'erreurs
 */

import { ErrorHandler, ErrorType, ErrorSeverity, NetworkError, AuthenticationError, RateLimitError, retryWithBackoff } from './error-handler.js';
import { API_URL } from '../config.js';

export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;
  private retryDelay: number;
  private defaultHeaders: Record<string, string>;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || API_URL;
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  /**
   * Requête GET avec retry
   */
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Requête POST avec retry
   */
  async post<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Requête PUT avec retry
   */
  async put<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Requête DELETE avec retry
   */
  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Requête générique avec gestion d'erreurs et retry
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    return retryWithBackoff(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const response = await fetch(url, {
            ...options,
            headers: {
              ...this.defaultHeaders,
              ...options.headers,
            },
            credentials: 'include',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Gérer les erreurs HTTP
          if (!response.ok) {
            await this.handleHttpError(response);
          }

          // Parser la réponse
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            return await response.json();
          } else {
            return await response.text() as any;
          }
        } catch (error: any) {
          clearTimeout(timeoutId);

          // Gérer les erreurs réseau
          if (error.name === 'AbortError') {
            ErrorHandler.log(
              ErrorType.NETWORK,
              ErrorSeverity.MEDIUM,
              'Request timeout',
              { url, timeout: this.timeout }
            );
            throw new NetworkError('Request timeout', 408);
          }

          ErrorHandler.log(
            ErrorType.NETWORK,
            ErrorSeverity.MEDIUM,
            'Network request failed',
            { url, error: error.message }
          );
          throw new NetworkError(error.message);
        }
      },
      {
        maxRetries: this.retries,
        initialDelay: this.retryDelay,
        onRetry: (attempt, error) => {
          console.log(`🔄 Retry attempt ${attempt} for ${endpoint}`, error.message);
        },
      }
    );
  }

  /**
   * Gère les erreurs HTTP
   */
  private async handleHttpError(response: Response): Promise<never> {
    let errorData: any;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const message = errorData.message || `HTTP ${response.status}`;

    switch (response.status) {
      case 401:
        ErrorHandler.log(
          ErrorType.AUTHENTICATION,
          ErrorSeverity.HIGH,
          'Authentication failed',
          { status: 401, message }
        );
        throw new AuthenticationError(message);

      case 403:
        ErrorHandler.log(
          ErrorType.PERMISSION,
          ErrorSeverity.MEDIUM,
          'Permission denied',
          { status: 403, message }
        );
        throw new NetworkError(message, 403, errorData);

      case 429:
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        ErrorHandler.log(
          ErrorType.RATE_LIMIT,
          ErrorSeverity.MEDIUM,
          'Rate limit exceeded',
          { status: 429, retryAfter }
        );
        throw new RateLimitError(message, retryAfter);

      case 500:
      case 502:
      case 503:
      case 504:
        ErrorHandler.log(
          ErrorType.NETWORK,
          ErrorSeverity.HIGH,
          'Server error',
          { status: response.status, message }
        );
        throw new NetworkError(message, response.status, errorData);

      default:
        ErrorHandler.log(
          ErrorType.NETWORK,
          ErrorSeverity.MEDIUM,
          `HTTP error ${response.status}`,
          { status: response.status, message }
        );
        throw new NetworkError(message, response.status, errorData);
    }
  }

  /**
   * Vérifie la connexion au backend
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Configure le token d'authentification
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Supprime le token d'authentification
   */
  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }
}

// Instance globale
export const apiClient = new ApiClient();

/**
 * Helpers spécifiques pour l'extension
 */
export class ExtensionApi {
  /**
   * Sync DMs
   */
  static async syncDMs(messages: any[]): Promise<any> {
    try {
      return await apiClient.post('/extension/sync-dms', { messages });
    } catch (error) {
      ErrorHandler.log(
        ErrorType.NETWORK,
        ErrorSeverity.MEDIUM,
        'Failed to sync DMs',
        { error, messageCount: messages.length }
      );
      throw error;
    }
  }

  /**
   * Sync conversations
   */
  static async syncConversations(conversations: any[]): Promise<any> {
    try {
      return await apiClient.post('/extension/sync-conversations', { conversations });
    } catch (error) {
      ErrorHandler.log(
        ErrorType.NETWORK,
        ErrorSeverity.MEDIUM,
        'Failed to sync conversations',
        { error, conversationCount: conversations.length }
      );
      throw error;
    }
  }

  /**
   * Analyze DMs
   */
  static async analyzeDMs(contactUsername: string): Promise<any> {
    try {
      return await apiClient.post('/extension/analyze-dms', { contactUsername });
    } catch (error) {
      ErrorHandler.log(
        ErrorType.NETWORK,
        ErrorSeverity.MEDIUM,
        'Failed to analyze DMs',
        { error, contactUsername }
      );
      throw error;
    }
  }

  /**
   * Get suggestions
   */
  static async getSuggestions(): Promise<any> {
    try {
      return await apiClient.get('/classification/suggestions');
    } catch (error) {
      ErrorHandler.log(
        ErrorType.NETWORK,
        ErrorSeverity.LOW,
        'Failed to get suggestions',
        { error }
      );
      throw error;
    }
  }

  /**
   * Validate suggestion
   */
  static async validateSuggestion(suggestionId: number, action: 'accept' | 'reject', reason?: string): Promise<any> {
    try {
      return await apiClient.post('/classification/validate-suggestion', {
        suggestionId,
        action,
        reason,
      });
    } catch (error) {
      ErrorHandler.log(
        ErrorType.NETWORK,
        ErrorSeverity.MEDIUM,
        'Failed to validate suggestion',
        { error, suggestionId, action }
      );
      throw error;
    }
  }
}


