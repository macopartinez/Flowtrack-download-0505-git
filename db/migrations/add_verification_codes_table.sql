-- Table pour stocker les codes de vérification Instagram
CREATE TABLE IF NOT EXISTS verification_codes (
  id SERIAL PRIMARY KEY,
  code_to_send VARCHAR(20) NOT NULL UNIQUE,
  code VARCHAR(6) UNIQUE,
  instagram_username VARCHAR(255) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP
);

-- Index pour recherche rapide par code_to_send
CREATE INDEX IF NOT EXISTS idx_verification_codes_code_to_send ON verification_codes(code_to_send);

-- Index pour recherche rapide par code
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);

-- Index pour recherche par username Instagram
CREATE INDEX IF NOT EXISTS idx_verification_codes_instagram_username ON verification_codes(instagram_username);

-- Index pour recherche par user_id
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes(user_id);

-- Fonction pour nettoyer les codes expirés (optionnel)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes
  WHERE expires_at < NOW() AND used = FALSE;
END;
$$ LANGUAGE plpgsql;
