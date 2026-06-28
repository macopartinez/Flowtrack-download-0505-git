"""
Agent Pro - Surveillance des Clients (Growth Accounts)
Rôle : Surveiller les métriques avancées des clients (posts, vues, engagement)
Cron : Toutes les 6 heures
"""

import os
import asyncio
import json
import sqlite3
import random
import logging
import re
from datetime import datetime, timedelta
from pathlib import Path

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv
from playwright.async_api import async_playwright

load_dotenv()

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'server', 'waler.db')

AGENT_INSTAGRAM_USER = os.environ.get("AGENT_C_INSTAGRAM_USER")
AGENT_INSTAGRAM_PASS = os.environ.get("AGENT_C_INSTAGRAM_PASS")

SESSION_FILE = Path(f"session-agent-pro-{AGENT_INSTAGRAM_USER}.json")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [Agent Pro Clients] %(levelname)s — %(message)s"
)
log = logging.getLogger("agent_pro_clients")


def get_conn():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_pro_clients(conn):
    """Récupère tous les clients des utilisateurs Pro."""
    cur = conn.cursor()
    cur.execute("""
        SELECT c.id AS client_id,
               c.instagram_username,
               c.display_name,
               c.coach_user_id
        FROM clients c
        JOIN users u ON u.id = c.coach_user_id
        WHERE u.subscription_tier = 'pro'
          AND u.subscription_status = 'active'
        ORDER BY c.created_at DESC
    """)
    return [dict(row) for row in cur.fetchall()]


def save_advanced_metrics(conn, client_id, metrics):
    """Sauvegarde les métriques avancées d'un client."""
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO client_advanced_metrics
            (client_id, posts_count, total_views, average_views_per_post,
             engagement_rate, last_post_date, posts_this_day, posts_this_week,
             posts_this_month, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (
        client_id,
        metrics.get('posts_count', 0),
        metrics.get('total_views', 0),
        metrics.get('average_views_per_post', 0),
        metrics.get('engagement_rate', 0.0),
        metrics.get('last_post_date'),
        metrics.get('posts_this_day', 0),
        metrics.get('posts_this_week', 0),
        metrics.get('posts_this_month', 0)
    ))
    conn.commit()
    log.info(f"Métriques avancées sauvegardées pour client {client_id}")


def save_client_post(conn, client_id, post_data):
    """Sauvegarde ou met à jour un post d'un client."""
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO client_posts
            (client_id, post_id, post_url, post_type, caption,
             likes_count, comments_count, views_count, posted_at, detected_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(client_id, post_id) DO UPDATE SET
            likes_count = excluded.likes_count,
            comments_count = excluded.comments_count,
            views_count = excluded.views_count,
            last_updated_at = CURRENT_TIMESTAMP
    """, (
        client_id,
        post_data['post_id'],
        post_data.get('post_url'),
        post_data.get('post_type', 'photo'),
        post_data.get('caption'),
        post_data.get('likes_count', 0),
        post_data.get('comments_count', 0),
        post_data.get('views_count', 0),
        post_data.get('posted_at')
    ))
    conn.commit()


def update_milestone_progress(conn, client_id, metrics):
    """Met à jour automatiquement les milestones basés sur les métriques."""
    cur = conn.cursor()
    
    # Récupérer les milestones actifs du client
    cur.execute("""
        SELECT id, title, completed
        FROM milestones
        WHERE client_id = ? AND completed = 0
    """, (client_id,))
    
    milestones = cur.fetchall()
    
    for milestone in milestones:
        title = milestone['title'].lower()
        
        # Vérifier les différents types de milestones
        if 'followers' in title:
            # Déjà géré par agent_c.py
            pass
        elif 'posts' in title:
            if 'daily' in title or 'jour' in title:
                if metrics.get('posts_this_day', 0) >= extract_number(title):
                    complete_milestone(conn, milestone['id'])
            elif 'weekly' in title or 'semaine' in title:
                if metrics.get('posts_this_week', 0) >= extract_number(title):
                    complete_milestone(conn, milestone['id'])
            elif 'monthly' in title or 'mois' in title:
                if metrics.get('posts_this_month', 0) >= extract_number(title):
                    complete_milestone(conn, milestone['id'])
        elif 'views' in title or 'vues' in title:
            if metrics.get('total_views', 0) >= extract_number(title):
                complete_milestone(conn, milestone['id'])
        elif 'engagement' in title:
            if metrics.get('engagement_rate', 0) >= extract_number(title):
                complete_milestone(conn, milestone['id'])


def extract_number(text):
    """Extrait le premier nombre d'un texte."""
    match = re.search(r'\d+', text)
    return int(match.group()) if match else 0


def complete_milestone(conn, milestone_id):
    """Marque un milestone comme complété."""
    cur = conn.cursor()
    cur.execute("""
        UPDATE milestones
        SET completed = 1, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (milestone_id,))
    conn.commit()
    log.info(f"✅ Milestone {milestone_id} complété automatiquement")


async def load_session_cookies():
    """Charge les cookies de session."""
    if SESSION_FILE.exists():
        with open(SESSION_FILE, 'r') as f:
            cookies = json.load(f)
            log.info(f"Session chargée depuis {SESSION_FILE}")
            return cookies
    return None


async def save_session_cookies(context):
    """Sauvegarde les cookies de session."""
    cookies = await context.cookies()
    with open(SESSION_FILE, 'w') as f:
        json.dump(cookies, f, indent=2)
    log.info(f"Session sauvegardée dans {SESSION_FILE}")


async def human_delay(min_s=2.0, max_s=6.0):
    """Délai aléatoire pour simuler un comportement humain."""
    delay = random.uniform(min_s, max_s)
    await asyncio.sleep(delay)


async def human_scroll(page):
    """Scroll léger pour simuler un comportement humain."""
    scroll_amount = random.randint(100, 300)
    await page.mouse.wheel(0, scroll_amount)
    await asyncio.sleep(random.uniform(1, 3))
    log.debug(f"Scroll de {scroll_amount}px")


async def human_break(duration_min=2, duration_max=5):
    """Pause plus longue pour simuler une pause naturelle."""
    delay = random.uniform(duration_min * 60, duration_max * 60)
    log.info(f"⏸️ Pause naturelle de {delay/60:.1f} minutes")
    await asyncio.sleep(delay)


async def safe_click(page, selectors: list, description: str = "element"):
    """Essaie plusieurs sélecteurs jusqu'à ce qu'un fonctionne."""
    for selector in selectors:
        try:
            log.info(f"Tentative de clic sur {description} avec: {selector}")
            element = page.locator(selector).first
            await element.click(timeout=5000)
            log.info(f"✅ Clic réussi sur {description}")
            return True
        except:
            continue
    
    log.error(f"❌ Aucun sélecteur n'a fonctionné pour {description}")
    await page.screenshot(path=f"debug_{description.replace(' ', '_')}_error.png")
    log.info(f"Screenshot sauvegardé: debug_{description.replace(' ', '_')}_error.png")
    return False


async def get_profile_advanced_stats(page, username: str) -> dict:
    """Récupère les statistiques avancées d'un profil Instagram."""
    try:
        await human_delay(2, 4)
        log.info(f"Récupération des stats avancées de @{username}")
        
        await page.goto(f"https://www.instagram.com/{username}/", wait_until="domcontentloaded")
        
        # Attendre que la page soit complètement chargée
        try:
            await page.wait_for_load_state('networkidle', timeout=10000)
        except:
            log.warning("Timeout networkidle, continuation...")
        
        await human_delay(3, 5)
        
        # Scroll léger pour simuler un comportement humain
        await human_scroll(page)
        
        stats = {
            'username': username,
            'posts_count': 0,
            'followers_count': 0,
            'following_count': 0,
            'total_views': 0,
            'average_views_per_post': 0,
            'engagement_rate': 0.0,
            'last_post_date': None,
            'posts_this_day': 0,
            'posts_this_week': 0,
            'posts_this_month': 0,
            'recent_posts': []
        }
        
        # Récupérer le nombre de posts
        try:
            posts_text = await page.locator('header section ul li:first-child span').first.text_content()
            stats['posts_count'] = int(posts_text.replace(',', '').replace('.', ''))
            log.info(f"Posts: {stats['posts_count']}")
        except:
            log.warning("Impossible de récupérer le nombre de posts")
        
        # Récupérer les posts récents
        try:
            # Attendre que les posts se chargent
            await page.wait_for_selector('article a[href*="/p/"]', timeout=5000)
            
            # Récupérer les 12 premiers posts
            post_links = await page.locator('article a[href*="/p/"]').all()
            
            now = datetime.now()
            today = now.date()
            week_ago = (now - timedelta(days=7)).date()
            month_ago = (now - timedelta(days=30)).date()
            
            for i, link in enumerate(post_links[:12]):
                try:
                    href = await link.get_attribute('href')
                    post_id = href.split('/p/')[1].split('/')[0] if '/p/' in href else None
                    
                    if post_id:
                        # Cliquer sur le post pour voir les détails
                        await link.click()
                        await human_delay(2, 3)
                        
                        # Récupérer les stats du post
                        post_data = {
                            'post_id': post_id,
                            'post_url': f"https://www.instagram.com/p/{post_id}/",
                            'post_type': 'photo',
                            'likes_count': 0,
                            'comments_count': 0,
                            'views_count': 0,
                            'posted_at': None
                        }
                        
                        # Likes
                        try:
                            likes_text = await page.locator('section span').first.text_content()
                            if 'likes' in likes_text.lower() or 'j\'aime' in likes_text.lower():
                                post_data['likes_count'] = int(re.search(r'[\d,\.]+', likes_text).group().replace(',', '').replace('.', ''))
                        except:
                            pass
                        
                        # Comments
                        try:
                            comments_text = await page.locator('ul li span').text_content()
                            if 'comment' in comments_text.lower():
                                post_data['comments_count'] = int(re.search(r'\d+', comments_text).group())
                        except:
                            pass
                        
                        # Views (pour les vidéos/reels)
                        try:
                            views_text = await page.locator('span:has-text("views")').first.text_content()
                            if views_text:
                                post_data['views_count'] = int(re.search(r'[\d,\.]+', views_text).group().replace(',', '').replace('.', ''))
                                post_data['post_type'] = 'video'
                                stats['total_views'] += post_data['views_count']
                        except:
                            pass
                        
                        # Date (approximative basée sur la position)
                        # Les posts les plus récents sont en premier
                        days_ago = i  # Approximation simple
                        post_date = (now - timedelta(days=days_ago)).date()
                        post_data['posted_at'] = post_date.isoformat()
                        
                        if i == 0:
                            stats['last_post_date'] = post_data['posted_at']
                        
                        # Compter les posts par période
                        if post_date == today:
                            stats['posts_this_day'] += 1
                        if post_date >= week_ago:
                            stats['posts_this_week'] += 1
                        if post_date >= month_ago:
                            stats['posts_this_month'] += 1
                        
                        stats['recent_posts'].append(post_data)
                        
                        # Fermer le post
                        await page.keyboard.press('Escape')
                        await human_delay(1, 2)
                        
                except Exception as e:
                    log.error(f"Erreur lors de la récupération du post {i}: {e}")
                    continue
            
            # Calculer le taux d'engagement moyen
            if stats['recent_posts'] and stats['followers_count'] > 0:
                total_engagement = sum(p['likes_count'] + p['comments_count'] for p in stats['recent_posts'])
                stats['engagement_rate'] = (total_engagement / (len(stats['recent_posts']) * stats['followers_count'])) * 100
            
            # Calculer la moyenne de vues par post
            if stats['total_views'] > 0:
                video_posts = [p for p in stats['recent_posts'] if p['post_type'] == 'video']
                if video_posts:
                    stats['average_views_per_post'] = stats['total_views'] // len(video_posts)
            
        except Exception as e:
            log.error(f"Erreur lors de la récupération des posts: {e}")
        
        return stats
    
    except Exception as e:
        log.error(f"Erreur lors de la récupération des stats de @{username}: {e}")
        return None


async def run_check_async():
    """Fonction asynchrone pour vérifier les clients Pro."""
    log.info("=== Début du check Agent Pro Clients ===")
    conn = get_conn()

    try:
        # Récupérer tous les clients Pro
        clients = get_pro_clients(conn)
        
        if not clients:
            log.info("Aucun client Pro à vérifier")
            return
        
        log.info(f"{len(clients)} client(s) Pro à vérifier")

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=False,
                slow_mo=random.randint(50, 150),
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox'
                ]
            )
            
            context = await browser.new_context(
                viewport={'width': 1280, 'height': 800},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                locale='fr-FR',
                timezone_id='Europe/Paris'
            )
            
            # Charger les cookies
            cookies = await load_session_cookies()
            if cookies:
                await context.add_cookies(cookies)
                log.info("Session chargée")
            else:
                log.warning("Première connexion requise")
            
            page = await context.new_page()
            
            # Connexion si nécessaire
            if not cookies:
                await page.goto("https://www.instagram.com/", wait_until="domcontentloaded")
                await human_delay(3, 6)
                
                # Connexion automatique
                log.info(f"Connexion avec {AGENT_INSTAGRAM_USER}...")
                try:
                    await page.fill('input[name="username"]', AGENT_INSTAGRAM_USER)
                    await human_delay(1, 2)
                    await page.fill('input[name="password"]', AGENT_INSTAGRAM_PASS)
                    await human_delay(1, 2)
                    await page.click('button[type="submit"]')
                    await human_delay(5, 8)
                    
                    # Gérer les popups "Enregistrer les infos" et "Notifications"
                    try:
                        await page.click('button:has-text("Pas maintenant")', timeout=5000)
                        await human_delay(1, 2)
                    except:
                        pass
                    
                    try:
                        await page.click('button:has-text("Pas maintenant")', timeout=5000)
                        await human_delay(1, 2)
                    except:
                        pass
                    
                    log.info("✅ Connexion réussie")
                    await save_session_cookies(context)
                except Exception as e:
                    log.error(f"❌ Erreur de connexion: {e}")
                    log.info("Attendez 60 secondes pour vous connecter manuellement...")
                    await asyncio.sleep(60)
                    await save_session_cookies(context)
            
            # Limiter à 5 profils par session pour éviter la détection
            MAX_PROFILES_PER_SESSION = 5
            clients_to_process = clients[:MAX_PROFILES_PER_SESSION]
            
            if len(clients) > MAX_PROFILES_PER_SESSION:
                log.info(f"⚠️ Limitation à {MAX_PROFILES_PER_SESSION} clients sur {len(clients)} total")
            
            # Traiter chaque client
            for idx, client in enumerate(clients_to_process, 1):
                client_id = client['client_id']
                client_username = client['instagram_username']
                
                log.info(f"Client {idx}/{len(clients_to_process)}: @{client_username}")
                
                # Récupérer les stats avancées
                stats = await get_profile_advanced_stats(page, client_username)
                
                if stats:
                    # Sauvegarder les métriques avancées
                    save_advanced_metrics(conn, client_id, stats)
                    
                    # Sauvegarder chaque post
                    for post in stats.get('recent_posts', []):
                        save_client_post(conn, client_id, post)
                    
                    # Mettre à jour les milestones
                    update_milestone_progress(conn, client_id, stats)
                    
                    log.info(f"✅ Stats complètes pour @{client_username}: {stats['posts_count']} posts, {stats['posts_this_week']} cette semaine")
                
                # Pause entre profils
                if idx < len(clients_to_process):
                    await human_delay(8, 15)
                
                # Pause naturelle tous les 3 profils
                if idx % 3 == 0 and idx < len(clients_to_process):
                    await human_break(2, 4)
            
            # Sauvegarder les cookies
            await save_session_cookies(context)
            
            await browser.close()
            log.info("Navigateur fermé")
    
    except Exception as e:
        log.error(f"Erreur durant le check : {e}", exc_info=True)
    finally:
        conn.close()
    
    log.info("=== Fin du check Agent Pro Clients ===")


def run_check():
    """Wrapper synchrone."""
    asyncio.run(run_check_async())


if __name__ == "__main__":
    scheduler = BlockingScheduler(timezone="Europe/Paris")

    scheduler.add_job(
        run_check,
        CronTrigger(hour="*/6"),  # Toutes les 6 heures
        id="agent_pro_clients_check",
        name="Agent Pro — Clients advanced check",
        max_instances=1,
        misfire_grace_time=3600
    )

    log.info("Agent Pro Clients démarré — checks toutes les 6 heures")

    if os.environ.get("RUN_ON_START", "false").lower() == "true":
        log.info("RUN_ON_START activé — lancement immédiat")
        run_check()

    try:
        scheduler.start()
    except KeyboardInterrupt:
        log.info("Agent Pro Clients arrêté.")
