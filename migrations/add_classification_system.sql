-- Migration: Système de classification intelligente
-- Ajoute les tables pour le scoring et la classification automatique des contacts

-- Table des scores de contacts
CREATE TABLE IF NOT EXISTS contact_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_username VARCHAR(255) NOT NULL,
  
  -- Scores détaillés (0-100)
  dm_score INTEGER DEFAULT 0 CHECK(dm_score >= 0 AND dm_score <= 30),
  engagement_score INTEGER DEFAULT 0 CHECK(engagement_score >= 0 AND engagement_score <= 25),
  activity_score INTEGER DEFAULT 0 CHECK(activity_score >= 0 AND activity_score <= 20),
  seniority_score INTEGER DEFAULT 0 CHECK(seniority_score >= 0 AND seniority_score <= 10),
  reciprocity_score INTEGER DEFAULT 0 CHECK(reciprocity_score >= 0 AND reciprocity_score <= 15),
  total_score INTEGER DEFAULT 0 CHECK(total_score >= 0 AND total_score <= 100),
  
  -- Catégories
  current_category VARCHAR(50) DEFAULT 'lead' CHECK(current_category IN ('lead', 'prospect', 'client', 'network')),
  suggested_category VARCHAR(50) CHECK(suggested_category IN ('lead', 'prospect', 'client', 'network')),
  
  -- Métadonnées
  last_calculated_at TIMESTAMP DEFAULT NOW(),
  score_history JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, contact_username)
);

-- Table des suggestions de classification
CREATE TABLE IF NOT EXISTS classification_suggestions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_username VARCHAR(255) NOT NULL,
  
  -- Transition
  from_category VARCHAR(50) NOT NULL CHECK(from_category IN ('lead', 'prospect', 'client', 'network')),
  to_category VARCHAR(50) NOT NULL CHECK(to_category IN ('lead', 'prospect', 'client', 'network')),
  
  -- Justification
  score INTEGER NOT NULL,
  confidence REAL NOT NULL CHECK(confidence >= 0 AND confidence <= 1),
  reason TEXT NOT NULL,
  evidence JSONB DEFAULT '[]'::jsonb,
  
  -- Statut
  status VARCHAR(50) DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
  validated_at TIMESTAMP,
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table de l'historique des classifications
CREATE TABLE IF NOT EXISTS classification_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_username VARCHAR(255) NOT NULL,
  
  -- Changement
  from_category VARCHAR(50) CHECK(from_category IN ('lead', 'prospect', 'client', 'network')),
  to_category VARCHAR(50) NOT NULL CHECK(to_category IN ('lead', 'prospect', 'client', 'network')),
  
  -- Contexte
  score_at_transition INTEGER,
  trigger_type VARCHAR(50) NOT NULL CHECK(trigger_type IN ('manual', 'auto_accepted', 'dm_analysis', 'score_threshold', 'tone_change')),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Mise à jour de circle_members pour ajouter les nouveaux champs
ALTER TABLE circle_members 
  ADD COLUMN IF NOT EXISTS category_v2 VARCHAR(50) 
  CHECK(category_v2 IN ('lead', 'prospect', 'client', 'network'));

ALTER TABLE circle_members 
  ADD COLUMN IF NOT EXISTS classification_score INTEGER DEFAULT 0 
  CHECK(classification_score >= 0 AND classification_score <= 100);

ALTER TABLE circle_members 
  ADD COLUMN IF NOT EXISTS last_score_update TIMESTAMP;

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

CREATE INDEX IF NOT EXISTS idx_circle_members_category_v2 ON circle_members(category_v2);
CREATE INDEX IF NOT EXISTS idx_circle_members_score ON circle_members(classification_score DESC);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_contact_scores_updated_at ON contact_scores;
CREATE TRIGGER update_contact_scores_updated_at
    BEFORE UPDATE ON contact_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classification_suggestions_updated_at ON classification_suggestions;
CREATE TRIGGER update_classification_suggestions_updated_at
    BEFORE UPDATE ON classification_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vues utiles pour analytics

-- Vue des contacts avec leur score actuel
CREATE OR REPLACE VIEW v_contact_scores_summary AS
SELECT 
  cs.user_id,
  cs.contact_username,
  cs.current_category,
  cs.suggested_category,
  cs.total_score,
  cs.dm_score,
  cs.engagement_score,
  cs.activity_score,
  cs.seniority_score,
  cs.reciprocity_score,
  cs.last_calculated_at,
  CASE 
    WHEN cs.suggested_category IS NOT NULL AND cs.suggested_category != cs.current_category 
    THEN TRUE 
    ELSE FALSE 
  END as has_pending_transition
FROM contact_scores cs;

-- Vue des suggestions en attente
CREATE OR REPLACE VIEW v_pending_suggestions AS
SELECT 
  s.id,
  s.user_id,
  s.contact_username,
  s.from_category,
  s.to_category,
  s.score,
  s.confidence,
  s.reason,
  s.evidence,
  s.created_at,
  cs.total_score as current_score
FROM classification_suggestions s
LEFT JOIN contact_scores cs ON s.user_id = cs.user_id AND s.contact_username = cs.contact_username
WHERE s.status = 'pending'
ORDER BY s.created_at DESC;

-- Vue de l'historique des transitions
CREATE OR REPLACE VIEW v_classification_timeline AS
SELECT 
  h.id,
  h.user_id,
  h.contact_username,
  h.from_category,
  h.to_category,
  h.score_at_transition,
  h.trigger_type,
  h.notes,
  h.created_at,
  u.username as user_username
FROM classification_history h
JOIN users u ON h.user_id = u.id
ORDER BY h.created_at DESC;

COMMENT ON TABLE contact_scores IS 'Scores de classification pour chaque contact';
COMMENT ON TABLE classification_suggestions IS 'Suggestions de changement de catégorie en attente de validation';
COMMENT ON TABLE classification_history IS 'Historique complet de toutes les transitions de catégorie';
COMMENT ON COLUMN contact_scores.dm_score IS 'Score basé sur l''analyse des DMs (0-30)';
COMMENT ON COLUMN contact_scores.engagement_score IS 'Score basé sur l''engagement (likes, comments, etc.) (0-25)';
COMMENT ON COLUMN contact_scores.activity_score IS 'Score basé sur l''activité (visites, temps passé, etc.) (0-20)';
COMMENT ON COLUMN contact_scores.seniority_score IS 'Score basé sur l''ancienneté de la relation (0-10)';
COMMENT ON COLUMN contact_scores.reciprocity_score IS 'Score basé sur la réciprocité (follow back, engagement mutuel, etc.) (0-15)';
