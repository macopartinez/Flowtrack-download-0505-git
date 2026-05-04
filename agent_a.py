"""
Agent A — Waler SaaS
Rôle : détection d'unfollows par comparaison de snapshots Instagram
Cron  : 10h / 16h / 22h / 4h
Utilise Playwright pour simuler un comportement humain réaliste
"""

import os
import time
import random
import logging
import asyncio
import json
import subprocess
from datetime import datetime
from pathlib import Path

import psycopg2
import psycopg2.extras
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv
from playwright.async_api import async_playwright

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

AGENT_ID = os.environ.get("AGENT_A_ID")
PROXY    = os.environ.get("AGENT_A_PROXY", None)

AGENT_INSTAGRAM_USER = os.environ.get("AGENT_A_INSTAGRAM_USER")
AGENT_INSTAGRAM_PASS = os.environ.get("AGENT_A_INSTAGRAM_PASS")

SESSION_FILE = Path(f"session-{AGENT_INSTAGRAM_USER}.json")
MAX_PROFILES_PER_SESSION = 5

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [Agent A] %(levelname)s — %(message)s"
)
log = logging.getLogger("agent_a")


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def get_active_clients(conn):
    """Retourne tous les clients actifs."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT c.id AS client_id,
                   c."instagramUsername" AS instagram_username,
                   c."instagramUserId" AS instagram_user_id
            FROM   "Client" c
            WHERE  c.status = 'active'
        """)
        return cur.fetchall()


def get_last_snapshot(conn, client_id, target_user_id):
    """Retourne le dernier statut connu d'un compte pour un client."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT status FROM "FollowerSnapshot"
            WHERE  "clientId"        = %s
              AND  "followerUserId"   = %s
            ORDER  BY "detectedAt" DESC
            LIMIT  1
        """, (client_id, target_user_id))
        row = cur.fetchone()
        return row["status"] if row else None


def save_snapshot(conn, client_id, username, user_id, status):
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO "FollowerSnapshot"
                ("clientId", "followerUsername", "followerUserId", status, "detectedAt")
            VALUES (%s, %s, %s, %s, NOW())
        """, (client_id, username, user_id, status))
    conn.commit()


def create_event(conn, client_id, username, user_id, event_type, needs_check_b=False):
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO "Event"
                ("clientId", "targetUsername", "targetUserId",
                 "eventType", "needsCheckB", status, "createdAt")
            VALUES (%s, %s, %s, %s, %s, 'new', NOW())
        """, (client_id, username, user_id, event_type, needs_check_b))
    conn.commit()
    log.info(f"Event créé : {event_type} — @{username} (client {client_id})")


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


async def human_scroll(page):
    """Scroll léger pour simuler un comportement humain."""
    scroll_amount = random.randint(100, 300)
    await page.mouse.wheel(0, scroll_amount)
    await asyncio.sleep(random.uniform(1, 3))
    log.debug(f"Scroll de {scroll_amount}px")


async def get_followers_list(page, username: str, max_count: int = 50) -> list:
    """Récupère les N premiers followers d'un compte Instagram."""
    try:
        await human_delay(2, 5)
        log.info(f"Récupération des followers de @{username}")
        
        await page.goto(f"https://www.instagram.com/{username}/", wait_until="domcontentloaded")
        await human_delay(3, 6)
        
        # Récupérer le nombre de followers affiché sur le profil
        try:
            followers_text = await page.locator('a[href*="/followers/"]').first.text_content()
            # Extraire le nombre (ex: "4 followers" -> 4)
            import re
            match = re.search(r'(\d+)', followers_text)
            if match:
                actual_follower_count = int(match.group(1))
                log.info(f"Nombre de followers affiché sur le profil: {actual_follower_count}")
                max_count = min(max_count, actual_follower_count)  # Ne pas dépasser le nombre réel
        except:
            log.warning("Impossible de récupérer le nombre de followers, utilisation de max_count par défaut")
        
        # Cliquer sur "X followers" - essayer plusieurs sélecteurs
        try:
            # Attendre que la page soit complètement chargée
            await page.wait_for_load_state('networkidle', timeout=10000)
            await human_delay(2, 4)
            
            # Screenshot avant de cliquer pour debug
            await page.screenshot(path=f"debug_before_click_{username}.png")
            log.info(f"Screenshot sauvegardé: debug_before_click_{username}.png")
            
            # Essayer différents sélecteurs - IMPORTANT: chercher EXACTEMENT "followers" pas "following"
            selectors = [
                'a[href$="/followers/"]',  # Lien se terminant EXACTEMENT par /followers/
                'a[href*="/followers/"]:not([href*="/following/"])'  # Contient /followers/ mais PAS /following/
            ]
            
            clicked = False
            for selector in selectors:
                try:
                    log.info(f"Tentative avec sélecteur: {selector}")
                    followers_element = page.locator(selector).first
                    await followers_element.click(timeout=5000)
                    clicked = True
                    log.info("Clic réussi sur followers")
                    break
                except:
                    continue
            
            if not clicked:
                log.error("Aucun sélecteur n'a fonctionné pour le bouton followers")
                await page.screenshot(path="debug_followers_error.png")
                log.info("Screenshot sauvegardé: debug_followers_error.png")
                return []
            
            await human_delay(2, 4)
        except Exception as e:
            log.error(f"Impossible de cliquer sur followers: {e}")
            return []
        
        # Attendre que la modal s'ouvre
        try:
            await page.wait_for_selector('div[role="dialog"]', timeout=10000)
            await human_delay(1, 3)
        except:
            log.error("Modal followers non trouvée")
            return []
        
        followers = []
        seen_usernames = set()
        
        # Récupérer UNIQUEMENT les followers visibles (sans scroller)
        # Parfait pour les petits comptes comme Clara (4 followers)
        log.info("Récupération des followers visibles (sans scroll)")
        
        # Attendre un peu pour que tout se charge
        await human_delay(2, 3)
        
        # Récupérer les liens de followers visibles
        follower_links = await page.locator('div[role="dialog"] a[href^="/"]').all()
        
        for link in follower_links:
            if len(followers) >= max_count:
                break
            
            try:
                href = await link.get_attribute('href')
                if href and href.startswith('/'):
                    username_from_link = href.strip('/').split('/')[0]
                    
                    # Ignorer les liens qui ne sont pas des usernames valides
                    if username_from_link and username_from_link not in seen_usernames and '/' not in username_from_link:
                        seen_usernames.add(username_from_link)
                        followers.append({
                            'username': username_from_link,
                            'user_id': None
                        })
            except:
                continue
        
        log.info(f"Récupéré {len(followers)} followers pour @{username}")
        
        # Log détaillé des premiers followers
        if followers:
            log.info(f"Premiers followers récupérés: {[f['username'] for f in followers[:10]]}")
        
        return followers[:max_count]
    
    except Exception as e:
        log.error(f"Erreur lors de la récupération des followers de @{username}: {e}")
        return []


def get_previous_followers(conn, client_id: str) -> list:
    """Récupère la liste des followers du dernier snapshot."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT DISTINCT "followerUsername"
            FROM "FollowerSnapshot"
            WHERE "clientId" = %s
              AND status IN ('following', 'visible')
        """, (client_id,))
        return [row['followerUsername'] for row in cur.fetchall()]


def compare_followers(old_list: list, new_list: list) -> list:
    """Compare deux listes de followers et retourne les comptes manquants."""
    old_set = set(old_list)
    new_set = set([f['username'] for f in new_list])
    missing = old_set - new_set
    return list(missing)


def save_missing_follower(conn, client_id: str, username: str, user_id: str = None):
    """Sauvegarde un follower manquant avec status='missing'."""
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO "FollowerSnapshot"
                ("clientId", "followerUsername", "followerUserId", status, "detectedAt")
            VALUES (%s, %s, %s, 'missing', NOW())
        """, (client_id, username, user_id))
    conn.commit()
    log.info(f"Follower manquant sauvegardé: @{username}")


def create_check_b_event(conn, client_id: str, missing_count: int):
    """Crée un Event pour déclencher Agent B."""
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO "Event"
                ("clientId", "targetUsername", "targetUserId",
                 "eventType", "needsCheckB", status, "createdAt")
            VALUES (%s, '', '', 'missing_followers', true, 'pending', NOW())
        """, (client_id,))
    conn.commit()
    log.info(f"Event créé pour Agent B: {missing_count} follower(s) manquant(s)")
    
    # Déclencher Agent B immédiatement
    try:
        log.info("Déclenchement de Agent B...")
        subprocess.Popen(["python", "agent_b.py"], 
                        cwd=os.path.dirname(os.path.abspath(__file__)))
        log.info("Agent B lancé avec succès")
    except Exception as e:
        log.error(f"Erreur lors du lancement de Agent B: {e}")


async def check_account_visibility(page, username: str) -> dict:
    """
    Vérifie si un compte Instagram est visible.
    Retourne un dict avec status: 'visible' | 'invisible' | 'private' | 'unknown'
    """
    try:
        # Comportement humain — délai avant navigation
        await human_delay(2, 5)
        
        log.info(f"Navigation vers le profil @{username}")
        await page.goto(f"https://www.instagram.com/{username}/", wait_until="domcontentloaded")
        
        # Attendre le chargement
        await human_delay(3, 6)
        
        # Scroll léger = comportement humain
        await human_scroll(page)
        
        # Récupérer le contenu de la page
        content = await page.content()
        
        # Détecter le statut du profil
        if "Ce compte est privé" in content or "This Account is Private" in content:
            status = "private"
            needs_check_b = False
            log.info(f"@{username} : Compte privé")
        elif "Utilisateur introuvable" in content or "Sorry, this page" in content or "Page not found" in content:
            status = "invisible"
            needs_check_b = True
            log.info(f"@{username} : Utilisateur introuvable (supprimé ou bloqué)")
        elif username.lower() in content.lower():
            status = "visible"
            needs_check_b = False
            log.info(f"@{username} : Profil visible")
        else:
            status = "unknown"
            needs_check_b = True
            log.warning(f"@{username} : Statut inconnu")
        
        return {
            "username": username,
            "status": status,
            "checked_at": datetime.now(datetime.UTC).isoformat(),
            "needs_check_b": needs_check_b
        }
    
    except Exception as e:
        log.error(f"Erreur lors de la vérification de @{username}: {e}")
        return {
            "username": username,
            "status": "unknown",
            "checked_at": datetime.now(datetime.UTC).isoformat(),
            "needs_check_b": True
        }


async def human_break(duration_min=2, duration_max=5):
    """Pause plus longue pour simuler une pause naturelle (aller chercher à boire, etc.)."""
    delay = random.uniform(duration_min * 60, duration_max * 60)
    log.info(f"Pause naturelle de {delay/60:.1f} minutes")
    await asyncio.sleep(delay)


async def run_check_async():
    """Fonction asynchrone pour vérifier les comptes avec Playwright."""
    log.info("=== Début du check Agent A ===")
    conn = get_conn()

    try:
        update_agent_heartbeat(conn)
        clients = get_active_clients(conn)
        log.info(f"{len(clients)} client(s) actif(s) à vérifier")

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
            
            # Traiter chaque client
            for client in clients:
                client_id = client["client_id"]
                client_username = client["instagram_username"]
                
                log.info(f"Client {client_id} (@{client_username})")
                
                # Récupérer les 50 followers du client
                current_followers = await get_followers_list(page, client_username, max_count=50)
                
                if not current_followers:
                    log.warning(f"Aucun follower récupéré pour @{client_username}")
                    continue
                
                log.info(f"{len(current_followers)} followers récupérés pour @{client_username}")
                
                # Récupérer les followers précédents
                previous_followers = get_previous_followers(conn, client_id)
                log.info(f"{len(previous_followers)} followers dans le snapshot précédent")
                
                # Comparer et détecter les manquants
                missing_followers = compare_followers(previous_followers, current_followers)
                
                if missing_followers:
                    log.info(f"{len(missing_followers)} follower(s) manquant(s) détecté(s)")
                    
                    # Sauvegarder chaque follower manquant
                    for username in missing_followers:
                        save_missing_follower(conn, client_id, username)
                    
                    # Créer un Event pour déclencher Agent B
                    create_check_b_event(conn, client_id, len(missing_followers))
                else:
                    log.info("Aucun follower manquant détecté")
                
                # Sauvegarder les followers actuels
                for follower in current_followers:
                    save_snapshot(
                        conn, 
                        client_id, 
                        follower['username'], 
                        follower.get('user_id'), 
                        'following'
                    )
                
                log.info(f"Snapshots sauvegardés pour {len(current_followers)} followers")
                
                # Pause entre clients
                await human_delay(8, 20)
            
            # Sauvegarder les cookies avant de fermer
            await save_session_cookies(context)
            
            # Fermer le navigateur
            await browser.close()
            log.info("Navigateur fermé")
    
    except Exception as e:
        log.error(f"Erreur durant le check : {e}", exc_info=True)
    finally:
        conn.close()
    
    log.info("=== Fin du check Agent A ===")


def run_check():
    """Wrapper synchrone pour run_check_async."""
    asyncio.run(run_check_async())


if __name__ == "__main__":
    scheduler = BlockingScheduler(timezone="Europe/Paris")

    scheduler.add_job(
        run_check,
        CronTrigger(hour="4,10,16,22", minute=0),
        id="agent_a_check",
        name="Agent A — snapshot check",
        max_instances=1,
        misfire_grace_time=3600
    )

    log.info("Agent A démarré — checks planifiés à 4h / 10h / 16h / 22h")

    if os.environ.get("RUN_ON_START", "false").lower() == "true":
        log.info("RUN_ON_START activé — lancement immédiat")
        run_check()

    try:
        scheduler.start()
    except KeyboardInterrupt:
        log.info("Agent A arrêté.")
