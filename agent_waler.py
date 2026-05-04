"""
Agent Waler — Agrégateur et synchroniseur principal
Rôle : Collecte les données de tous les agents (A, B, ...) et met à jour la base finale
Cron : Toutes les 15 minutes
"""

import os
import time
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

import psycopg2
import psycopg2.extras
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
AGENT_WALER_ID = os.environ.get("AGENT_WALER_ID")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [Agent Waler] %(levelname)s — %(message)s"
)
log = logging.getLogger("agent_waler")


def get_conn():
    """Crée une connexion à la base de données PostgreSQL."""
    return psycopg2.connect(DATABASE_URL)


class WalerAggregator:
    """Agrégateur principal qui collecte et synchronise les données de tous les agents."""
    
    def __init__(self):
        self.conn = get_conn()
        log.info("Agent Waler initialisé")
    
    def run(self):
        """Cycle principal d'agrégation et synchronisation."""
        log.info("=== Début cycle Agent Waler ===")
        
        try:
            self.update_heartbeat()
            
            # 1. Collecter les données des agents
            log.info("Collecte des données des agents...")
            agent_a_data = self.collect_agent_a_data()
            agent_b_data = self.collect_agent_b_data()
            
            log.info(f"Agent A: {len(agent_a_data)} snapshots non traités")
            log.info(f"Agent B: {len(agent_b_data)} unfollows non traités")
            
            if not agent_a_data and not agent_b_data:
                log.info("Aucune donnée à traiter")
                return
            
            # 2. Valider et croiser les données
            log.info("Validation et croisement des données...")
            validated_data = self.validate_and_cross_data(agent_a_data, agent_b_data)
            
            # 3. Mettre à jour les statistiques des clients
            log.info("Mise à jour des statistiques clients...")
            self.update_client_stats(validated_data)
            
            # 4. Marquer les données comme traitées
            log.info("Marquage des données comme traitées...")
            self.mark_as_processed(agent_a_data, agent_b_data)
            
            # 5. Analyser les patterns et suggérer des actions
            log.info("Analyse des patterns...")
            self.analyze_patterns()
            
            # 6. Nettoyer les anciennes données
            log.info("Nettoyage des anciennes données...")
            self.cleanup_old_data()
            
            log.info("Cycle terminé avec succès")
            
        except Exception as e:
            log.error(f"Erreur durant le cycle: {e}", exc_info=True)
        finally:
            log.info("=== Fin cycle Agent Waler ===\n")
    
    def update_heartbeat(self):
        """Met à jour le heartbeat de l'agent."""
        if not AGENT_WALER_ID:
            return
        
        with self.conn.cursor() as cur:
            cur.execute("""
                UPDATE "Agent"
                SET "lastCheckAt" = NOW()
                WHERE id = %s
            """, (AGENT_WALER_ID,))
        self.conn.commit()
    
    def collect_agent_a_data(self) -> List[Dict[str, Any]]:
        """Récupère les snapshots non traités de l'Agent A."""
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT *
                FROM "FollowerSnapshot"
                WHERE COALESCE("processedByWaler", false) = false
                ORDER BY "detectedAt" ASC
                LIMIT 1000
            """)
            return cur.fetchall()
    
    def collect_agent_b_data(self) -> List[Dict[str, Any]]:
        """Récupère les unfollows non traités de l'Agent B."""
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT *
                FROM "UnfollowList"
                WHERE COALESCE("processedByWaler", false) = false
                ORDER BY "detectedAt" ASC
                LIMIT 1000
            """)
            return cur.fetchall()
    
    def validate_and_cross_data(
        self, 
        agent_a_data: List[Dict[str, Any]], 
        agent_b_data: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Valide et croise les données des agents A et B.
        Retourne un dictionnaire avec les données validées par client.
        """
        validated = {}
        
        # Grouper par client
        for snapshot in agent_a_data:
            client_id = snapshot['clientId']
            if client_id not in validated:
                validated[client_id] = {
                    'snapshots': [],
                    'unfollows': [],
                    'missing_count': 0,
                    'unfollow_count': 0,
                    'blocked_count': 0,
                    'deleted_count': 0
                }
            
            validated[client_id]['snapshots'].append(snapshot)
            
            # Compter par statut
            status = snapshot.get('status', '')
            if status == 'missing':
                validated[client_id]['missing_count'] += 1
        
        for unfollow in agent_b_data:
            client_id = unfollow['clientId']
            if client_id not in validated:
                validated[client_id] = {
                    'snapshots': [],
                    'unfollows': [],
                    'missing_count': 0,
                    'unfollow_count': 0,
                    'blocked_count': 0,
                    'deleted_count': 0
                }
            
            validated[client_id]['unfollows'].append(unfollow)
            
            # Compter par type
            unfollow_type = unfollow.get('unfollowType', '')
            if unfollow_type == 'unfollow':
                validated[client_id]['unfollow_count'] += 1
            elif unfollow_type == 'blocked':
                validated[client_id]['blocked_count'] += 1
            elif unfollow_type == 'deleted':
                validated[client_id]['deleted_count'] += 1
        
        return validated
    
    def update_client_stats(self, validated_data: Dict[str, List[Dict[str, Any]]]):
        """Met à jour les statistiques des clients."""
        with self.conn.cursor() as cur:
            for client_id, data in validated_data.items():
                # Vérifier si le client existe
                cur.execute("""
                    SELECT id FROM "Client" WHERE id = %s
                """, (client_id,))
                
                if not cur.fetchone():
                    log.warning(f"Client {client_id} introuvable, skip")
                    continue
                
                # Mettre à jour les statistiques
                if data['unfollow_count'] > 0 or data['blocked_count'] > 0 or data['deleted_count'] > 0:
                    cur.execute("""
                        UPDATE "Client"
                        SET "lastUnfollowDetectedAt" = NOW(),
                            "updatedAt" = NOW()
                        WHERE id = %s
                    """, (client_id,))
                    
                    log.info(
                        f"Client {client_id}: "
                        f"{data['unfollow_count']} unfollows, "
                        f"{data['blocked_count']} blocks, "
                        f"{data['deleted_count']} deleted"
                    )
        
        self.conn.commit()
    
    def mark_as_processed(
        self, 
        agent_a_data: List[Dict[str, Any]], 
        agent_b_data: List[Dict[str, Any]]
    ):
        """Marque les données comme traitées par Waler."""
        with self.conn.cursor() as cur:
            # Marquer les snapshots
            if agent_a_data:
                snapshot_ids = [s['id'] for s in agent_a_data]
                cur.execute("""
                    UPDATE "FollowerSnapshot"
                    SET "processedByWaler" = true
                    WHERE id = ANY(%s)
                """, (snapshot_ids,))
                log.info(f"{len(snapshot_ids)} snapshots marqués comme traités")
            
            # Marquer les unfollows
            if agent_b_data:
                unfollow_ids = [u['id'] for u in agent_b_data]
                cur.execute("""
                    UPDATE "UnfollowList"
                    SET "processedByWaler" = true
                    WHERE id = ANY(%s)
                """, (unfollow_ids,))
                log.info(f"{len(unfollow_ids)} unfollows marqués comme traités")
        
        self.conn.commit()
    
    def analyze_patterns(self):
        """
        Analyse les patterns et suggère des actions.
        Par exemple: détecter si un user en mode personal devrait passer en mode pro.
        """
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Exemple: Vérifier les users avec beaucoup de clients mais en mode personal
            # Note: Cette requête suppose que la table users existe dans PostgreSQL
            # Si ce n'est pas le cas, cette partie peut être désactivée
            try:
                cur.execute("""
                    SELECT c."coachUserId", COUNT(c.id) as client_count
                    FROM "Client" c
                    WHERE c.status = 'active'
                    GROUP BY c."coachUserId"
                    HAVING COUNT(c.id) >= 5
                """)
                
                users_with_many_clients = cur.fetchall()
                
                for user in users_with_many_clients:
                    log.warning(
                        f"User {user['coachUserId']} a {user['client_count']} clients actifs. "
                        f"Considérer une suggestion de passage en mode Pro."
                    )
            except Exception as e:
                log.debug(f"Analyse de patterns skippée: {e}")
    
    def cleanup_old_data(self):
        """Nettoie les données anciennes déjà traitées."""
        cutoff_date = datetime.now() - timedelta(days=30)
        
        with self.conn.cursor() as cur:
            # Nettoyer les anciens snapshots traités
            cur.execute("""
                DELETE FROM "FollowerSnapshot"
                WHERE "processedByWaler" = true
                  AND "detectedAt" < %s
            """, (cutoff_date,))
            deleted_snapshots = cur.rowcount
            
            # Nettoyer les anciens unfollows traités
            cur.execute("""
                DELETE FROM "UnfollowList"
                WHERE "processedByWaler" = true
                  AND "detectedAt" < %s
            """, (cutoff_date,))
            deleted_unfollows = cur.rowcount
            
            # Nettoyer les anciens events traités
            cur.execute("""
                DELETE FROM "Event"
                WHERE status = 'processed'
                  AND "createdAt" < %s
            """, (cutoff_date,))
            deleted_events = cur.rowcount
        
        self.conn.commit()
        
        if deleted_snapshots > 0 or deleted_unfollows > 0 or deleted_events > 0:
            log.info(
                f"Nettoyage: {deleted_snapshots} snapshots, "
                f"{deleted_unfollows} unfollows, {deleted_events} events supprimés"
            )
    
    def close(self):
        """Ferme la connexion à la base de données."""
        if self.conn:
            self.conn.close()
            log.info("Connexion fermée")


def run_aggregation_cycle():
    """Fonction wrapper pour le scheduler."""
    aggregator = WalerAggregator()
    try:
        aggregator.run()
    finally:
        aggregator.close()


if __name__ == "__main__":
    log.info("Agent Waler démarré")
    
    scheduler = BlockingScheduler()
    
    # Exécuter toutes les 15 minutes
    scheduler.add_job(
        run_aggregation_cycle,
        'interval',
        minutes=15,
        id='waler_aggregation',
        next_run_time=datetime.now()  # Exécuter immédiatement au démarrage
    )
    
    log.info("Scheduler configuré: cycle toutes les 15 minutes")
    
    try:
        scheduler.start()
    except KeyboardInterrupt:
        log.info("Agent Waler arrêté par l'utilisateur")
    except Exception as e:
        log.error(f"Erreur Agent Waler: {e}", exc_info=True)
