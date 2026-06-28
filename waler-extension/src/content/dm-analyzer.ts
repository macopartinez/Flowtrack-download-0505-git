/**
 * DM Analyzer — analyse heuristique (lexique FR/EN) d'une conversation Instagram.
 * Aucune IA : mots-clés, ton, fréquence et réciprocité.
 *
 * Catégories alignées avec scoring-engine.ts : 'lead' | 'prospect' | 'client' | 'network'.
 */

export type Category = 'lead' | 'prospect' | 'client' | 'network';

export interface ConversationMessage {
  text: string;
  isSent: boolean;          // true = envoyé par l'utilisateur
  timestamp: number | null;
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: ConversationMessage[];
}

export interface DMScoreBreakdown {
  total: number;        // 0-30
  frequency: number;    // 0-10
  keywordsTone: number; // 0-10
  reciprocity: number;  // 0-10
}

// Lexiques business (FR + EN)
const PROSPECT_KEYWORDS = [
  'prix', 'tarif', 'tarifs', 'devis', 'combien', 'coûte', 'cout', 'dispo', 'disponible',
  'intéressé', 'interesse', 'intéressée', 'acheter', 'commander', 'commande', 'réserver',
  'reserver', 'info', 'infos', 'renseignement', 'catalogue', 'offre', 'promo',
  'price', 'cost', 'quote', 'available', 'interested', 'buy', 'order', 'booking', 'how much',
];
const CLIENT_KEYWORDS = [
  'payé', 'paye', 'paiement', 'payée', 'facture', 'reçu', 'recu', 'livraison', 'livré', 'livre',
  'commande confirmée', 'merci pour', 'parfait merci', 'reçu le', 'satisfait', 'recommande',
  'paid', 'payment', 'invoice', 'delivery', 'delivered', 'received', 'thanks for the', 'order confirmed',
];
const FRIENDLY_KEYWORDS = [
  'salut', 'coucou', 'ça va', 'ca va', 'cool', 'mdr', 'lol', 'haha', 'merci', 'bisous', 'à bientôt',
  'hey', 'hi', 'hello', 'thanks', 'nice', 'see you', 'how are you',
];

const STOPWORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'à', 'a', 'au', 'aux', 'en', 'dans',
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'que', 'qui', 'quoi', 'pas',
  'ne', 'pour', 'avec', 'sur', 'ce', 'cette', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son',
  'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with', 'is', 'are', 'you', 'i',
  'it', 'this', 'that', 'me', 'my', 'your', 'so', 'but', 'we', 'they', 'be', 'have',
]);

export class DMAnalyzer {
  /**
   * Score DM global (0-30), utilisé par ScoringEngine. Combine fréquence,
   * mots-clés/ton et réciprocité — purement côté extension.
   */
  calculateDMScore(conversation: Conversation): DMScoreBreakdown {
    const messages = conversation?.messages || [];
    if (messages.length === 0) {
      return { total: 0, frequency: 0, keywordsTone: 0, reciprocity: 0 };
    }

    const frequency = Math.min(Math.floor(messages.length / 3), 10);
    const keywordsTone = this.scoreKeywordsTone(conversation);

    const sent = messages.filter((m) => m.isSent).length;
    const received = messages.length - sent;
    // Réciprocité : conversation équilibrée + l'autre répond.
    const balance = sent > 0 && received > 0 ? Math.min(sent, received) / Math.max(sent, received) : 0;
    const reciprocity = Math.round(Math.min(received, 5) + balance * 5);

    const total = Math.min(30, frequency + keywordsTone + reciprocity);
    return { total, frequency, keywordsTone, reciprocity };
  }

  /** Score mots-clés + ton (0-10) — la part qualitative côté extension. */
  scoreKeywordsTone(conversation: Conversation): number {
    const text = this.joinText(conversation.messages).toLowerCase();
    if (!text) return 0;

    const prospectHits = this.countHits(text, PROSPECT_KEYWORDS);
    const clientHits = this.countHits(text, CLIENT_KEYWORDS);
    const friendlyHits = this.countHits(text, FRIENDLY_KEYWORDS);

    // Les signaux business pèsent plus lourd que le simple ton amical.
    const raw = clientHits * 3 + prospectHits * 2 + friendlyHits * 0.5;
    return Math.max(0, Math.min(10, Math.round(raw)));
  }

  /** Détermine la tonalité dominante de la conversation. */
  analyzeConversationTone(messages: ConversationMessage[]): { category: Category; score: number } {
    const text = this.joinText(messages).toLowerCase();
    const prospectHits = this.countHits(text, PROSPECT_KEYWORDS);
    const clientHits = this.countHits(text, CLIENT_KEYWORDS);
    const friendlyHits = this.countHits(text, FRIENDLY_KEYWORDS);

    if (clientHits >= 1 && clientHits >= prospectHits) {
      return { category: 'client', score: clientHits };
    }
    if (prospectHits >= 1) {
      return { category: 'prospect', score: prospectHits };
    }
    if (friendlyHits >= 2) {
      return { category: 'network', score: friendlyHits };
    }
    return { category: 'lead', score: 0 };
  }

  /** Mots-clés les plus fréquents (hors stopwords). */
  extractTopKeywords(conversation: Conversation, n: number = 5): string[] {
    const text = this.joinText(conversation.messages).toLowerCase();
    const words = text.match(/[a-zàâçéèêëîïôûùüÿñæœ0-9]{3,}/gi) || [];
    const freq = new Map<string, number>();
    for (const w of words) {
      if (STOPWORDS.has(w)) continue;
      freq.set(w, (freq.get(w) || 0) + 1);
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([w]) => w);
  }

  /** Détecte un changement de ton entre le début et la fin de la conversation. */
  detectToneChange(messages: ConversationMessage[]): { changed: boolean; from: Category; to: Category } {
    if (messages.length < 6) {
      const tone = this.analyzeConversationTone(messages).category;
      return { changed: false, from: tone, to: tone };
    }
    const third = Math.floor(messages.length / 3);
    const from = this.analyzeConversationTone(messages.slice(0, third)).category;
    const to = this.analyzeConversationTone(messages.slice(-third)).category;
    return { changed: from !== to, from, to };
  }

  // ==================== Helpers ====================

  private joinText(messages: ConversationMessage[]): string {
    return (messages || []).map((m) => m.text || '').join(' \n ');
  }

  private countHits(text: string, keywords: string[]): number {
    let count = 0;
    for (const kw of keywords) {
      // comptage des occurrences (simple includes répété)
      let idx = text.indexOf(kw);
      while (idx !== -1) {
        count++;
        idx = text.indexOf(kw, idx + kw.length);
      }
    }
    return count;
  }
}
