// Using Chrome API
async function loadSuggestions() {
    const loading = document.getElementById('loading');
    const content = document.getElementById('content');
    const emptyState = document.getElementById('empty-state');
    const suggestionsList = document.getElementById('suggestions-list');
    const countText = document.getElementById('count-text');
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_SUGGESTIONS' });
        loading.style.display = 'none';
        content.style.display = 'block';
        if (!response.success || !response.suggestions || response.suggestions.length === 0) {
            emptyState.style.display = 'block';
            suggestionsList.style.display = 'none';
            countText.textContent = '0 suggestion en attente';
            return;
        }
        const suggestions = response.suggestions;
        const pendingCount = suggestions.filter(s => s.status === 'pending').length;
        countText.textContent = `${pendingCount} suggestion${pendingCount > 1 ? 's' : ''} en attente`;
        suggestionsList.innerHTML = '';
        emptyState.style.display = 'none';
        suggestionsList.style.display = 'flex';
        suggestions.forEach(suggestion => {
            if (suggestion.status === 'pending') {
                const card = createSuggestionCard(suggestion);
                suggestionsList.appendChild(card);
            }
        });
    }
    catch (error) {
        console.error('Error loading suggestions:', error);
        loading.style.display = 'none';
        content.style.display = 'block';
        emptyState.style.display = 'block';
        suggestionsList.style.display = 'none';
    }
}
function createSuggestionCard(suggestion) {
    const card = document.createElement('div');
    card.className = 'suggestion-card';
    const emoji = getCategoryEmoji(suggestion.to_category);
    const evidence = parseEvidence(suggestion.evidence);
    card.innerHTML = `
    <div class="suggestion-header">
      <div class="username">${emoji} @${suggestion.contact_username}</div>
      <div class="score-badge">${suggestion.score}/100</div>
    </div>
    
    <div class="transition">
      <span class="category-badge category-${suggestion.from_category}">${suggestion.from_category}</span>
      <span class="transition-arrow">→</span>
      <span class="category-badge category-${suggestion.to_category}">${suggestion.to_category}</span>
    </div>
    
    <div class="reason">📝 ${suggestion.reason}</div>
    
    ${evidence.length > 0 ? `
      <div class="evidence">
        Preuves:
        ${evidence.map(e => `<div class="evidence-item">• ${e}</div>`).join('')}
      </div>
    ` : ''}
    
    <div class="actions">
      <button class="btn btn-accept" data-id="${suggestion.id}">✓ Accepter</button>
      <button class="btn btn-reject" data-id="${suggestion.id}">✗ Rejeter</button>
    </div>
  `;
    // Ajouter les event listeners
    const acceptBtn = card.querySelector('.btn-accept');
    const rejectBtn = card.querySelector('.btn-reject');
    acceptBtn.addEventListener('click', () => handleAccept(suggestion.id, card));
    rejectBtn.addEventListener('click', () => handleReject(suggestion.id, card));
    return card;
}
async function handleAccept(suggestionId, card) {
    try {
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';
        const response = await chrome.runtime.sendMessage({
            type: 'ACCEPT_SUGGESTION',
            suggestionId
        });
        if (response.success) {
            card.style.background = 'rgba(76, 175, 80, 0.3)';
            setTimeout(() => {
                card.remove();
                updateCount();
            }, 500);
        }
        else {
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
            alert('Erreur lors de l\'acceptation');
        }
    }
    catch (error) {
        console.error('Error accepting suggestion:', error);
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
        alert('Erreur lors de l\'acceptation');
    }
}
async function handleReject(suggestionId, card) {
    const reason = prompt('Raison du rejet (optionnel):');
    try {
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';
        const response = await chrome.runtime.sendMessage({
            type: 'REJECT_SUGGESTION',
            suggestionId,
            reason
        });
        if (response.success) {
            card.style.background = 'rgba(244, 67, 54, 0.3)';
            setTimeout(() => {
                card.remove();
                updateCount();
            }, 500);
        }
        else {
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
            alert('Erreur lors du rejet');
        }
    }
    catch (error) {
        console.error('Error rejecting suggestion:', error);
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
        alert('Erreur lors du rejet');
    }
}
function updateCount() {
    const suggestionsList = document.getElementById('suggestions-list');
    const emptyState = document.getElementById('empty-state');
    const countText = document.getElementById('count-text');
    const remainingCards = suggestionsList.querySelectorAll('.suggestion-card').length;
    countText.textContent = `${remainingCards} suggestion${remainingCards > 1 ? 's' : ''} en attente`;
    if (remainingCards === 0) {
        emptyState.style.display = 'block';
        suggestionsList.style.display = 'none';
    }
}
function getCategoryEmoji(category) {
    const emojis = {
        lead: '🆕',
        prospect: '📊',
        client: '🎉',
        network: '🤝'
    };
    return emojis[category] || '📋';
}
function parseEvidence(evidence) {
    try {
        const parsed = JSON.parse(evidence);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
// Event listeners
document.getElementById('back-btn')?.addEventListener('click', () => {
    window.location.href = 'index.html';
});
// Charger les suggestions au démarrage
loadSuggestions();
// Rafraîchir toutes les 30 secondes
setInterval(loadSuggestions, 30000);
