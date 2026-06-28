/**
 * Routes Express de la fonctionnalité « Clients » (coaching) — extraites de
 * server/routes.ts. À ré-injecter dans le registerRoutes(app) d'un autre projet.
 *
 * Dépendances attendues dans le contexte d'origine :
 *  - requireAuth          (middleware d'authentification de session)
 *  - getDb()              (handle better-sqlite3 partagé)
 *  - Database, path       (pour ouvrir waler.db dans la route metrics)
 *  - triggerAgentForClient (depuis ./agent-trigger — voir agent-trigger.ts archivé)
 *
 * Tables SQL associées : voir clients-schema.sql.
 */

import Database from "better-sqlite3";
import path from "path";
import { triggerAgentForClient } from "./agent-trigger";

// NB : `app`, `requireAuth` et `getDb` proviennent du scope registerRoutes().
export function registerClientRoutes(app: any, requireAuth: any, getDb: any) {
  // Créer un nouveau client dans la BDD
  app.post("/api/pro/clients", requireAuth, async (req: any, res: any) => {
    try {
      const { instagramUsername, displayName, tags, notes, initialGoal } = req.body;
      const userId = req.session.userId;

      if (!instagramUsername || !displayName) {
        return res.status(400).json({ message: "Instagram username and display name are required" });
      }

      const db = getDb();
      const result = db.prepare(`
        INSERT INTO clients (coach_user_id, instagram_username, display_name, tags, notes, initial_goal)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, instagramUsername, displayName, JSON.stringify(tags || []), notes || '', initialGoal || '');

      const clientId = result.lastInsertRowid;

      console.log(`✅ Client créé dans la BDD: ${instagramUsername} (ID: ${clientId})`);

      res.json({
        success: true,
        clientId,
        message: "Client créé avec succès"
      });
    } catch (error: any) {
      console.error("Erreur lors de la création du client:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Déclencher l'agent Pro Clients pour un client spécifique
  app.post("/api/pro/trigger-agent-client/:clientId", requireAuth, async (req: any, res: any) => {
    try {
      const clientIdParam = Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId;
      const clientId = parseInt(clientIdParam);

      if (isNaN(clientId)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }

      console.log(`🚀 Déclenchement de l'agent Pro Clients pour le client ${clientId}`);

      const triggered = await triggerAgentForClient(clientId);

      if (triggered) {
        res.json({
          success: true,
          message: "Agent Pro Clients démarré avec succès",
          clientId
        });
      } else {
        res.status(409).json({
          success: false,
          message: "Agent Pro Clients déjà en cours d'exécution"
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du déclenchement de l'agent:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Historique RÉEL des métriques d'un client (followers/following), pour le
  // graphique de progression de ClientDetailView. Source : client_metrics,
  // alimentée par l'agent (agent_c.py). Aucune donnée factice : si l'agent n'a
  // pas encore collecté, l'historique est vide.
  app.get("/api/pro/clients/:clientId/metrics", requireAuth, async (req: any, res: any) => {
    const sqlite = new Database(path.join(import.meta.dirname, "waler.db"));
    try {
      const userId = req.session.userId;
      const clientId = parseInt(String(req.params.clientId), 10);
      if (isNaN(clientId)) {
        sqlite.close();
        return res.status(400).json({ message: "Invalid client ID" });
      }

      // Le client doit appartenir au coach connecté (cloisonnement).
      const owned = sqlite
        .prepare(`SELECT id FROM clients WHERE id = ? AND coach_user_id = ?`)
        .get(clientId, userId) as { id: number } | undefined;
      if (!owned) {
        sqlite.close();
        return res.status(404).json({ message: "Client introuvable" });
      }

      const period = Math.max(1, Math.min(365, parseInt(String(req.query.period ?? "30"), 10) || 30));

      // recorded_at est en CURRENT_TIMESTAMP (UTC, « YYYY-MM-DD HH:MM:SS ») :
      // on filtre via datetime('now', …) pour éviter tout souci de format.
      const rows = sqlite
        .prepare(
          `SELECT followers_count, following_count, recorded_at
           FROM client_metrics
           WHERE client_id = ? AND recorded_at >= datetime('now', ?)
           ORDER BY recorded_at ASC`
        )
        .all(clientId, `-${period} days`) as Array<{
        followers_count: number;
        following_count: number;
        recorded_at: string;
      }>;

      const history = rows.map((r) => ({
        date: new Date(r.recorded_at.replace(" ", "T") + "Z").getTime(), // UTC → ms
        followers: r.followers_count,
        following: r.following_count,
      }));

      sqlite.close();
      res.json({ success: true, history });
    } catch (error: any) {
      try { sqlite.close(); } catch { /* déjà fermée */ }
      console.error("Erreur récupération métriques client:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Statut des agents Pro (le seul agent suivi ici était l'agent Pro Clients)
  app.get("/api/pro/agents-status", requireAuth, async (_req: any, res: any) => {
    try {
      const { getAgentsStatus } = await import("./agent-trigger");
      res.json(getAgentsStatus());
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
}
