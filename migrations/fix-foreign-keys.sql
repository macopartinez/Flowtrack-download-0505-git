-- Migration: Fix Foreign Keys to Point to app_users Instead of users
-- Date: 2026-05-27
-- Description: Les contraintes de clé étrangère pointent vers la mauvaise table

-- 1. Supprimer les anciennes contraintes
ALTER TABLE followers DROP CONSTRAINT IF EXISTS fk_follower_user;
ALTER TABLE unfollowers DROP CONSTRAINT IF EXISTS fk_unfollower_user;
ALTER TABLE blockers DROP CONSTRAINT IF EXISTS fk_blocker_user;

-- 2. Ajouter les nouvelles contraintes pointant vers app_users
ALTER TABLE followers 
  ADD CONSTRAINT fk_follower_user 
  FOREIGN KEY (user_id) 
  REFERENCES app_users(id) 
  ON DELETE CASCADE;

ALTER TABLE unfollowers 
  ADD CONSTRAINT fk_unfollower_user 
  FOREIGN KEY (user_id) 
  REFERENCES app_users(id) 
  ON DELETE CASCADE;

ALTER TABLE blockers 
  ADD CONSTRAINT fk_blocker_user 
  FOREIGN KEY (user_id) 
  REFERENCES app_users(id) 
  ON DELETE CASCADE;

-- Vérification
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('followers', 'unfollowers', 'blockers');
