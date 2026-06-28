-- Tables pour la collecte des DMs Instagram
-- SQLite (waler.db)

-- Table des messages DMs
CREATE TABLE IF NOT EXISTS dm_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  conversation_with TEXT NOT NULL,
  message_id TEXT NOT NULL,
  
  -- Contenu du message
  message_text TEXT,
  media_urls TEXT DEFAULT '[]', -- JSON array
  
  -- Métadonnées
  is_sent BOOLEAN DEFAULT 0, -- true = envoyé par l'utilisateur, false = reçu
  is_read BOOLEAN DEFAULT 1,
  reactions TEXT DEFAULT '[]', -- JSON array
  
  -- Timestamps
  sent_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, message_id)
);

-- Table des métadonnées de conversations
CREATE TABLE IF NOT EXISTS dm_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  conversation_with TEXT NOT NULL,
  
  -- Informations du contact
  full_name TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT 0,
  
  -- Statistiques
  total_messages INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  last_message_at DATETIME,
  
  -- Métadonnées d'analyse
  avg_response_time_minutes INTEGER DEFAULT 0,
  conversation_initiator TEXT, -- 'user', 'contact', 'both'
  last_analyzed_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, conversation_with)
);

-- Table des statistiques de DMs par contact
CREATE TABLE IF NOT EXISTS dm_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  contact_username TEXT NOT NULL,
  
  -- Compteurs
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  
  -- Temps de réponse
  avg_response_time_sent_minutes INTEGER DEFAULT 0,
  avg_response_time_received_minutes INTEGER DEFAULT 0,
  
  -- Initiateur
  conversations_initiated_by_user INTEGER DEFAULT 0,
  conversations_initiated_by_contact INTEGER DEFAULT 0,
  
  -- Longueur moyenne
  avg_message_length_sent INTEGER DEFAULT 0,
  avg_message_length_received INTEGER DEFAULT 0,
  
  -- Dates
  first_message_at DATETIME,
  last_message_at DATETIME,
  last_calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, contact_username)
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_dm_messages_user ON dm_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation ON dm_messages(conversation_with);
CREATE INDEX IF NOT EXISTS idx_dm_messages_sent_at ON dm_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_messages_is_sent ON dm_messages(is_sent);

CREATE INDEX IF NOT EXISTS idx_dm_conversations_user ON dm_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_with ON dm_conversations(conversation_with);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_last_message ON dm_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_dm_stats_user ON dm_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_stats_contact ON dm_stats(contact_username);
CREATE INDEX IF NOT EXISTS idx_dm_stats_last_message ON dm_stats(last_message_at DESC);

-- Vue pour les conversations récentes
CREATE VIEW IF NOT EXISTS v_recent_conversations AS
SELECT 
  c.user_id,
  c.conversation_with,
  c.full_name,
  c.avatar_url,
  c.is_verified,
  c.total_messages,
  c.unread_count,
  c.last_message_at,
  s.avg_response_time_received_minutes,
  s.conversations_initiated_by_contact,
  (SELECT message_text FROM dm_messages 
   WHERE user_id = c.user_id 
   AND conversation_with = c.conversation_with 
   ORDER BY sent_at DESC LIMIT 1) as last_message_text,
  (SELECT is_sent FROM dm_messages 
   WHERE user_id = c.user_id 
   AND conversation_with = c.conversation_with 
   ORDER BY sent_at DESC LIMIT 1) as last_message_is_sent
FROM dm_conversations c
LEFT JOIN dm_stats s ON c.user_id = s.user_id AND c.conversation_with = s.contact_username
ORDER BY c.last_message_at DESC;

-- Vue pour les statistiques globales de DMs
CREATE VIEW IF NOT EXISTS v_dm_global_stats AS
SELECT 
  user_id,
  COUNT(DISTINCT conversation_with) as total_conversations,
  SUM(total_messages) as total_messages,
  SUM(messages_sent) as total_sent,
  SUM(messages_received) as total_received,
  AVG(avg_response_time_received_minutes) as avg_response_time,
  MAX(last_message_at) as last_activity
FROM dm_stats
GROUP BY user_id;
