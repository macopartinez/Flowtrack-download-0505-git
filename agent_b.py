"""
Agent B — Waler SaaS
Rôle : vérification du type d'unfollow (unfollow/blocked/deleted)
Déclenché par Agent A quand des followers manquants sont détectés
"""

import os
import asyncio
import json
import random
import logging
from datetime import datetime
from pathlib import Path

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from playwright.async_api import async_playwright

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

AGENT_ID = os.environ.get("AGENT_B_ID")
PROXY    = os.environ.get("AGENT_B_PROXY", None)

AGENT_INSTAGRAM_USER = os.environ.get("AGENT_B_INSTAGRAM_USER")
AGENT_INSTAGRAM_PASS = os.environ.get("AGENT_B_INSTAGRAM_PASS")

SESSION_FILE = Path(f"session-agent-b-{AGENT_INSTAGRAM_USER}.json")
MAX_CHECKS_PER_SESSION = 10

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [Agent B] %(levelname)s — %(message)s"
)
log = logging.getLogger("agent_b")


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def get_pending_check_b_events(conn):
    """Récupère les Events avec needsCheckB=true et status='pending'."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT e.id AS event_id,
                   e."clientId" AS client_id,
                   c."instagramUsername" AS client_username
            FROM "Event" e
            JOIN "Client" c ON c.id = e."clientId"
            WHERE e."needsCheckB" = true
              AND e.status = 'pending'
            ORDER BY e."createdAt" ASC
            LIMIT 5
        """)
        return cur.fetchall()


def get_missing_followers(conn, client_id: str):
    """Récupère les followers avec status='missing' pour un client."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT "followerUsername", "followerUserId"
            FROM "FollowerSnapshot"
            WHERE "clientId" = %s
              AND status = 'missing'
            ORDER BY "detectedAt" DESC
        """, (client_id,))
        return cur.fetchall()


def save_unfollow(conn, client_id: str, username: str, user_id: str, unfollow_type: str, event_id: str):
    """Sauvegarde un unfollow dans la table UnfollowList."""
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO "UnfollowList"
                ("clientId", "followerUsername", "followerUserId", "unfollowType", "detectedAt", "eventId")
            VALUES (%s, %s, %s, %s, NOW(), %s)
        """, (client_id, username, user_id, unfollow_type, event_id))
    conn.commit()
    log.info(f"Unfollow sauvegardé: @{username} ({unfollow_type})")


def update_follower_status(conn, client_id: str, username: str, final_status: str):
    """Met à jour le status d'un follower de 'missing' vers le type final."""
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE "FollowerSnapshot"
            SET status = %s
            WHERE "clientId" = %s
              AND "followerUsername" = %s
              AND status = 'missing'
        """, (final_status, client_id, username))
    conn.commit()


def update_event_status(conn, event_id: str, status: str):
    """Met à jour le status d'un Event."""
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE "Event"
            SET status = %s
            WHERE id = %s
        """, (status, event_id))
    conn.commit()


def update_agent_heartbeat(conn):
    if not AGENT_ID:
        return
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE "Agent"
            SET    "lastCheckAt" = NOW()
            WHERE  id = %s
        """, (AGENT_ID,))
    conn.commit()


async def load_session_cookies():
    """Charge les cookies de session depuis le fichier."""
    if SESSION_FILE.exists():
        with open(SESSION_FILE, 'r') as f:
            cookies = json.load(f)
            log.info(f"Session Instagram chargée depuis {SESSION_FILE}")
            return cookies
    return None


async def save_session_cookies(context):
    """Sauvegarde les cookies de session dans un fichier."""
    cookies = await context.cookies()
    with open(SESSION_FILE, 'w') as f:
        json.dump(cookies, f, indent=2)
    log.info(f"Session Instagram sauvegardée dans {SESSION_FILE}")


async def human_delay(min_s=3.0, max_s=8.0):
    """Délai aléatoire pour simuler un comportement humain."""
    delay = random.uniform(min_s, max_s)
    log.debug(f"Pause de {delay:.1f}s (comportement humain)")
    await asyncio.sleep(delay)


async def human_break(duration_min=2, duration_max=5):
    """Pause plus longue pour simuler une pause naturelle."""
    delay = random.uniform(duration_min * 60, duration_max * 60)
    log.info(f"Pause naturelle de {delay/60:.1f} minutes")
    await asyncio.sleep(delay)


async def detect_unfollow_type(page, username: str) -> str:
    """
    Vérifie le profil Instagram et détermine le type d'unfollow.
    Retourne: 'unfollow' | 'blocked' | 'deleted'
    """
    try:
        await human_delay(2, 5)
        
        log.info(f"Vérification du type d'unfollow pour @{username}")
        await page.goto(f"https://www.instagram.com/{username}/", wait_until="domcontentloaded")
        await human_delay(3, 6)
        
        content = await page.content()
        
        # Détecter le type
        if "Vous ne pouvez pas accéder" in content or "You can't access" in content:
            log.info(f"@{username} : Compte bloqué")
            return 'blocked'
        elif "Utilisateur introuvable" in content or "Sorry, this page" in content or "Page not found" in content:
            log.info(f"@{username} : Compte supprimé")
            return 'deleted'
        elif username.lower() in content.lower():
            log.info(f"@{username} : Unfollow simple (profil existe)")
            return 'unfollow'
        else:
            log.warning(f"@{username} : Type inconnu, considéré comme unfollow")
            return 'unfollow'
    
    except Exception as e:
        log.error(f"Erreur lors de la vérification de @{username}: {e}")
        return 'unfollow'  # Par défaut


async def run_check_async():
    """Fonction asynchrone pour vérifier les types d'unfollow."""
    log.info("=== Début du check Agent B ===")
    conn = get_conn()

    try:
        update_agent_heartbeat(conn)
        
        # Récupérer les Events en attente
        events = get_pending_check_b_events(conn)
        
        if not events:
            log.info("Aucun Event à traiter")
            return
        
        log.info(f"{len(events)} Event(s) à traiter")

        async with async_playwright() as p:
            # Lancer le navigateur (toujours visible)
            browser = await p.chromium.launch(
                headless=False,
                slow_mo=random.randint(50, 150),
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox'
                ]
            )
            
            # Créer le contexte avec configuration humaine
            context = await browser.new_context(
                viewport={'width': 1280, 'height': 800},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                locale='fr-FR',
                timezone_id='Europe/Paris'
            )
            
            # Charger les cookies Agent B
            cookies = await load_session_cookies()
            if cookies:
                await context.add_cookies(cookies)
                log.info("Session chargée - vérification directe des profils")
            else:
                log.warning("Aucune session sauvegardée. Première connexion requise.")
                log.info("Veuillez vous connecter manuellement dans le navigateur qui va s'ouvrir.")
            
            page = await context.new_page()
            
            # Si pas de cookies, aller sur Instagram et attendre la connexion
            if not cookies:
                await page.goto("https://www.instagram.com/", wait_until="domcontentloaded")
                await human_delay(3, 6)
                log.info("Attendez 60 secondes pour vous connecter manuellement...")
                await asyncio.sleep(60)
                # Sauvegarder les cookies après connexion
                await save_session_cookies(context)
            
            # Traiter chaque Event
            for event in events:
                event_id = event['event_id']
                client_id = event['client_id']
                
                log.info(f"Traitement de l'Event {event_id} pour client {client_id}")
                
                # Récupérer les followers manquants
                missing_followers = get_missing_followers(conn, client_id)
                
                if not missing_followers:
                    log.warning(f"Aucun follower manquant trouvé pour l'Event {event_id}")
                    update_event_status(conn, event_id, 'processed')
                    continue
                
                log.info(f"{len(missing_followers)} follower(s) manquant(s) à vérifier")
                
                # Limiter le nombre de vérifications par session
                followers_to_check = missing_followers[:MAX_CHECKS_PER_SESSION]
                if len(missing_followers) > MAX_CHECKS_PER_SESSION:
                    log.warning(f"Limitation à {MAX_CHECKS_PER_SESSION} vérifications (sur {len(missing_followers)} total)")
                
                # Vérifier chaque follower manquant
                for idx, follower in enumerate(followers_to_check, 1):
                    username = follower['followerUsername']
                    user_id = follower.get('followerUserId')
                    
                    # Délai humain entre chaque vérification
                    if idx > 1:
                        await human_delay(8, 20)
                    
                    log.info(f"Vérification {idx}/{len(followers_to_check)}: @{username}")
                    
                    # Détecter le type d'unfollow
                    unfollow_type = await detect_unfollow_type(page, username)
                    
                    # Sauvegarder dans UnfollowList
                    save_unfollow(conn, client_id, username, user_id, unfollow_type, event_id)
                    
                    # Mettre à jour le FollowerSnapshot
                    update_follower_status(conn, client_id, username, unfollow_type)
                    
                    # Pause tous les 3-5 comptes
                    if idx % random.randint(3, 5) == 0 and idx < len(followers_to_check):
                        await human_break(duration_min=1, duration_max=3)
                
                # Marquer l'Event comme traité
                update_event_status(conn, event_id, 'processed')
                log.info(f"Event {event_id} traité avec succès")
            
            # Sauvegarder les cookies avant de fermer
            await save_session_cookies(context)
            
            # Fermer le navigateur
            await browser.close()
            log.info("Navigateur fermé")
    
    except Exception as e:
        log.error(f"Erreur durant le check : {e}", exc_info=True)
    finally:
        conn.close()
    
    log.info("=== Fin du check Agent B ===")


def run_check():
    """Wrapper synchrone pour run_check_async."""
    asyncio.run(run_check_async())


if __name__ == "__main__":
    log.info("Agent B démarré (déclenché par Agent A)")
    
    try:
        run_check()
        log.info("Agent B terminé avec succès")
    except KeyboardInterrupt:
        log.info("Agent B interrompu")
    except Exception as e:
        log.error(f"Erreur Agent B: {e}", exc_info=True)
