-- Migration: Ajout des colonnes processedByWaler pour l'Agent Waler
-- Date: 2026-04-13
-- Description: Ajoute des flags pour tracker quelles données ont été traitées par l'Agent Waler

-- Ajouter la colonne processedByWaler à FollowerSnapshot
ALTER TABLE "FollowerSnapshot" 
ADD COLUMN IF NOT EXISTS "processedByWaler" BOOLEAN DEFAULT false;

-- Ajouter la colonne processedByWaler à UnfollowList
ALTER TABLE "UnfollowList" 
ADD COLUMN IF NOT EXISTS "processedByWaler" BOOLEAN DEFAULT false;

-- Ajouter la colonne processedByWaler à Event
ALTER TABLE "Event" 
ADD COLUMN IF NOT EXISTS "processedByWaler" BOOLEAN DEFAULT false;

-- Ajouter des index pour améliorer les performances des requêtes de l'Agent Waler
CREATE INDEX IF NOT EXISTS idx_follower_snapshot_waler 
ON "FollowerSnapshot"("processedByWaler", "detectedAt") 
WHERE "processedByWaler" = false;

CREATE INDEX IF NOT EXISTS idx_unfollow_list_waler 
ON "UnfollowList"("processedByWaler", "detectedAt") 
WHERE "processedByWaler" = false;

CREATE INDEX IF NOT EXISTS idx_event_waler 
ON "Event"("processedByWaler", "createdAt") 
WHERE "processedByWaler" = false;

-- Ajouter des colonnes de statistiques au Client si elles n'existent pas
ALTER TABLE "Client" 
ADD COLUMN IF NOT EXISTS "lastUnfollowDetectedAt" TIMESTAMP;

-- Créer la table Agent si elle n'existe pas (pour le heartbeat)
CREATE TABLE IF NOT EXISTS "Agent" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    "lastCheckAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Insérer l'Agent Waler s'il n'existe pas
INSERT INTO "Agent" (id, name, type, status, "createdAt")
VALUES ('agent-waler', 'Agent Waler', 'aggregator', 'active', NOW())
ON CONFLICT (id) DO NOTHING;

-- Commentaires pour documentation
COMMENT ON COLUMN "FollowerSnapshot"."processedByWaler" IS 'Indique si ce snapshot a été traité par l''Agent Waler';
COMMENT ON COLUMN "UnfollowList"."processedByWaler" IS 'Indique si cet unfollow a été traité par l''Agent Waler';
COMMENT ON COLUMN "Event"."processedByWaler" IS 'Indique si cet event a été traité par l''Agent Waler';
COMMENT ON COLUMN "Client"."lastUnfollowDetectedAt" IS 'Date de la dernière détection d''unfollow pour ce client';
