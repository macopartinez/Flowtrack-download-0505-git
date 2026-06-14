/**
 * Gestionnaire de classification des contacts
 * Gère les suggestions, validations et historique
 */

// Using Chrome API
import type { Category } from '../content/dm-analyzer.js';

export interface Suggestion {
  id: number;
  contactUsername: string;
  fromCategory: Category;
  toCategory: Category;
  score: number;
  confidence: number;
  reason: string;
  evidence: string[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface ClassificationTransition {
  contactUsername: string;
  fromCategory: Category;
  toCategory: Category;
  score: number;
  triggerType: 'manual' | 'auto_accepted' | 'dm_analysis' | 'score_threshold' | 'tone_change';
  notes?: string;
}

export class ClassificationManager {
  private readonly API_URL = 'http://localhost:5000/api';

  /**
   * Crée une nouvelle suggestion de classification
   */
  async createSuggestion(
    userId: number,
    contactUsername: string,
    fromCategory: Category,
    toCategory: Category,
    score: number,
    confidence: number,
    reason: string,
    evidence: string[]
  ): Promise<Suggestion | null> {
    try {
      const stored = await chrome.storage.local.get('apiToken');
      
      const response = await fetch(`${this.API_URL}/extension/suggest-transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${stored.apiToken}`,
        },
        body: JSON.stringify({
          userId,
          contactUsername,
          fromCategory,
          toCategory,
          score,
          confidence,
          reason,
          evidence
        }),
      });

      if (!response.ok) {
        console.error('Failed to create suggestion:', response.status);
        return null;
      }

      const data = await response.json();
      
      const suggestion: Suggestion = {
        id: data.suggestionId,
        contactUsername,
        fromCategory,
        toCategory,
        score,
        confidence,
        reason,
        evidence,
        status: 'pending',
        createdAt: Date.now()
      };

      // Stocker localement aussi
      await this.storeSuggestionLocally(suggestion);

      // Notifier l'utilisateur
      await this.notifyNewSuggestion(suggestion);

      return suggestion;
    } catch (error) {
      console.error('Error creating suggestion:', error);
      return null;
    }
  }

  /**
   * Accepte une suggestion
   */
  async acceptSuggestion(suggestionId: number): Promise<boolean> {
    try {
      const stored = await chrome.storage.local.get('apiToken');
      
      const response = await fetch(`${this.API_URL}/extension/validate-suggestion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${stored.apiToken}`,
        },
        body: JSON.stringify({
          suggestionId,
          action: 'accept'
        }),
      });

      if (!response.ok) {
        console.error('Failed to accept suggestion:', response.status);
        return false;
      }

      const data = await response.json();
      
      if (data.success) {
        // Mettre à jour localement
        await this.updateSuggestionStatus(suggestionId, 'accepted');
        
        // Log la transition
        console.log(`✅ Suggestion ${suggestionId} accepted, new category: ${data.newCategory}`);
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      return false;
    }
  }

  /**
   * Rejette une suggestion
   */
  async rejectSuggestion(suggestionId: number, reason?: string): Promise<boolean> {
    try {
      const stored = await chrome.storage.local.get('apiToken');
      
      const response = await fetch(`${this.API_URL}/extension/validate-suggestion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${stored.apiToken}`,
        },
        body: JSON.stringify({
          suggestionId,
          action: 'reject',
          reason
        }),
      });

      if (!response.ok) {
        console.error('Failed to reject suggestion:', response.status);
        return false;
      }

      const data = await response.json();
      
      if (data.success) {
        // Mettre à jour localement
        await this.updateSuggestionStatus(suggestionId, 'rejected');
        
        console.log(`❌ Suggestion ${suggestionId} rejected`);
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      return false;
    }
  }

  /**
   * Récupère toutes les suggestions en attente
   */
  async getPendingSuggestions(): Promise<Suggestion[]> {
    try {
      const stored = await chrome.storage.local.get(['apiToken', 'pendingSuggestions']);
      
      // Essayer de récupérer depuis le serveur
      const response = await fetch(`${this.API_URL}/extension/pending-suggestions`, {
        headers: {
          'Authorization': `Bearer ${stored.apiToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.suggestions || [];
      }

      // Fallback sur le stockage local
      return (stored.pendingSuggestions as Suggestion[]) || [];
    } catch (error) {
      console.error('Error getting pending suggestions:', error);
      
      // Fallback sur le stockage local
      const stored = await chrome.storage.local.get('pendingSuggestions');
      return (stored.pendingSuggestions as Suggestion[]) || [];
    }
  }

  /**
   * Log une transition de catégorie
   */
  async logTransition(transition: ClassificationTransition): Promise<void> {
    try {
      const stored = await chrome.storage.local.get('apiToken');
      
      await fetch(`${this.API_URL}/extension/log-transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${stored.apiToken}`,
        },
        body: JSON.stringify(transition),
      });

      console.log(`📝 Transition logged: ${transition.contactUsername} ${transition.fromCategory} → ${transition.toCategory}`);
    } catch (error) {
      console.error('Error logging transition:', error);
    }
  }

  /**
   * Stocke une suggestion localement
   */
  private async storeSuggestionLocally(suggestion: Suggestion): Promise<void> {
    const stored = await chrome.storage.local.get('pendingSuggestions');
    const suggestions: Suggestion[] = (stored.pendingSuggestions as Suggestion[]) || [];
    
    suggestions.push(suggestion);
    
    await chrome.storage.local.set({ pendingSuggestions: suggestions });
  }

  /**
   * Met à jour le statut d'une suggestion localement
   */
  private async updateSuggestionStatus(
    suggestionId: number, 
    status: 'accepted' | 'rejected'
  ): Promise<void> {
    const stored = await chrome.storage.local.get('pendingSuggestions');
    const suggestions: Suggestion[] = (stored.pendingSuggestions as Suggestion[]) || [];
    
    const updatedSuggestions = suggestions.map((s: Suggestion) => 
      s.id === suggestionId ? { ...s, status } : s
    );
    
    await chrome.storage.local.set({ pendingSuggestions: updatedSuggestions });
  }

  /**
   * Notifie l'utilisateur d'une nouvelle suggestion
   */
  private async notifyNewSuggestion(suggestion: Suggestion): Promise<void> {
    const emoji = this.getCategoryEmoji(suggestion.toCategory);
    
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: '../icons/icon-48.png',
      title: 'Nouvelle suggestion de classification',
      message: `${emoji} @${suggestion.contactUsername}\n${suggestion.fromCategory} → ${suggestion.toCategory}\nScore: ${suggestion.score}/100`,
    });

    // Mettre à jour le badge
    await this.updateBadge();
  }

  /**
   * Met à jour le badge avec le nombre de suggestions en attente
   */
  async updateBadge(): Promise<void> {
    const suggestions = await this.getPendingSuggestions();
    const pendingCount = suggestions.filter(s => s.status === 'pending').length;
    
    if (pendingCount > 0) {
      await chrome.action.setBadgeText({ text: pendingCount.toString() });
      await chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  }

  /**
   * Retourne l'emoji correspondant à une catégorie
   */
  private getCategoryEmoji(category: Category): string {
    const emojis = {
      lead: '🆕',
      prospect: '📊',
      client: '🎉',
      network: '🤝'
    };
    return emojis[category] || '📋';
  }

  /**
   * Nettoie les suggestions anciennes (> 30 jours)
   */
  private async cleanupOldSuggestions(): Promise<void> {
    const stored = await chrome.storage.local.get('pendingSuggestions');
    const suggestions: Suggestion[] = (stored.pendingSuggestions as Suggestion[]) || [];
    
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const filteredSuggestions = suggestions.filter((s: Suggestion) => 
      s.createdAt > thirtyDaysAgo || s.status === 'pending'
    );
    
    await chrome.storage.local.set({ pendingSuggestions: filteredSuggestions });
    
    console.log(`🧹 Cleaned ${suggestions.length - filteredSuggestions.length} old suggestions`);
  }
}


