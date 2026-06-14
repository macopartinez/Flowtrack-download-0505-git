/**
 * Gestionnaire de mode hors ligne et synchronisation
 */

import React from 'react';

export interface QueuedAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retries: number;
}

export class OfflineManager {
  private static readonly QUEUE_KEY = 'offline_queue';
  private static readonly MAX_QUEUE_SIZE = 100;
  private static readonly MAX_RETRIES = 3;
  private static isOnline = navigator.onLine;
  private static listeners: ((isOnline: boolean) => void)[] = [];

  /**
   * Initialise le gestionnaire
   */
  static init(): void {
    // Écouter les changements de connexion
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners(true);
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners(false);
    });

    // Traiter la queue au démarrage si en ligne
    if (this.isOnline) {
      this.processQueue();
    }
  }

  /**
   * Vérifie si en ligne
   */
  static getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Ajoute un listener
   */
  static addListener(listener: (isOnline: boolean) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Supprime un listener
   */
  static removeListener(listener: (isOnline: boolean) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notifie les listeners
   */
  private static notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(isOnline);
      } catch (error) {
        console.error('Error in offline listener:', error);
      }
    });
  }

  /**
   * Ajoute une action à la queue
   */
  static queueAction(type: string, data: any): void {
    const queue = this.getQueue();

    const action: QueuedAction = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    queue.push(action);

    // Limiter la taille de la queue
    if (queue.length > this.MAX_QUEUE_SIZE) {
      queue.shift();
    }

    this.saveQueue(queue);

    console.log(`📥 Action queued: ${type}`, action);
  }

  /**
   * Récupère la queue
   */
  private static getQueue(): QueuedAction[] {
    const stored = localStorage.getItem(this.QUEUE_KEY);
    
    if (!stored) {
      return [];
    }

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * Sauvegarde la queue
   */
  private static saveQueue(queue: QueuedAction[]): void {
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Traite la queue
   */
  static async processQueue(): Promise<void> {
    if (!this.isOnline) {
      console.log('⏸️ Offline, queue processing paused');
      return;
    }

    const queue = this.getQueue();

    if (queue.length === 0) {
      return;
    }

    console.log(`🔄 Processing ${queue.length} queued actions...`);

    const remaining: QueuedAction[] = [];

    for (const action of queue) {
      try {
        await this.processAction(action);
        console.log(`✅ Action processed: ${action.type}`);
      } catch (error) {
        console.error(`❌ Failed to process action: ${action.type}`, error);

        // Retry si pas trop de tentatives
        if (action.retries < this.MAX_RETRIES) {
          action.retries++;
          remaining.push(action);
        } else {
          console.error(`🗑️ Action discarded after ${this.MAX_RETRIES} retries:`, action);
        }
      }
    }

    this.saveQueue(remaining);

    if (remaining.length > 0) {
      console.log(`⏳ ${remaining.length} actions remaining in queue`);
    } else {
      console.log('✨ Queue processed successfully');
    }
  }

  /**
   * Traite une action
   */
  private static async processAction(action: QueuedAction): Promise<void> {
    // Dispatcher selon le type
    switch (action.type) {
      case 'SYNC_DMS':
        await this.syncDMs(action.data);
        break;
      case 'SYNC_CONVERSATIONS':
        await this.syncConversations(action.data);
        break;
      case 'VALIDATE_SUGGESTION':
        await this.validateSuggestion(action.data);
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Sync DMs
   */
  private static async syncDMs(data: any): Promise<void> {
    const response = await fetch('/api/extension/sync-dms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  /**
   * Sync conversations
   */
  private static async syncConversations(data: any): Promise<void> {
    const response = await fetch('/api/extension/sync-conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  /**
   * Validate suggestion
   */
  private static async validateSuggestion(data: any): Promise<void> {
    const response = await fetch('/api/classification/validate-suggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  /**
   * Nettoie la queue
   */
  static clearQueue(): void {
    localStorage.removeItem(this.QUEUE_KEY);
    console.log('🗑️ Queue cleared');
  }

  /**
   * Statistiques de la queue
   */
  static getQueueStats(): {
    size: number;
    oldestTimestamp?: number;
    byType: Record<string, number>;
  } {
    const queue = this.getQueue();

    const stats = {
      size: queue.length,
      oldestTimestamp: queue.length > 0 ? queue[0].timestamp : undefined,
      byType: {} as Record<string, number>,
    };

    queue.forEach(action => {
      stats.byType[action.type] = (stats.byType[action.type] || 0) + 1;
    });

    return stats;
  }
}

/**
 * Hook React pour le mode hors ligne
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = React.useState(OfflineManager.getIsOnline());

  React.useEffect(() => {
    const listener = (online: boolean) => setIsOnline(online);
    OfflineManager.addListener(listener);
    return () => OfflineManager.removeListener(listener);
  }, []);

  return isOnline;
}

// Initialiser au chargement
if (typeof window !== 'undefined') {
  OfflineManager.init();
}
