-- ============================================
-- FlowTrack/Waler - Schéma de Base de Données Supabase
-- ============================================
-- 
-- Instructions :
-- 1. Ouvrez Supabase Dashboard > SQL Editor
-- 2. Créez une nouvelle requête
-- 3. Copiez-collez ce fichier
-- 4. Cliquez sur "Run" ou Ctrl+Enter
-- ============================================

-- Supprimer les tables si elles existent déjà (optionnel)
DROP TABLE IF EXISTS blockers CASCADE;
DROP TABLE IF EXISTS followers CASCADE;
DROP TABLE IF EXISTS unfollowers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Table des utilisateurs
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook')),
  avatar_url TEXT,
  is_connected BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table des unfollowers
CREATE TABLE unfollowers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  detected_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_unfollower_user
    FOREIGN KEY (user_id) 
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Table des followers
CREATE TABLE followers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  detected_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_follower_user
    FOREIGN KEY (user_id) 
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Table des blockers (comptes bloqués ou supprimés)
CREATE TABLE blockers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  type TEXT NOT NULL DEFAULT 'blocker' CHECK (type IN ('blocker', 'disappeared')),
  detected_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_blocker_user
    FOREIGN KEY (user_id) 
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX idx_unfollowers_user_id ON unfollowers(user_id);
CREATE INDEX idx_unfollowers_detected_at ON unfollowers(detected_at DESC);
CREATE INDEX idx_followers_user_id ON followers(user_id);
CREATE INDEX idx_followers_detected_at ON followers(detected_at DESC);
CREATE INDEX idx_blockers_user_id ON blockers(user_id);
CREATE INDEX idx_blockers_detected_at ON blockers(detected_at DESC);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_platform ON users(platform);

-- Commentaires pour la documentation
COMMENT ON TABLE users IS 'Utilisateurs de l''application FlowTrack/Waler';
COMMENT ON TABLE unfollowers IS 'Historique des personnes qui ont unfollow';
COMMENT ON TABLE followers IS 'Historique des followers actuels';
COMMENT ON TABLE blockers IS 'Comptes qui ont bloqué ou ont été supprimés';

COMMENT ON COLUMN users.platform IS 'Plateforme sociale : instagram ou facebook';
COMMENT ON COLUMN users.is_connected IS 'Indique si le compte est toujours connecté';
COMMENT ON COLUMN blockers.type IS 'Type : blocker (compte bloqué) ou disappeared (compte supprimé)';

-- Afficher les tables créées
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('users', 'unfollowers', 'followers', 'blockers')
ORDER BY table_name;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Tables créées avec succès !';
  RAISE NOTICE '📊 Tables : users, unfollowers, followers, blockers';
  RAISE NOTICE '🔍 Index créés pour optimiser les performances';
END $$;
