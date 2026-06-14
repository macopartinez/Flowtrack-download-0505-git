-- Tables pour le système de surveillance différenciée

-- Table de configuration de surveillance par contact
CREATE TABLE IF NOT EXISTS surveillance_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  contact_username TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('client', 'prospect', 'network', 'lead')),
  check_interval INTEGER NOT NULL, -- En minutes
  priority INTEGER NOT NULL CHECK(priority BETWEEN 1 AND 4),
  is_active BOOLEAN DEFAULT 1,
  last_check_at DATETIME,
  next_check_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, contact_username),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_surveillance_config_user ON surveillance_config(user_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_config_category ON surveillance_config(category);
CREATE INDEX IF NOT EXISTS idx_surveillance_config_next_check ON surveillance_config(next_check_at);
CREATE INDEX IF NOT EXISTS idx_surveillance_config_active ON surveillance_config(is_active);

-- Table d'historique de surveillance
CREATE TABLE IF NOT EXISTS surveillance_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  contact_username TEXT NOT NULL,
  category TEXT NOT NULL,
  check_type TEXT NOT NULL, -- 'scheduled', 'manual', 'triggered'
  status TEXT NOT NULL CHECK(status IN ('success', 'failed', 'skipped')),
  changes_detected INTEGER DEFAULT 0,
  details TEXT, -- JSON avec les changements détectés
  duration_ms INTEGER, -- Durée de la vérification en ms
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour l'historique
CREATE INDEX IF NOT EXISTS idx_surveillance_history_user ON surveillance_history(user_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_history_contact ON surveillance_history(contact_username);
CREATE INDEX IF NOT EXISTS idx_surveillance_history_date ON surveillance_history(checked_at);

-- Table des alertes de surveillance
CREATE TABLE IF NOT EXISTS surveillance_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  contact_username TEXT NOT NULL,
  category TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'high_activity', 'engagement_spike', 'conversion_ready', etc.
  severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  details TEXT, -- JSON avec détails
  is_read BOOLEAN DEFAULT 0,
  is_dismissed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour les alertes
CREATE INDEX IF NOT EXISTS idx_surveillance_alerts_user ON surveillance_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_alerts_unread ON surveillance_alerts(is_read) WHERE is_read = 0;
CREATE INDEX IF NOT EXISTS idx_surveillance_alerts_severity ON surveillance_alerts(severity);

-- Table des métriques de surveillance
CREATE TABLE IF NOT EXISTS surveillance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  contact_username TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'followers', 'posts', 'engagement', 'dm_activity', etc.
  value REAL NOT NULL,
  previous_value REAL,
  change_percentage REAL,
  measured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour les métriques
CREATE INDEX IF NOT EXISTS idx_surveillance_metrics_user ON surveillance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_metrics_contact ON surveillance_metrics(contact_username);
CREATE INDEX IF NOT EXISTS idx_surveillance_metrics_type ON surveillance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_surveillance_metrics_date ON surveillance_metrics(measured_at);

-- Vue pour les contacts à vérifier maintenant
CREATE VIEW IF NOT EXISTS v_contacts_to_check AS
SELECT 
  sc.user_id,
  sc.contact_username,
  sc.category,
  sc.priority,
  sc.check_interval,
  sc.last_check_at,
  sc.next_check_at,
  cs.total_score,
  cs.current_category,
  CASE 
    WHEN sc.next_check_at IS NULL THEN 1
    WHEN datetime(sc.next_check_at) <= datetime('now') THEN 1
    ELSE 0
  END as should_check_now
FROM surveillance_config sc
LEFT JOIN contact_scores cs ON sc.user_id = cs.user_id AND sc.contact_username = cs.contact_username
WHERE sc.is_active = 1
ORDER BY sc.priority ASC, sc.next_check_at ASC;

-- Vue pour les statistiques de surveillance par catégorie
CREATE VIEW IF NOT EXISTS v_surveillance_stats_by_category AS
SELECT 
  user_id,
  category,
  COUNT(*) as total_contacts,
  SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_contacts,
  AVG(check_interval) as avg_interval,
  MIN(last_check_at) as oldest_check,
  MAX(last_check_at) as newest_check
FROM surveillance_config
GROUP BY user_id, category;

-- Vue pour les alertes non lues
CREATE VIEW IF NOT EXISTS v_unread_alerts AS
SELECT 
  sa.*,
  sc.category,
  sc.priority,
  cs.total_score
FROM surveillance_alerts sa
LEFT JOIN surveillance_config sc ON sa.user_id = sc.user_id AND sa.contact_username = sc.contact_username
LEFT JOIN contact_scores cs ON sa.user_id = cs.user_id AND sa.contact_username = cs.contact_username
WHERE sa.is_read = 0 AND sa.is_dismissed = 0
ORDER BY 
  CASE sa.severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  sa.created_at DESC;

-- Vue pour l'historique récent avec tendances
CREATE VIEW IF NOT EXISTS v_surveillance_trends AS
SELECT 
  user_id,
  contact_username,
  category,
  COUNT(*) as total_checks,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_checks,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_checks,
  SUM(changes_detected) as total_changes,
  AVG(duration_ms) as avg_duration_ms,
  MAX(checked_at) as last_checked_at
FROM surveillance_history
WHERE checked_at >= datetime('now', '-7 days')
GROUP BY user_id, contact_username, category;

-- Trigger pour mettre à jour next_check_at après une vérification
CREATE TRIGGER IF NOT EXISTS update_next_check_after_surveillance
AFTER INSERT ON surveillance_history
WHEN NEW.status = 'success'
BEGIN
  UPDATE surveillance_config
  SET 
    last_check_at = NEW.checked_at,
    next_check_at = datetime(NEW.checked_at, '+' || check_interval || ' minutes'),
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = NEW.user_id AND contact_username = NEW.contact_username;
END;

-- Trigger pour créer une alerte si trop de changements détectés
CREATE TRIGGER IF NOT EXISTS create_alert_on_high_activity
AFTER INSERT ON surveillance_history
WHEN NEW.changes_detected >= 10
BEGIN
  INSERT INTO surveillance_alerts (
    user_id,
    contact_username,
    category,
    alert_type,
    severity,
    message,
    details
  )
  VALUES (
    NEW.user_id,
    NEW.contact_username,
    NEW.category,
    'high_activity',
    'high',
    'Activité inhabituelle détectée pour @' || NEW.contact_username,
    json_object('changes', NEW.changes_detected, 'details', NEW.details)
  );
END;

-- Trigger pour synchroniser la catégorie avec contact_scores
CREATE TRIGGER IF NOT EXISTS sync_category_on_classification_change
AFTER UPDATE OF current_category ON contact_scores
BEGIN
  UPDATE surveillance_config
  SET 
    category = NEW.current_category,
    check_interval = CASE NEW.current_category
      WHEN 'client' THEN 15
      WHEN 'prospect' THEN 60
      WHEN 'network' THEN 240
      WHEN 'lead' THEN 1440
    END,
    priority = CASE NEW.current_category
      WHEN 'client' THEN 1
      WHEN 'prospect' THEN 2
      WHEN 'network' THEN 3
      WHEN 'lead' THEN 4
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = NEW.user_id AND contact_username = NEW.contact_username;
END;
