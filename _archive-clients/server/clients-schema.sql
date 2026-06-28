-- =============================================================================
-- Schéma SQL de la fonctionnalité « Clients » (coaching) — extrait de Waler
-- =============================================================================
-- Tables liées à la gestion des clients de coaching du Mode Pro.
-- Extraites de server/init_db.sql et migrations/add_pro_agent_tables.sql.
-- Réutilisables telles quelles dans un autre projet (SQLite / better-sqlite3).
-- =============================================================================

-- Clients (un coach gère plusieurs clients)
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coach_user_id INTEGER NOT NULL,
    instagram_username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    tags TEXT, -- JSON array
    notes TEXT,
    initial_goal TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Métriques historiques d'un client (followers / following dans le temps)
CREATE TABLE IF NOT EXISTS client_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    followers_count INTEGER NOT NULL,
    following_count INTEGER NOT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Objectifs / jalons d'un client
CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Métriques avancées d'un client (posts, vues, engagement)
CREATE TABLE IF NOT EXISTS client_advanced_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    posts_count INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    average_views_per_post INTEGER DEFAULT 0,
    engagement_rate REAL DEFAULT 0.0,
    last_post_date DATETIME,
    posts_this_day INTEGER DEFAULT 0,
    posts_this_week INTEGER DEFAULT 0,
    posts_this_month INTEGER DEFAULT 0,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Posts d'un client (tracking détaillé)
CREATE TABLE IF NOT EXISTS client_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    post_id TEXT NOT NULL,
    post_url TEXT,
    post_type TEXT CHECK(post_type IN ('photo', 'video', 'carousel', 'reel')),
    caption TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    posted_at DATETIME,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE(client_id, post_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_coach ON clients(coach_user_id);
CREATE INDEX IF NOT EXISTS idx_client_metrics_client ON client_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_milestones_client ON milestones(client_id);
CREATE INDEX IF NOT EXISTS idx_client_advanced_metrics_client ON client_advanced_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_client_advanced_metrics_date ON client_advanced_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_client_posts_client ON client_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_posts_date ON client_posts(posted_at);
