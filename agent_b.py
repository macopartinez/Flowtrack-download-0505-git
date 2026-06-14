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


def get_queue_files():
    """Récupère les fichiers de queue JSON."""
    queue_files = list(Path('.').glob('agent-b-queue-*.json'))
    log.info(f"Trouvé {len(queue_files)} fichier(s) de queue")
    return queue_files


def load_queue_file(queue_file):
    """Charge un fichier de queue JSON."""
    try:
        with open(queue_file, 'r') as f:
            data = json.load(f)
        log.info(f"Queue chargée depuis {queue_file}")
        return data
    except Exception as e:
        log.error(f"Erreur lors du chargement de {queue_file}: {e}")
        return None


def delete_queue_file(queue_file):
    """Supprime un fichier de queue après traitement."""
    try:
        queue_file.unlink()
        log.info(f"Queue supprimée: {queue_file}")
    except Exception as e:
        log.error(f"Erreur lors de la suppression de {queue_file}: {e}")


def save_unfollower_result(conn, user_id: int, username: str, status: str):
    """Sauvegarde le résultat de vérification dans la table unfollowers."""
    try:
        with conn.cursor() as cur:
            # Vérifier si l'unfollower existe déjà
            cur.execute("""
                SELECT id FROM unfollowers 
                WHERE user_id = %s AND username = %s
            """, (user_id, username))
            
            existing = cur.fetchone()
            
            if not existing:
                # Insérer avec le status
                cur.execute("""
                    INSERT INTO unfollowers (user_id, username, status, detected_at, verified_at)
                    VALUES (%s, %s, %s, NOW(), NOW())
                """, (user_id, username, status))
                log.info(f"✅ Unfollower créé: @{username} → {status}")
            else:
                # Mettre à jour le status et verified_at
                cur.execute("""
                    UPDATE unfollowers 
                    SET status = %s, verified_at = NOW()
                    WHERE user_id = %s AND username = %s
                """, (status, user_id, username))
                log.info(f"✅ Unfollower mis à jour: @{username} → {status}")
        
        conn.commit()
    except Exception as e:
        log.error(f"❌ Erreur lors de la sauvegarde de @{username}: {e}")
        conn.rollback()


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


async def search_username_on_google(page, username: str) -> bool:
    """
    Recherche un username sur Google avec site:instagram.com
    Retourne True si trouvé, False sinon
    """
    try:
        await human_delay(2, 4)
        
        search_query = f"site:instagram.com {username}"
        log.info(f"Recherche Google: {search_query}")
        
        await page.goto(f"https://www.google.com/search?q={search_query}", wait_until="domcontentloaded")
        await human_delay(2, 4)
        
        content = await page.content()
        
        # Vérifier si des résultats Instagram sont présents
        if f"instagram.com/{username}" in content.lower():
            log.info(f"@{username} trouvé sur Google (compte existe)")
            return True
        else:
            log.info(f"@{username} non trouvé sur Google (compte supprimé)")
            return False
    
    except Exception as e:
        log.error(f"Erreur lors de la recherche Google de @{username}: {e}")
        return False


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
        page_html = await page.inner_html('body')
        
        # Détecter le type
        # Si l'Agent B est appelé, c'est que l'extension n'a PAS trouvé le profil (not found)
        # Donc si l'Agent B trouve le profil → l'utilisateur est BLOQUÉ
        
        if "Vous ne pouvez pas accéder" in content or "You can't access" in content or "This Account is Private" in content:
            log.info(f"@{username} : Compte bloqué (message explicite)")
            return 'blocked'
        elif ("Utilisateur introuvable" in content or 
              "Sorry, this page" in content or 
              "isn't available" in content or
              "Page not found" in content or
              "Page Not Found" in page_html):
            log.info(f"@{username} : Compte supprimé (page introuvable)")
            return 'deleted'
        else:
            # L'extension n'a pas trouvé le profil, mais l'Agent B le trouve
            # → L'utilisateur est BLOQUÉ par le compte principal
            log.info(f"@{username} : Bloqué (profil existe pour Agent B mais pas pour l'utilisateur)")
            return 'blocked'
    
    except Exception as e:
        log.error(f"Erreur lors de la vérification de @{username}: {e}")
        return 'unfollow'  # Par défaut


async def verify_missing_via_google(page, username: str) -> str:
    """
    Vérifie un username non trouvé sur Instagram via recherche Google.
    Retourne: 'blocked' si trouvé sur Google, 'deleted' sinon
    """
    found_on_google = await search_username_on_google(page, username)
    
    if found_on_google:
        log.info(f"@{username} : Bloqué (trouvé sur Google mais pas sur Instagram)")
        return 'blocked'
    else:
        log.info(f"@{username} : Compte supprimé (non trouvé nulle part)")
        return 'deleted'


async def run_check_async():
    """Fonction asynchrone pour vérifier les types d'unfollow."""
    log.info("=== Début du check Agent B ===")
    conn = get_conn()

    try:
        update_agent_heartbeat(conn)
        
        # Récupérer les fichiers de queue
        queue_files = get_queue_files()
        
        if not queue_files:
            log.info("Aucune queue à traiter")
            return
        
        log.info(f"{len(queue_files)} queue(s) à traiter")

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
            
            # Traiter chaque fichier de queue
            for queue_file in queue_files:
                queue_data = load_queue_file(queue_file)
                
                if not queue_data:
                    continue
                
                user_id = queue_data.get('userId')
                missing_usernames = queue_data.get('missingUsernames', [])
                
                log.info(f"Traitement de la queue pour user {user_id}")
                log.info(f"{len(missing_usernames)} username(s) à vérifier")
                
                if not missing_usernames:
                    log.warning(f"Aucun username à vérifier dans {queue_file}")
                    delete_queue_file(queue_file)
                    continue
                
                # Limiter le nombre de vérifications
                usernames_to_check = missing_usernames[:MAX_CHECKS_PER_SESSION]
                if len(missing_usernames) > MAX_CHECKS_PER_SESSION:
                    log.warning(f"Limitation à {MAX_CHECKS_PER_SESSION} vérifications (sur {len(missing_usernames)} total)")
                
                # Vérifier chaque username via navigation directe Instagram
                for idx, username in enumerate(usernames_to_check, 1):
                    # Délai humain entre chaque vérification
                    if idx > 1:
                        await human_delay(5, 10)
                    
                    log.info(f"Vérification Instagram {idx}/{len(usernames_to_check)}: @{username}")
                    
                    # Navigation directe vers le profil pour déterminer blocked/deleted/unfollowed
                    unfollow_type = await detect_unfollow_type(page, username)
                    
                    log.info(f"@{username} : {unfollow_type}")
                    
                    # Sauvegarder dans la base de données
                    save_unfollower_result(conn, user_id, username, unfollow_type)
                    
                    # Pause tous les 5 comptes
                    if idx % 5 == 0 and idx < len(usernames_to_check):
                        await human_break(duration_min=1, duration_max=2)
                
                # Supprimer le fichier de queue après traitement
                delete_queue_file(queue_file)
                log.info(f"Queue {queue_file} traitée avec succès")
            
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
