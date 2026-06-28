-- Waler Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    platform TEXT NOT NULL CHECK(platform IN ('instagram', 'facebook')),
    usage_mode TEXT NOT NULL DEFAULT 'personal' CHECK(usage_mode IN ('personal', 'professional')),
    subscription_tier TEXT CHECK(subscription_tier IN ('premium', 'pro')),
    subscription_status TEXT CHECK(subscription_status IN ('active', 'trialing', 'cancelled', 'expired')),
    trial_ends_at DATETIME,
    subscription_ends_at DATETIME,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Questionnaire responses table
CREATE TABLE IF NOT EXISTS questionnaire_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    answers TEXT NOT NULL, -- JSON
    ai_insights TEXT, -- JSON - cached AI analysis
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- NB: Les tables « Clients » de coaching (clients, client_metrics, milestones)
-- ont été extraites du projet. Voir _archive-clients/server/clients-schema.sql.

-- User stats table (for personal dashboard)
CREATE TABLE IF NOT EXISTS user_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_followers INTEGER DEFAULT 0,
    total_following INTEGER DEFAULT 0,
    total_unfollowers INTEGER DEFAULT 0,
    total_blockers INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Followers/Unfollowers/Blockers tracking
CREATE TABLE IF NOT EXISTS account_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    account_username TEXT NOT NULL,
    change_type TEXT NOT NULL CHECK(change_type IN ('follower', 'unfollower', 'blocker')),
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Prospects table (Agent Prospects - New followers analysis)
CREATE TABLE IF NOT EXISTS prospects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    prospect_username TEXT NOT NULL,
    prospect_user_id TEXT,
    full_name TEXT,
    bio TEXT,
    profile_pic_url TEXT,
    followers_count INTEGER,
    following_count INTEGER,
    posts_count INTEGER,
    is_verified BOOLEAN DEFAULT 0,
    is_private BOOLEAN DEFAULT 0,
    mutual_followers_count INTEGER DEFAULT 0,
    relevance_score INTEGER DEFAULT 0, -- 0-100
    relationship_context TEXT, -- JSON: {type, reason, suggestions}
    is_viewed BOOLEAN DEFAULT 0,
    is_archived BOOLEAN DEFAULT 0,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    analyzed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Prospect interactions (for quality analysis)
CREATE TABLE IF NOT EXISTS prospect_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prospect_id INTEGER NOT NULL,
    interaction_type TEXT NOT NULL CHECK(interaction_type IN ('like', 'comment', 'story_view', 'dm')),
    interaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE
);

-- Connections table (Agent Connections - Relationship quality analysis)
CREATE TABLE IF NOT EXISTS connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    connection_username TEXT NOT NULL,
    connection_user_id TEXT,
    full_name TEXT,
    bio TEXT,
    profile_pic_url TEXT,
    followers_count INTEGER,
    following_count INTEGER,
    posts_count INTEGER,
    is_verified BOOLEAN DEFAULT 0,
    is_private BOOLEAN DEFAULT 0,
    is_following_me BOOLEAN DEFAULT 0,
    am_i_following BOOLEAN DEFAULT 0,
    mutual_followers_count INTEGER DEFAULT 0,
    relationship_type TEXT CHECK(relationship_type IN ('mutual', 'follower_only', 'following_only', 'ghost')),
    quality_score INTEGER DEFAULT 0, -- 0-100
    engagement_score INTEGER DEFAULT 0, -- 0-100
    last_interaction_date DATETIME,
    interaction_count INTEGER DEFAULT 0,
    relationship_context TEXT, -- JSON: {type, strength, suggestions}
    is_archived BOOLEAN DEFAULT 0,
    first_detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_analyzed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, connection_username)
);

-- Connection interactions (for engagement tracking)
CREATE TABLE IF NOT EXISTS connection_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id INTEGER NOT NULL,
    interaction_type TEXT NOT NULL CHECK(interaction_type IN ('like', 'comment', 'story_view', 'dm', 'mention', 'tag')),
    interaction_direction TEXT NOT NULL CHECK(interaction_direction IN ('received', 'sent')),
    post_url TEXT,
    interaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_account_changes_user ON account_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_account_changes_type ON account_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_prospects_user ON prospects(user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_viewed ON prospects(is_viewed);
CREATE INDEX IF NOT EXISTS idx_prospects_score ON prospects(relevance_score);
CREATE INDEX IF NOT EXISTS idx_prospect_interactions ON prospect_interactions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_connections_user ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_type ON connections(relationship_type);
CREATE INDEX IF NOT EXISTS idx_connections_quality ON connections(quality_score);
CREATE INDEX IF NOT EXISTS idx_connections_engagement ON connections(engagement_score);
CREATE INDEX IF NOT EXISTS idx_connection_interactions ON connection_interactions(connection_id);
