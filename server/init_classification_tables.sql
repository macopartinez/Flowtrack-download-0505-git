-- Initialisation des tables pour le système de classification intelligente
-- Pour SQLite (waler.db)

-- Table des scores de contacts
CREATE TABLE IF NOT EXISTS contact_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  contact_username TEXT NOT NULL,
  
  -- Scores détaillés (0-100)
  dm_score INTEGER DEFAULT 0 CHECK(dm_score >= 0 AND dm_score <= 30),
  engagement_score INTEGER DEFAULT 0 CHECK(engagement_score >= 0 AND engagement_score <= 25),
  activity_score INTEGER DEFAULT 0 CHECK(activity_score >= 0 AND activity_score <= 20),
  seniority_score INTEGER DEFAULT 0 CHECK(seniority_score >= 0 AND seniority_score <= 10),
  reciprocity_score INTEGER DEFAULT 0 CHECK(reciprocity_score >= 0 AND reciprocity_score <= 15),
  total_score INTEGER DEFAULT 0 CHECK(total_score >= 0 AND total_score <= 100),
  
  -- Catégories
  current_category TEXT DEFAULT 'lead' CHECK(current_category IN ('lead', 'prospect', 'client', 'network')),
  suggested_category TEXT CHECK(suggested_category IN ('lead', 'prospect', 'client', 'network')),

  -- Axe « température » (dynamique de conversation, indépendant de l'intention)
  temperature TEXT CHECK(temperature IN ('hot', 'warm', 'cold')),
  dynamics TEXT,   -- JSON : métriques de responsiveness (temps de réponse, taux…)
  advice TEXT,     -- JSON : conseils d'action (dynamique relationnelle) générés
  setting_phase TEXT CHECK(setting_phase IN ('connexion', 'situation', 'probleme', 'transition')),
  setting_summary TEXT,  -- JSON : synthèse setting (prochaine étape, révélé, manquant, faits)

  -- Métadonnées
  last_calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  score_history TEXT DEFAULT '[]',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, contact_username)
);

-- Table des suggestions de classification
CREATE TABLE IF NOT EXISTS classification_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  contact_username TEXT NOT NULL,
  
  -- Transition
  from_category TEXT NOT NULL CHECK(from_category IN ('lead', 'prospect', 'client', 'network')),
  to_category TEXT NOT NULL CHECK(to_category IN ('lead', 'prospect', 'client', 'network')),
  
  -- Justification
  score INTEGER NOT NULL,
  confidence REAL NOT NULL CHECK(confidence >= 0 AND confidence <= 1),
  reason TEXT NOT NULL,
  evidence TEXT DEFAULT '[]',
  
  -- Statut
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
  validated_at DATETIME,
  rejection_reason TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table de l'historique des classifications
CREATE TABLE IF NOT EXISTS classification_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  contact_username TEXT NOT NULL,
  
  -- Changement
  from_category TEXT CHECK(from_category IN ('lead', 'prospect', 'client', 'network')),
  to_category TEXT NOT NULL CHECK(to_category IN ('lead', 'prospect', 'client', 'network')),
  
  -- Contexte
  score_at_transition INTEGER,
  trigger_type TEXT NOT NULL CHECK(trigger_type IN ('manual', 'auto_accepted', 'dm_analysis', 'score_threshold', 'tone_change')),
  notes TEXT,
  metadata TEXT DEFAULT '{}',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_contact_scores_user ON contact_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_scores_username ON contact_scores(contact_username);
CREATE INDEX IF NOT EXISTS idx_contact_scores_category ON contact_scores(current_category);
CREATE INDEX IF NOT EXISTS idx_contact_scores_score ON contact_scores(total_score DESC);

CREATE INDEX IF NOT EXISTS idx_classification_suggestions_user ON classification_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_classification_suggestions_status ON classification_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_classification_suggestions_created ON classification_suggestions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_classification_history_user ON classification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_classification_history_username ON classification_history(contact_username);
CREATE INDEX IF NOT EXISTS idx_classification_history_created ON classification_history(created_at DESC);
