-- Contrainte unique manquante sur `unfollowers (user_id, username)`.
--
-- Pourquoi : la route POST /api/extension/verify-missing-followers fait un
-- `INSERT ... ON CONFLICT (user_id, username) DO UPDATE`. Sans contrainte unique
-- correspondante, Postgres rejette CHAQUE insert ("no unique or exclusion
-- constraint matching the ON CONFLICT specification"). L'erreur était avalée par
-- le try/catch par-username → AUCUN unfollower n'était jamais enregistré, alors
-- que la route renvoyait quand même success. (Cas de schema-drift : le code
-- supposait une contrainte absente de la base live.)
--
-- Pré-requis : aucune ligne en double (user_id, username). Vérifié avant ajout.

ALTER TABLE unfollowers
  ADD CONSTRAINT unfollowers_user_id_username_unique UNIQUE (user_id, username);
