-- Extension du schéma pour les agents Pro
-- Ajout des tables pour surveillance avancée du cercle (people)
-- NB: Les tables « Clients » de coaching (client_advanced_metrics, client_posts)
-- ont été extraites du projet. Voir _archive-clients/server/clients-schema.sql.

-- Table pour les cercles/prospects (people)
CREATE TABLE IF NOT EXISTS circle_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    member_username TEXT NOT NULL,
    member_user_id TEXT,
    full_name TEXT,
    profile_pic_url TEXT,
    category TEXT CHECK(category IN ('cercle', 'prospect')) DEFAULT 'prospect',
    
    -- Statut de connexion
    is_online BOOLEAN DEFAULT 0,
    last_seen_at DATETIME,
    connection_duration_minutes INTEGER DEFAULT 0,
    
    -- Statistiques de likes
    total_likes_given INTEGER DEFAULT 0,
    total_likes_received INTEGER DEFAULT 0,
    last_like_given_at DATETIME,
    last_like_received_at DATETIME,
    consecutive_likes_streak INTEGER DEFAULT 0,
    days_since_first_like INTEGER DEFAULT 0,
    
    -- Connexions mutuelles
    mutual_followers_count INTEGER DEFAULT 0,
    mutual_following_list TEXT, -- JSON array of usernames
    
    -- Score et signaux
    relationship_score INTEGER DEFAULT 0, -- 0-100
    detected_signals TEXT, -- JSON array of signals
    
    -- Timeline
    timeline_events TEXT, -- JSON array of events
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, member_username)
);

-- Table pour les posts likés (tracking des likes)
CREATE TABLE IF NOT EXISTS liked_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    circle_member_id INTEGER NOT NULL,
    post_id TEXT NOT NULL,
    post_url TEXT,
    post_owner_username TEXT,
    liked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (circle_member_id) REFERENCES circle_members(id) ON DELETE CASCADE,
    UNIQUE(circle_member_id, post_id)
);

-- Table pour les événements de timeline
CREATE TABLE IF NOT EXISTS timeline_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    circle_member_id INTEGER NOT NULL,
    event_type TEXT NOT NULL CHECK(event_type IN (
        'follow', 'unfollow', 'follow_back', 'unfollow_refollow',
        'like_post', 'unlike_post', 'comment', 'story_view',
        'dm_sent', 'dm_received'
    )),
    event_data TEXT, -- JSON with event details
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (circle_member_id) REFERENCES circle_members(id) ON DELETE CASCADE
);

-- Table pour les signaux détectés
CREATE TABLE IF NOT EXISTS detected_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    circle_member_id INTEGER NOT NULL,
    signal_type TEXT NOT NULL CHECK(signal_type IN (
        'high_engagement', 'low_engagement', 'ghost', 'stalker',
        'consistent_liker', 'story_viewer', 'quick_responder',
        'mutual_interest', 'potential_unfollow', 'reconnection'
    )),
    signal_strength INTEGER DEFAULT 0, -- 0-100
    signal_data TEXT, -- JSON with signal details
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (circle_member_id) REFERENCES circle_members(id) ON DELETE CASCADE
);

-- Table pour les connexions mutuelles (comptes en commun)
CREATE TABLE IF NOT EXISTS mutual_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    circle_member_id INTEGER NOT NULL,
    mutual_username TEXT NOT NULL,
    mutual_user_id TEXT,
    connection_type TEXT CHECK(connection_type IN ('follower', 'following', 'both')),
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (circle_member_id) REFERENCES circle_members(id) ON DELETE CASCADE,
    UNIQUE(circle_member_id, mutual_username)
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_circle_members_user ON circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_category ON circle_members(category);
CREATE INDEX IF NOT EXISTS idx_circle_members_score ON circle_members(relationship_score);
CREATE INDEX IF NOT EXISTS idx_liked_posts_member ON liked_posts(circle_member_id);
CREATE INDEX IF NOT EXISTS idx_liked_posts_date ON liked_posts(liked_at);
CREATE INDEX IF NOT EXISTS idx_timeline_events_member ON timeline_events(circle_member_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_type ON timeline_events(event_type);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON timeline_events(detected_at);
CREATE INDEX IF NOT EXISTS idx_detected_signals_member ON detected_signals(circle_member_id);
CREATE INDEX IF NOT EXISTS idx_detected_signals_type ON detected_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_mutual_connections_member ON mutual_connections(circle_member_id);
