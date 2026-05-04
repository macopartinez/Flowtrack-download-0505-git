"""
Agent C — FlowTrack/Waler SaaS
Rôle : Suivi des followers pour les clients des utilisateurs Pro
Cron : 12h / 18h / 00h / 6h
Vérifie le nombre de followers des clients et met à jour les métriques
"""

import os
import time
import random
import logging
import asyncio
import json
import sqlite3
from datetime import datetime
from pathlib import Path

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv
from playwright.async_api import async_playwright

load_dotenv()

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'server', 'waler.db')

AGENT_ID = os.environ.get("AGENT_C_ID")
PROXY    = os.environ.get("AGENT_C_PROXY", None)

AGENT_INSTAGRAM_USER = os.environ.get("AGENT_C_INSTAGRAM_USER")
AGENT_INSTAGRAM_PASS = os.environ.get("AGENT_C_INSTAGRAM_PASS")

SESSION_FILE = Path(f"session-agent-c-{AGENT_INSTAGRAM_USER}.json")
MAX_CLIENTS_PER_SESSION = 10

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [Agent C] %(levelname)s — %(message)s"
)
log = logging.getLogger("agent_c")


def get_conn():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_pro_users_with_clients(conn):
    """Retourne tous les utilisateurs Pro avec leurs clients."""
    cur = conn.cursor()
    cur.execute("""
        SELECT DISTINCT 
               u.id AS user_id,
               u.username AS coach_username,
               u.subscription_tier AS subscription_tier
        FROM   users u
        WHERE  u.subscription_tier = 'pro'
          AND  u.subscription_status = 'active'
          AND  EXISTS (
              SELECT 1 FROM clients c 
              WHERE c.coach_user_id = u.id
          )
    """)
    return [dict(row) for row in cur.fetchall()]


def get_clients_for_coach(conn, coach_user_id):
    """Retourne tous les clients d'un coach."""
    cur = conn.cursor()
    cur.execute("""
        SELECT c.id AS client_id,
               c.instagram_username,
               c.display_name,
               c.tags,
               c.notes,
               c.initial_goal
        FROM   clients c
        WHERE  c.coach_user_id = ?
        ORDER BY c.created_at DESC
    """, (coach_user_id,))
    return [dict(row) for row in cur.fetchall()]


def get_latest_metrics(conn, client_id):
    """Récupère les dernières métriques d'un client."""
    cur = conn.cursor()
    cur.execute("""
        SELECT followers_count, following_count, recorded_at
        FROM   client_metrics
        WHERE  client_id = ?
        ORDER BY recorded_at DESC
        LIMIT 1
    """, (client_id,))
    row = cur.fetchone()
    return dict(row) if row else None


def save_client_metrics(conn, client_id, followers_count, following_count):
    """Sauvegarde les nouvelles métriques d'un client."""
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO client_metrics
            (client_id, followers_count, following_count, recorded_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    """, (client_id, followers_count, following_count))
    conn.commit()
    log.info(f"Métriques sauvegardées pour client {client_id}: {followers_count} followers, {following_count} following")


def create_milestone_if_needed(conn, client_id, followers_count):
    """Crée automatiquement des milestones pour les paliers de followers."""
    milestones = [100, 500, 1000, 5000, 10000, 50000, 100000]
    
    cur = conn.cursor()
    for milestone in milestones:
        if followers_count >= milestone:
            # Vérifier si ce milestone existe déjà
            cur.execute("""
                SELECT id, completed FROM milestones
                WHERE client_id = ? AND title = ?
            """, (client_id, f"{milestone} followers"))
            
            existing = cur.fetchone()
            
            if not existing:
                # Créer le milestone comme complété
                cur.execute("""
                    INSERT INTO milestones
                        (client_id, title, completed, completed_at, created_at)
                    VALUES (?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, (client_id, f"{milestone} followers"))
                log.info(f"Milestone créé: {milestone} followers pour client {client_id}")
            elif not existing['completed']:
                # Marquer comme complété
                cur.execute("""
                    UPDATE milestones
                    SET completed = 1, completed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (existing['id'],))
                log.info(f"Milestone complété: {milestone} followers pour client {client_id}")
    
    conn.commit()


def update_agent_heartbeat(conn):
    if not AGENT_ID:
        return
    cur = conn.cursor()
    cur.execute("""
        UPDATE agents
        SET    last_check_at = CURRENT_TIMESTAMP
        WHERE  id = ?
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


async def human_scroll(page):
    """Scroll léger pour simuler un comportement humain."""
    scroll_amount = random.randint(100, 300)
    await page.mouse.wheel(0, scroll_amount)
    await asyncio.sleep(random.uniform(1, 3))
    log.debug(f"Scroll de {scroll_amount}px")


async def get_profile_stats(page, username: str) -> dict:
    """Récupère les statistiques d'un profil Instagram (followers, following)."""
    try:
        await human_delay(2, 5)
        log.info(f"Récupération des stats de @{username}")
        
        await page.goto(f"https://www.instagram.com/{username}/", wait_until="domcontentloaded")
        await human_delay(3, 6)
        
        # Scroll léger = comportement humain
        await human_scroll(page)
        
        # Récupérer le nombre de followers
        try:
            followers_text = await page.locator('a[href*="/followers/"]').first.text_content()
            import re
            match = re.search(r'([\d,\.]+)', followers_text)
            followers_count = 0
            if match:
                # Gérer les formats comme "1,234" ou "1.2K"
                num_str = match.group(1).replace(',', '').replace('.', '')
                if 'K' in followers_text.upper():
                    followers_count = int(float(num_str) * 1000)
                elif 'M' in followers_text.upper():
                    followers_count = int(float(num_str) * 1000000)
                else:
                    followers_count = int(num_str)
            
            log.info(f"Followers: {followers_count}")
        except Exception as e:
            log.error(f"Erreur lors de la récupération des followers: {e}")
            followers_count = 0
        
        # Récupérer le nombre de following
        try:
            following_text = await page.locator('a[href*="/following/"]').first.text_content()
            match = re.search(r'([\d,\.]+)', following_text)
            following_count = 0
            if match:
                num_str = match.group(1).replace(',', '').replace('.', '')
                if 'K' in following_text.upper():
                    following_count = int(float(num_str) * 1000)
                elif 'M' in following_text.upper():
                    following_count = int(float(num_str) * 1000000)
                else:
                    following_count = int(num_str)
            
            log.info(f"Following: {following_count}")
        except Exception as e:
            log.error(f"Erreur lors de la récupération du following: {e}")
            following_count = 0
        
        return {
            "username": username,
            "followers_count": followers_count,
            "following_count": following_count,
            "checked_at": datetime.now().isoformat()
        }
    
    except Exception as e:
        log.error(f"Erreur lors de la récupération des stats de @{username}: {e}")
        return {
            "username": username,
            "followers_count": 0,
            "following_count": 0,
            "checked_at": datetime.now().isoformat()
        }


async def run_check_async():
    """Fonction asynchrone pour vérifier les clients Pro."""
    log.info("=== Début du check Agent C ===")
    conn = get_conn()

    try:
        update_agent_heartbeat(conn)
        
        # Récupérer tous les utilisateurs Pro avec des clients
        pro_users = get_pro_users_with_clients(conn)
        
        if not pro_users:
            log.info("Aucun utilisateur Pro avec des clients à vérifier")
            return
        
        log.info(f"{len(pro_users)} utilisateur(s) Pro à traiter")

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
            
            # Charger les cookies de session si disponibles
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
            
            # Traiter chaque utilisateur Pro
            total_clients_checked = 0
            for pro_user in pro_users:
                coach_user_id = pro_user['user_id']
                coach_username = pro_user['coach_username']
                
                log.info(f"Coach Pro: @{coach_username} (ID: {coach_user_id})")
                
                # Récupérer tous les clients de ce coach
                clients = get_clients_for_coach(conn, coach_user_id)
                
                if not clients:
                    log.info(f"Aucun client pour @{coach_username}")
                    continue
                
                log.info(f"{len(clients)} client(s) à vérifier pour @{coach_username}")
                
                # Limiter le nombre de clients par session
                clients_to_check = clients[:MAX_CLIENTS_PER_SESSION]
                if len(clients) > MAX_CLIENTS_PER_SESSION:
                    log.warning(f"Limitation à {MAX_CLIENTS_PER_SESSION} clients (sur {len(clients)} total)")
                
                # Vérifier chaque client
                for idx, client in enumerate(clients_to_check, 1):
                    client_id = client['client_id']
                    client_username = client['instagram_username']
                    
                    # Délai humain entre chaque vérification
                    if idx > 1:
                        await human_delay(8, 20)
                    
                    log.info(f"Client {idx}/{len(clients_to_check)}: @{client_username}")
                    
                    # Récupérer les stats du profil
                    stats = await get_profile_stats(page, client_username)
                    
                    if stats['followers_count'] > 0 or stats['following_count'] > 0:
                        # Récupérer les anciennes métriques
                        old_metrics = get_latest_metrics(conn, client_id)
                        
                        # Sauvegarder les nouvelles métriques
                        save_client_metrics(
                            conn, 
                            client_id, 
                            stats['followers_count'], 
                            stats['following_count']
                        )
                        
                        # Créer des milestones automatiques si nécessaire
                        create_milestone_if_needed(conn, client_id, stats['followers_count'])
                        
                        # Log de l'évolution
                        if old_metrics:
                            diff = stats['followers_count'] - old_metrics['followers_count']
                            if diff > 0:
                                log.info(f"📈 +{diff} followers pour @{client_username}")
                            elif diff < 0:
                                log.info(f"📉 {diff} followers pour @{client_username}")
                            else:
                                log.info(f"➡️ Pas de changement pour @{client_username}")
                        else:
                            log.info(f"✨ Première mesure pour @{client_username}")
                    
                    total_clients_checked += 1
                    
                    # Pause tous les 3-5 clients
                    if idx % random.randint(3, 5) == 0 and idx < len(clients_to_check):
                        pause_duration = random.uniform(1, 3)
                        log.info(f"Pause naturelle de {pause_duration:.1f} minutes")
                        await asyncio.sleep(pause_duration * 60)
                
                # Pause entre coaches
                await human_delay(10, 25)
            
            log.info(f"Total de {total_clients_checked} client(s) vérifiés")
            
            # Sauvegarder les cookies avant de fermer
            await save_session_cookies(context)
            
            # Fermer le navigateur
            await browser.close()
            log.info("Navigateur fermé")
    
    except Exception as e:
        log.error(f"Erreur durant le check : {e}", exc_info=True)
    finally:
        conn.close()
    
    log.info("=== Fin du check Agent C ===")


def run_check():
    """Wrapper synchrone pour run_check_async."""
    asyncio.run(run_check_async())


if __name__ == "__main__":
    scheduler = BlockingScheduler(timezone="Europe/Paris")

    scheduler.add_job(
        run_check,
        CronTrigger(hour="0,6,12,18", minute=0),
        id="agent_c_check",
        name="Agent C — Pro clients check",
        max_instances=1,
        misfire_grace_time=3600
    )

    log.info("Agent C démarré — checks planifiés à 0h / 6h / 12h / 18h")

    if os.environ.get("RUN_ON_START", "false").lower() == "true":
        log.info("RUN_ON_START activé — lancement immédiat")
        run_check()

    try:
        scheduler.start()
    except KeyboardInterrupt:
        log.info("Agent C arrêté.")
