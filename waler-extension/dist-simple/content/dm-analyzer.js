/**
 * Analyseur de DMs Instagram pour classification automatique
 * Détecte les mots-clés et analyse le contexte des conversations
 */
export class DMAnalyzer {
    constructor() {
        this.keywords = {
            client: [
                // Français
                'merci', 'résultat', 'progrès', 'coaching', 'séance',
                'paiement', 'facture', 'abonnement', 'programme', 'suivi',
                'transformation', 'objectif atteint', 'super séance',
                // Anglais
                'thank you', 'thanks', 'result', 'progress', 'session',
                'payment', 'invoice', 'subscription', 'program', 'follow-up'
            ],
            prospect: [
                // Français
                'intéressé', 'intéressée', 'prix', 'tarif', 'coût', 'combien',
                'comment ça marche', 'info', 'information', 'disponibilité',
                'rdv', 'rendez-vous', 'appel', 'découverte', 'essai',
                'gratuit', 'offre', 'package', 'formule',
                // Anglais
                'interested', 'price', 'cost', 'how much', 'how does it work',
                'info', 'information', 'availability', 'appointment', 'call',
                'trial', 'free', 'offer', 'package'
            ],
            network: [
                // Français
                'salut', 'coucou', 'comment vas-tu', 'comment ça va',
                'super', 'cool', 'génial', 'bravo', 'félicitations',
                'j\'aime', 'j\'adore', 'top', 'merci pour', 'sympa',
                // Anglais
                'hi', 'hello', 'hey', 'how are you', 'great', 'awesome',
                'congrats', 'congratulations', 'love it', 'nice', 'cool'
            ]
        };
    }
    /**
     * Analyse un message et détecte la catégorie
     */
    analyzeMessage(message) {
        const lowerMessage = message.toLowerCase();
        const detectedKeywords = [];
        // Détecter les mots-clés pour chaque catégorie
        for (const [category, keywords] of Object.entries(this.keywords)) {
            for (const keyword of keywords) {
                if (lowerMessage.includes(keyword.toLowerCase())) {
                    detectedKeywords.push({
                        category: category,
                        keyword
                    });
                }
            }
        }
        // Compter les occurrences par catégorie
        const categoryCounts = {
            client: 0,
            prospect: 0,
            network: 0,
            lead: 0
        };
        detectedKeywords.forEach(({ category }) => {
            categoryCounts[category]++;
        });
        // Déterminer la catégorie dominante
        let dominantCategory = 'lead';
        let maxCount = 0;
        for (const [category, count] of Object.entries(categoryCounts)) {
            if (count > maxCount) {
                maxCount = count;
                dominantCategory = category;
            }
        }
        // Calculer la confiance (0-1)
        const totalKeywords = detectedKeywords.length;
        const confidence = totalKeywords > 0
            ? Math.min(maxCount / totalKeywords, 1)
            : 0;
        // Score basé sur le nombre de mots-clés (max 10 points)
        const keywordScore = Math.min(totalKeywords * 2, 10);
        return {
            category: dominantCategory,
            confidence,
            keywords: detectedKeywords.map(k => k.keyword),
            score: keywordScore
        };
    }
    /**
     * Calcule le score DMs complet pour une conversation
     */
    calculateDMScore(conversation) {
        const { messages } = conversation;
        if (messages.length === 0) {
            return {
                keywordMatch: 0,
                messageFrequency: 0,
                responseTime: 0,
                conversationInitiator: 0,
                messageLength: 0,
                total: 0
            };
        }
        // 1. Score mots-clés (0-10 points)
        let totalKeywordScore = 0;
        let keywordCount = 0;
        messages.forEach(msg => {
            const analysis = this.analyzeMessage(msg.text);
            totalKeywordScore += analysis.score;
            keywordCount += analysis.keywords.length;
        });
        const keywordMatch = Math.min(Math.round(totalKeywordScore / Math.max(messages.length, 1)), 10);
        // 2. Score fréquence (0-5 points)
        // Plus de messages = meilleur score
        const messageFrequency = Math.min(Math.floor(messages.length / 5), // 1 point par 5 messages
        5);
        // 3. Score temps de réponse (0-5 points)
        // Calculer le temps de réponse moyen
        let totalResponseTime = 0;
        let responseCount = 0;
        for (let i = 1; i < messages.length; i++) {
            const current = messages[i];
            const previous = messages[i - 1];
            // Si c'est une réponse (changement de direction)
            if (current.isSent !== previous.isSent) {
                const timeDiff = current.timestamp - previous.timestamp;
                totalResponseTime += timeDiff;
                responseCount++;
            }
        }
        const avgResponseTime = responseCount > 0
            ? totalResponseTime / responseCount
            : 0;
        // Convertir en score (réponse rapide = meilleur score)
        // < 1h = 5 pts, < 6h = 4 pts, < 24h = 3 pts, < 48h = 2 pts, > 48h = 1 pt
        const oneHour = 60 * 60 * 1000;
        let responseTime = 0;
        if (avgResponseTime < oneHour)
            responseTime = 5;
        else if (avgResponseTime < 6 * oneHour)
            responseTime = 4;
        else if (avgResponseTime < 24 * oneHour)
            responseTime = 3;
        else if (avgResponseTime < 48 * oneHour)
            responseTime = 2;
        else
            responseTime = 1;
        // 4. Score initiateur (0-5 points)
        // Qui initie la conversation le plus souvent
        const receivedFirst = messages.filter((msg, i) => {
            if (i === 0)
                return !msg.isSent;
            const prev = messages[i - 1];
            return !msg.isSent && msg.timestamp - prev.timestamp > 6 * oneHour;
        }).length;
        const conversationInitiator = Math.min(Math.floor(receivedFirst / 2), // 1 point par 2 initiations
        5);
        // 5. Score longueur (0-5 points)
        // Messages plus longs = plus d'engagement
        const avgLength = messages.reduce((sum, msg) => sum + msg.text.length, 0) / messages.length;
        let messageLength = 0;
        if (avgLength > 200)
            messageLength = 5;
        else if (avgLength > 100)
            messageLength = 4;
        else if (avgLength > 50)
            messageLength = 3;
        else if (avgLength > 20)
            messageLength = 2;
        else
            messageLength = 1;
        const total = keywordMatch + messageFrequency + responseTime + conversationInitiator + messageLength;
        return {
            keywordMatch,
            messageFrequency,
            responseTime,
            conversationInitiator,
            messageLength,
            total
        };
    }
    /**
     * Détecte un changement de ton dans l'historique des messages
     */
    detectToneChange(history) {
        if (history.length < 10) {
            return { changed: false, from: 'lead', to: 'lead', confidence: 0 };
        }
        // Diviser l'historique en deux parties
        const midpoint = Math.floor(history.length / 2);
        const oldMessages = history.slice(0, midpoint);
        const recentMessages = history.slice(midpoint);
        // Analyser chaque partie
        const oldAnalysis = this.analyzeConversationTone(oldMessages);
        const recentAnalysis = this.analyzeConversationTone(recentMessages);
        // Détecter le changement
        const changed = oldAnalysis.category !== recentAnalysis.category;
        const confidence = changed
            ? Math.min(oldAnalysis.confidence, recentAnalysis.confidence)
            : 0;
        return {
            changed,
            from: oldAnalysis.category,
            to: recentAnalysis.category,
            confidence
        };
    }
    /**
     * Analyse le ton général d'une série de messages
     */
    analyzeConversationTone(messages) {
        const categoryCounts = {
            client: 0,
            prospect: 0,
            network: 0,
            lead: 0
        };
        messages.forEach(msg => {
            const analysis = this.analyzeMessage(msg.text);
            if (analysis.keywords.length > 0) {
                categoryCounts[analysis.category]++;
            }
        });
        let dominantCategory = 'lead';
        let maxCount = 0;
        let totalCount = 0;
        for (const [category, count] of Object.entries(categoryCounts)) {
            totalCount += count;
            if (count > maxCount) {
                maxCount = count;
                dominantCategory = category;
            }
        }
        const confidence = totalCount > 0 ? maxCount / totalCount : 0;
        return { category: dominantCategory, confidence };
    }
    /**
     * Extrait les mots-clés les plus pertinents d'une conversation
     */
    extractTopKeywords(conversation, limit = 5) {
        const keywordFrequency = new Map();
        conversation.messages.forEach(msg => {
            const analysis = this.analyzeMessage(msg.text);
            analysis.keywords.forEach(keyword => {
                keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
            });
        });
        // Trier par fréquence et retourner les top N
        return Array.from(keywordFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([keyword]) => keyword);
    }
}
