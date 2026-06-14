/**
 * Moteur de scoring pour classification automatique des contacts
 * Calcule un score total basé sur 5 composantes
 */

import { DMAnalyzer, type Conversation, type Category } from './dm-analyzer.js';

export interface Contact {
  username: string;
  fullName?: string;
  avatarUrl?: string;
  
  // Données DMs
  conversation?: Conversation;
  
  // Données engagement
  likesGiven: number;
  commentsGiven: number;
  storiesViewed: number;
  sharesReceived: number;
  
  // Données activité
  profileVisits: number;
  timeSpentMinutes: number;
  linkClicks: number;
  
  // Données ancienneté
  firstInteractionDate: number; // timestamp
  lastInteractionDate: number;
  
  // Données réciprocité
  isFollowingBack: boolean;
  mutualEngagementCount: number;
  mutualConnectionsCount: number;
  
  // Catégorie actuelle
  currentCategory?: Category;
}

export interface ScoreBreakdown {
  dms: number;           // 0-30
  engagement: number;    // 0-25
  activity: number;      // 0-20
  seniority: number;     // 0-10
  reciprocity: number;   // 0-15
  total: number;         // 0-100
}

export interface TransitionDetection {
  shouldTransition: boolean;
  from: Category;
  to: Category;
  confidence: number;
  reason: string;
  evidence: string[];
}

export class ScoringEngine {
  private dmAnalyzer: DMAnalyzer;

  constructor() {
    this.dmAnalyzer = new DMAnalyzer();
  }

  /**
   * Calcule le score total d'un contact
   */
  calculateTotalScore(contact: Contact): ScoreBreakdown {
    const dms = this.calculateDMScore(contact);
    const engagement = this.calculateEngagementScore(contact);
    const activity = this.calculateActivityScore(contact);
    const seniority = this.calculateSeniorityScore(contact);
    const reciprocity = this.calculateReciprocityScore(contact);

    const total = dms + engagement + activity + seniority + reciprocity;

    return {
      dms,
      engagement,
      activity,
      seniority,
      reciprocity,
      total
    };
  }

  /**
   * Score DMs (0-30 points)
   */
  private calculateDMScore(contact: Contact): number {
    if (!contact.conversation || contact.conversation.messages.length === 0) {
      return 0;
    }

    const breakdown = this.dmAnalyzer.calculateDMScore(contact.conversation);
    return breakdown.total;
  }

  /**
   * Score Engagement (0-25 points)
   */
  private calculateEngagementScore(contact: Contact): number {
    let score = 0;

    // Likes (0-8 points) - 1 point par like
    score += Math.min(contact.likesGiven, 8);

    // Comments (0-8 points) - 2 points par comment
    score += Math.min(contact.commentsGiven * 2, 8);

    // Stories viewed (0-5 points) - 1 point par vue
    score += Math.min(contact.storiesViewed, 5);

    // Shares (0-4 points) - 2 points par share
    score += Math.min(contact.sharesReceived * 2, 4);

    return Math.min(score, 25);
  }

  /**
   * Score Activité (0-20 points)
   */
  private calculateActivityScore(contact: Contact): number {
    let score = 0;

    // Visites profil (0-8 points) - 2 points par visite
    score += Math.min(contact.profileVisits * 2, 8);

    // Temps passé (0-6 points) - 1 point par minute
    score += Math.min(contact.timeSpentMinutes, 6);

    // Clics sur liens (0-6 points) - 3 points par clic
    score += Math.min(contact.linkClicks * 3, 6);

    return Math.min(score, 20);
  }

  /**
   * Score Ancienneté (0-10 points)
   */
  private calculateSeniorityScore(contact: Contact): number {
    const now = Date.now();
    const daysSinceFirst = Math.floor(
      (now - contact.firstInteractionDate) / (1000 * 60 * 60 * 24)
    );

    let seniorityPoints = 0;

    // Points basés sur l'ancienneté
    if (daysSinceFirst < 7) seniorityPoints = 1;
    else if (daysSinceFirst < 30) seniorityPoints = 2;
    else if (daysSinceFirst < 90) seniorityPoints = 3;
    else if (daysSinceFirst < 180) seniorityPoints = 4;
    else seniorityPoints = 5;

    // Consistency (0-5 points)
    // Calculer si les interactions sont régulières
    const daysSinceLast = Math.floor(
      (now - contact.lastInteractionDate) / (1000 * 60 * 60 * 24)
    );

    let consistencyPoints = 0;
    if (daysSinceLast < 7) consistencyPoints = 5;
    else if (daysSinceLast < 14) consistencyPoints = 4;
    else if (daysSinceLast < 30) consistencyPoints = 3;
    else if (daysSinceLast < 60) consistencyPoints = 2;
    else consistencyPoints = 1;

    return seniorityPoints + consistencyPoints;
  }

  /**
   * Score Réciprocité (0-15 points)
   */
  private calculateReciprocityScore(contact: Contact): number {
    let score = 0;

    // Follow back (5 points)
    if (contact.isFollowingBack) {
      score += 5;
    }

    // Engagement mutuel (0-5 points)
    score += Math.min(contact.mutualEngagementCount, 5);

    // Connexions communes (0-5 points)
    score += Math.min(contact.mutualConnectionsCount, 5);

    return Math.min(score, 15);
  }

  /**
   * Détermine la catégorie suggérée basée sur le score
   */
  determineSuggestedCategory(score: number, dmCategory?: Category): Category {
    // Si on a une analyse DMs, on la prend en compte
    if (dmCategory) {
      if (dmCategory === 'client' && score >= 80) return 'client';
      if (dmCategory === 'prospect' && score >= 50) return 'prospect';
    }

    // Sinon, basé uniquement sur le score
    if (score >= 80) return 'client';
    if (score >= 50) return 'prospect';
    if (score >= 20) return 'network';
    return 'lead';
  }

  /**
   * Détecte si une transition de catégorie est nécessaire
   */
  detectTransition(contact: Contact, currentScore: ScoreBreakdown): TransitionDetection {
    const currentCategory = contact.currentCategory || 'lead';
    const suggestedCategory = this.determineSuggestedCategory(
      currentScore.total,
      contact.conversation 
        ? this.dmAnalyzer.analyzeConversationTone(contact.conversation.messages).category
        : undefined
    );

    // Pas de transition si même catégorie
    if (currentCategory === suggestedCategory) {
      return {
        shouldTransition: false,
        from: currentCategory,
        to: currentCategory,
        confidence: 0,
        reason: 'Catégorie inchangée',
        evidence: []
      };
    }

    // Analyser la raison de la transition
    const { reason, evidence, confidence } = this.analyzeTransitionReason(
      contact,
      currentCategory,
      suggestedCategory,
      currentScore
    );

    return {
      shouldTransition: true,
      from: currentCategory,
      to: suggestedCategory,
      confidence,
      reason,
      evidence
    };
  }

  /**
   * Analyse la raison d'une transition
   */
  private analyzeTransitionReason(
    contact: Contact,
    from: Category,
    to: Category,
    score: ScoreBreakdown
  ): {
    reason: string;
    evidence: string[];
    confidence: number;
  } {
    const evidence: string[] = [];
    let confidence = 0.5;

    // Analyser les DMs si disponibles
    if (contact.conversation && contact.conversation.messages.length > 0) {
      const topKeywords = this.dmAnalyzer.extractTopKeywords(contact.conversation, 3);
      if (topKeywords.length > 0) {
        evidence.push(`Mots-clés: ${topKeywords.join(', ')}`);
        confidence += 0.2;
      }

      const toneChange = this.dmAnalyzer.detectToneChange(contact.conversation.messages);
      if (toneChange.changed) {
        evidence.push(`Changement de ton détecté: ${toneChange.from} → ${toneChange.to}`);
        confidence += 0.15;
      }
    }

    // Analyser le score
    if (score.total >= 80) {
      evidence.push(`Score élevé: ${score.total}/100`);
      confidence += 0.1;
    }

    if (score.engagement >= 20) {
      evidence.push(`Engagement fort: ${score.engagement}/25`);
      confidence += 0.05;
    }

    // Générer la raison
    let reason = '';

    if (from === 'lead' && to === 'prospect') {
      reason = 'Intention commerciale détectée';
    } else if (from === 'prospect' && to === 'client') {
      reason = 'Conversion confirmée';
    } else if (from === 'client' && to === 'network') {
      reason = 'Baisse d\'activité business détectée';
    } else if (from === 'network' && to === 'prospect') {
      reason = 'Intérêt commercial émergent';
    } else if (from === 'lead' && to === 'network') {
      reason = 'Relation sociale établie';
    } else {
      reason = `Transition de ${from} vers ${to}`;
    }

    return {
      reason,
      evidence,
      confidence: Math.min(confidence, 1)
    };
  }

  /**
   * Vérifie si un contact devrait être reclassifié
   */
  shouldReclassify(contact: Contact, scoreBreakdown: ScoreBreakdown): boolean {
    const currentCategory = contact.currentCategory || 'lead';
    const suggestedCategory = this.determineSuggestedCategory(scoreBreakdown.total);

    // Règles de reclassification
    const rules = {
      // Lead → Prospect: score >= 50 OU DMs avec mots-clés prospect
      lead_to_prospect: currentCategory === 'lead' && 
                        (scoreBreakdown.total >= 50 || scoreBreakdown.dms >= 15),

      // Prospect → Client: score >= 80 ET DMs avec mots-clés client
      prospect_to_client: currentCategory === 'prospect' && 
                          scoreBreakdown.total >= 80 && 
                          scoreBreakdown.dms >= 20,

      // Client → Network: score < 60 ET pas de DMs client récents
      client_to_network: currentCategory === 'client' && 
                         scoreBreakdown.total < 60,

      // Network → Prospect: score >= 50 ET DMs avec mots-clés business
      network_to_prospect: currentCategory === 'network' && 
                           scoreBreakdown.total >= 50 && 
                           scoreBreakdown.dms >= 15
    };

    return Object.values(rules).some(rule => rule);
  }

  /**
   * Calcule le score de confiance pour une suggestion
   */
  calculateConfidence(contact: Contact, transition: TransitionDetection): number {
    let confidence = transition.confidence;

    // Ajuster selon le nombre de preuves
    confidence += Math.min(transition.evidence.length * 0.05, 0.15);

    // Ajuster selon la cohérence du score
    const scoreBreakdown = this.calculateTotalScore(contact);
    if (scoreBreakdown.total >= 80 && transition.to === 'client') {
      confidence += 0.1;
    }
    if (scoreBreakdown.total >= 50 && transition.to === 'prospect') {
      confidence += 0.1;
    }

    return Math.min(confidence, 1);
  }
}


