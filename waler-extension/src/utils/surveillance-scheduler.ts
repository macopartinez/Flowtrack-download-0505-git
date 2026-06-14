/**
 * Système de surveillance différenciée par catégorie
 * Plus la catégorie est importante (VIP/Client), plus la surveillance est fréquente
 */

export enum SurveillanceCategory {
  CLIENT = 'client',      // VIP - Surveillance maximale
  PROSPECT = 'prospect',  // Haute priorité
  NETWORK = 'network',    // Priorité moyenne
  LEAD = 'lead',          // Priorité basse
}

export interface SurveillanceConfig {
  category: SurveillanceCategory;
  checkInterval: number;        // Intervalle en minutes
  priority: number;             // 1-4 (1 = max priorité)
  maxConcurrent: number;        // Nombre max de surveillances simultanées
  retentionDays: number;        // Durée de conservation des données
  alertThreshold: number;       // Seuil d'alerte (changements significatifs)
}

export class SurveillanceScheduler {
  private static readonly CONFIGS: Record<SurveillanceCategory, SurveillanceConfig> = {
    [SurveillanceCategory.CLIENT]: {
      category: SurveillanceCategory.CLIENT,
      checkInterval: 15,          // Toutes les 15 minutes (VIP)
      priority: 1,
      maxConcurrent: 10,
      retentionDays: 90,
      alertThreshold: 5,          // Alerte si 5+ changements
    },
    [SurveillanceCategory.PROSPECT]: {
      category: SurveillanceCategory.PROSPECT,
      checkInterval: 60,          // Toutes les heures
      priority: 2,
      maxConcurrent: 20,
      retentionDays: 60,
      alertThreshold: 10,
    },
    [SurveillanceCategory.NETWORK]: {
      category: SurveillanceCategory.NETWORK,
      checkInterval: 240,         // Toutes les 4 heures
      priority: 3,
      maxConcurrent: 50,
      retentionDays: 30,
      alertThreshold: 15,
    },
    [SurveillanceCategory.LEAD]: {
      category: SurveillanceCategory.LEAD,
      checkInterval: 1440,        // Une fois par jour
      priority: 4,
      maxConcurrent: 100,
      retentionDays: 14,
      alertThreshold: 20,
    },
  };

  private static schedules: Map<string, NodeJS.Timeout> = new Map();
  private static lastCheck: Map<string, number> = new Map();
  private static activeChecks: Set<string> = new Set();

  /**
   * Récupère la config pour une catégorie
   */
  static getConfig(category: SurveillanceCategory): SurveillanceConfig {
    return this.CONFIGS[category];
  }

  /**
   * Démarre la surveillance pour un contact
   */
  static startSurveillance(
    username: string,
    category: SurveillanceCategory,
    onCheck: (username: string) => Promise<void>
  ): void {
    const config = this.getConfig(category);
    const key = `${username}_${category}`;

    // Arrêter la surveillance existante
    this.stopSurveillance(username);

    console.log(`📡 Starting surveillance for @${username} (${category}) - Every ${config.checkInterval}min`);

    // Première vérification immédiate
    this.performCheck(username, category, onCheck);

    // Planifier les vérifications récurrentes
    const interval = setInterval(() => {
      this.performCheck(username, category, onCheck);
    }, config.checkInterval * 60 * 1000);

    this.schedules.set(key, interval);
  }

  /**
   * Arrête la surveillance pour un contact
   */
  static stopSurveillance(username: string): void {
    // Trouver et arrêter tous les schedules pour ce username
    for (const [key, interval] of this.schedules.entries()) {
      if (key.startsWith(`${username}_`)) {
        clearInterval(interval);
        this.schedules.delete(key);
        console.log(`⏸️ Stopped surveillance for @${username}`);
      }
    }

    this.activeChecks.delete(username);
    this.lastCheck.delete(username);
  }

  /**
   * Effectue une vérification
   */
  private static async performCheck(
    username: string,
    category: SurveillanceCategory,
    onCheck: (username: string) => Promise<void>
  ): Promise<void> {
    // Éviter les vérifications concurrentes
    if (this.activeChecks.has(username)) {
      console.log(`⏭️ Skipping check for @${username} (already in progress)`);
      return;
    }

    const config = this.getConfig(category);
    const now = Date.now();
    const lastCheckTime = this.lastCheck.get(username);

    // Vérifier l'intervalle minimum
    if (lastCheckTime && (now - lastCheckTime) < config.checkInterval * 60 * 1000) {
      console.log(`⏭️ Skipping check for @${username} (too soon)`);
      return;
    }

    this.activeChecks.add(username);
    this.lastCheck.set(username, now);

    try {
      console.log(`🔍 Checking @${username} (${category})...`);
      await onCheck(username);
      console.log(`✅ Check completed for @${username}`);
    } catch (error) {
      console.error(`❌ Check failed for @${username}:`, error);
    } finally {
      this.activeChecks.delete(username);
    }
  }

  /**
   * Met à jour la catégorie d'un contact (change la fréquence)
   */
  static updateCategory(
    username: string,
    newCategory: SurveillanceCategory,
    onCheck: (username: string) => Promise<void>
  ): void {
    console.log(`🔄 Updating surveillance for @${username}: ${newCategory}`);
    this.startSurveillance(username, newCategory, onCheck);
  }

  /**
   * Récupère les statistiques de surveillance
   */
  static getStats(): {
    total: number;
    active: number;
    byCategory: Record<SurveillanceCategory, number>;
  } {
    const stats = {
      total: this.schedules.size,
      active: this.activeChecks.size,
      byCategory: {
        [SurveillanceCategory.CLIENT]: 0,
        [SurveillanceCategory.PROSPECT]: 0,
        [SurveillanceCategory.NETWORK]: 0,
        [SurveillanceCategory.LEAD]: 0,
      },
    };

    for (const key of this.schedules.keys()) {
      const category = key.split('_')[1] as SurveillanceCategory;
      if (category in stats.byCategory) {
        stats.byCategory[category]++;
      }
    }

    return stats;
  }

  /**
   * Récupère la prochaine vérification pour un contact
   */
  static getNextCheck(username: string, category: SurveillanceCategory): Date | null {
    const lastCheckTime = this.lastCheck.get(username);
    
    if (!lastCheckTime) {
      return new Date(); // Immédiat si jamais vérifié
    }

    const config = this.getConfig(category);
    const nextCheckTime = lastCheckTime + (config.checkInterval * 60 * 1000);

    return new Date(nextCheckTime);
  }

  /**
   * Arrête toutes les surveillances
   */
  static stopAll(): void {
    for (const interval of this.schedules.values()) {
      clearInterval(interval);
    }

    this.schedules.clear();
    this.activeChecks.clear();
    this.lastCheck.clear();

    console.log('⏹️ All surveillances stopped');
  }

  /**
   * Récupère les contacts à vérifier maintenant (par priorité)
   */
  static getContactsToCheck(): Array<{
    username: string;
    category: SurveillanceCategory;
    priority: number;
    nextCheck: Date;
  }> {
    const contacts: Array<{
      username: string;
      category: SurveillanceCategory;
      priority: number;
      nextCheck: Date;
    }> = [];

    const now = Date.now();

    for (const [key, _] of this.schedules.entries()) {
      const [username, category] = key.split('_') as [string, SurveillanceCategory];
      const lastCheckTime = this.lastCheck.get(username) || 0;
      const config = this.getConfig(category);
      const nextCheckTime = lastCheckTime + (config.checkInterval * 60 * 1000);

      if (nextCheckTime <= now) {
        contacts.push({
          username,
          category,
          priority: config.priority,
          nextCheck: new Date(nextCheckTime),
        });
      }
    }

    // Trier par priorité (1 = max priorité)
    return contacts.sort((a, b) => a.priority - b.priority);
  }
}

/**
 * Gestionnaire de priorités de surveillance
 */
export class SurveillancePriorityManager {
  /**
   * Calcule la priorité dynamique basée sur plusieurs facteurs
   */
  static calculateDynamicPriority(
    category: SurveillanceCategory,
    factors: {
      recentActivity?: number;      // Activité récente (0-100)
      engagementRate?: number;      // Taux d'engagement (0-100)
      lastInteraction?: number;     // Timestamp dernière interaction
      conversionProbability?: number; // Probabilité de conversion (0-1)
    }
  ): number {
    const config = SurveillanceScheduler.getConfig(category);
    let priority = config.priority;

    // Boost si activité récente élevée
    if (factors.recentActivity && factors.recentActivity > 70) {
      priority -= 0.5;
    }

    // Boost si engagement élevé
    if (factors.engagementRate && factors.engagementRate > 80) {
      priority -= 0.3;
    }

    // Boost si interaction récente (< 24h)
    if (factors.lastInteraction) {
      const hoursSinceInteraction = (Date.now() - factors.lastInteraction) / (1000 * 60 * 60);
      if (hoursSinceInteraction < 24) {
        priority -= 0.4;
      }
    }

    // Boost si forte probabilité de conversion
    if (factors.conversionProbability && factors.conversionProbability > 0.7) {
      priority -= 0.6;
    }

    return Math.max(1, priority); // Min priorité = 1
  }

  /**
   * Recommande un ajustement de fréquence
   */
  static recommendFrequencyAdjustment(
    category: SurveillanceCategory,
    activityScore: number
  ): {
    shouldAdjust: boolean;
    newInterval?: number;
    reason?: string;
  } {
    const config = SurveillanceScheduler.getConfig(category);

    // Si activité très élevée, augmenter la fréquence
    if (activityScore > 80) {
      return {
        shouldAdjust: true,
        newInterval: Math.max(5, config.checkInterval / 2),
        reason: 'Activité très élevée détectée',
      };
    }

    // Si activité très faible, diminuer la fréquence
    if (activityScore < 20) {
      return {
        shouldAdjust: true,
        newInterval: config.checkInterval * 2,
        reason: 'Activité faible, économie de ressources',
      };
    }

    return { shouldAdjust: false };
  }
}

/**
 * Intégration avec le système de classification
 */
export class SurveillanceClassificationBridge {
  /**
   * Synchronise la surveillance avec les catégories de classification
   */
  static async syncWithClassification(
    userId: number,
    onCheck: (username: string) => Promise<void>
  ): Promise<void> {
    try {
      // Récupérer tous les contacts avec leurs catégories
      const response = await fetch(`/api/classification/contact-scores?userId=${userId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }

      const { scores } = await response.json();

      // Démarrer la surveillance pour chaque contact
      for (const score of scores) {
        const category = this.mapCategoryToSurveillance(score.current_category);
        SurveillanceScheduler.startSurveillance(
          score.contact_username,
          category,
          onCheck
        );
      }

      console.log(`✅ Surveillance synced for ${scores.length} contacts`);
    } catch (error) {
      console.error('Failed to sync surveillance:', error);
    }
  }

  /**
   * Mappe les catégories de classification vers les catégories de surveillance
   */
  private static mapCategoryToSurveillance(
    classificationCategory: string
  ): SurveillanceCategory {
    const mapping: Record<string, SurveillanceCategory> = {
      'client': SurveillanceCategory.CLIENT,
      'prospect': SurveillanceCategory.PROSPECT,
      'network': SurveillanceCategory.NETWORK,
      'lead': SurveillanceCategory.LEAD,
    };

    return mapping[classificationCategory] || SurveillanceCategory.LEAD;
  }

  /**
   * Gère le changement de catégorie
   */
  static handleCategoryChange(
    username: string,
    oldCategory: string,
    newCategory: string,
    onCheck: (username: string) => Promise<void>
  ): void {
    const surveillanceCategory = this.mapCategoryToSurveillance(newCategory);

    console.log(`🔄 Category changed for @${username}: ${oldCategory} → ${newCategory}`);
    console.log(`📡 Updating surveillance frequency to: ${SurveillanceScheduler.getConfig(surveillanceCategory).checkInterval}min`);

    SurveillanceScheduler.updateCategory(username, surveillanceCategory, onCheck);
  }
}


