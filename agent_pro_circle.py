"""
Agent Pro - Surveillance du Cercle/Prospects
Rôle : Surveiller les interactions, likes, connexions et générer des scores
Cron : Toutes les 4 heures
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
from collections import defaultdict

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv
from playwright.async_api import async_playwright

load_dotenv()

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'server', 'waler.db')

AGENT_INSTAGRAM_USER = os.environ.get("AGENT_C_INSTAGRAM_USER")
AGENT_INSTAGRAM_PASS = os.environ.get("AGENT_C_INSTAGRAM_PASS")

SESSION_FILE = Path(f"session-agent-circle-{AGENT_INSTAGRAM_USER}.json")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [Agent Pro Circle] %(levelname)s — %(message)s"
)
log = logging.getLogger("agent_pro_circle")


def get_conn():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_pro_users(conn):
    """Récupère tous les utilisateurs Pro."""
    cur = conn.cursor()
    cur.execute("""
        SELECT id, username, platform
        FROM users
        WHERE subscription_tier = 'pro'
          AND subscription_status = 'active'
    """)
    return [dict(row) for row in cur.fetchall()]


def get_prospects_to_analyze(conn, user_id):
    """Récupère les prospects à analyser pour un utilisateur Pro."""
    cur = conn.cursor()
    cur.execute("""
        SELECT id, member_username, full_name, category
        FROM circle_members
        WHERE user_id = ?
          AND category = 'prospect'
        ORDER BY created_at DESC
        LIMIT 30
    """, (user_id,))
    return [dict(row) for row in cur.fetchall()]


def get_or_create_circle_member(conn, user_id, member_username, member_data):
    """Récupère ou crée un membre du cercle."""
    cur = conn.cursor()
    
    # Vérifier si existe
    cur.execute("""
        SELECT id FROM circle_members
        WHERE user_id = ? AND member_username = ?
    """, (user_id, member_username))
    
    existing = cur.fetchone()
    
    if existing:
        # Mettre à jour
        cur.execute("""
            UPDATE circle_members
            SET full_name = ?,
                profile_pic_url = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (
            member_data.get('full_name'),
            member_data.get('profile_pic_url'),
            existing['id']
        ))
        conn.commit()
        return existing['id']
    else:
        # Créer
        cur.execute("""
            INSERT INTO circle_members
                (user_id, member_username, member_user_id, full_name,
                 profile_pic_url, category, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (
            user_id,
            member_username,
            member_data.get('user_id'),
            member_data.get('full_name'),
            member_data.get('profile_pic_url'),
            member_data.get('category', 'prospect')
        ))
        conn.commit()
        return cur.lastrowid


def save_liked_post(conn, member_id, post_data):
    """Sauvegarde un post liké."""
    cur = conn.cursor()
    cur.execute("""
        INSERT OR IGNORE INTO liked_posts
            (circle_member_id, post_id, post_url, post_owner_username, liked_at)
        VALUES (?, ?, ?, ?, ?)
    """, (
        member_id,
        post_data['post_id'],
        post_data.get('post_url'),
        post_data.get('post_owner'),
        post_data.get('liked_at', datetime.now().isoformat())
    ))
    conn.commit()


def add_timeline_event(conn, member_id, event_type, event_data):
    """Ajoute un événement à la timeline."""
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO timeline_events
            (circle_member_id, event_type, event_data, detected_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    """, (member_id, event_type, json.dumps(event_data)))
    conn.commit()
    log.info(f"Timeline event: {event_type} pour member {member_id}")


def detect_and_save_signals(conn, member_id, signals):
    """Détecte et sauvegarde les signaux."""
    cur = conn.cursor()
    
    for signal in signals:
        cur.execute("""
            INSERT INTO detected_signals
                (circle_member_id, signal_type, signal_strength, signal_data, detected_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            member_id,
            signal['type'],
            signal.get('strength', 50),
            json.dumps(signal.get('data', {}))
        ))
    
    conn.commit()
    log.info(f"Signaux détectés: {len(signals)} pour member {member_id}")


def calculate_relationship_score(conn, member_id):
    """Calcule le score de relation basé sur les interactions."""
    cur = conn.cursor()
    
    # Récupérer les données du membre
    cur.execute("""
        SELECT total_likes_given, total_likes_received,
               consecutive_likes_streak, days_since_first_like,
               mutual_followers_count
        FROM circle_members
        WHERE id = ?
    """, (member_id,))
    
    member = cur.fetchone()
    if not member:
        return 0
    
    score = 0
    
    # Likes donnés (max 30 points)
    score += min(member['total_likes_given'] * 2, 30)
    
    # Likes reçus (max 20 points)
    score += min(member['total_likes_received'] * 2, 20)
    
    # Streak de likes consécutifs (max 20 points)
    score += min(member['consecutive_likes_streak'] * 4, 20)
    
    # Ancienneté de la relation (max 15 points)
    score += min(member['days_since_first_like'] // 7, 15)
    
    # Connexions mutuelles (max 15 points)
    score += min(member['mutual_followers_count'], 15)
    
    # Récupérer les événements de timeline récents
    cur.execute("""
        SELECT event_type, COUNT(*) as count
        FROM timeline_events
        WHERE circle_member_id = ?
          AND detected_at >= datetime('now', '-30 days')
        GROUP BY event_type
    """, (member_id,))
    
    events = cur.fetchall()
    
    # Bonus pour interactions variées
    if len(events) > 3:
        score += 10
    
    # Pénalité pour unfollow
    for event in events:
        if event['event_type'] == 'unfollow':
            score -= 20
        elif event['event_type'] == 'follow_back':
            score += 10
    
    # Limiter le score entre 0 et 100
    score = max(0, min(100, score))
    
    # Mettre à jour le score
    cur.execute("""
        UPDATE circle_members
        SET relationship_score = ?
        WHERE id = ?
    """, (score, member_id))
    conn.commit()
    
    return score


def analyze_follow_like_correlation(conn, member_id):
    """Analyse la corrélation entre follow/unfollow et les likes."""
    cur = conn.cursor()
    
    # Récupérer tous les événements triés par date
    cur.execute("""
        SELECT event_type, detected_at
        FROM timeline_events
        WHERE circle_member_id = ?
        ORDER BY detected_at ASC
    """, (member_id,))
    
    events = cur.fetchall()
    
    # Récupérer les likes
    cur.execute("""
        SELECT liked_at
        FROM liked_posts
        WHERE circle_member_id = ?
        ORDER BY liked_at ASC
    """, (member_id,))
    
    likes = cur.fetchall()
    
    signals = []
    
    # Analyser les patterns
    for i, event in enumerate(events):
        if event['event_type'] == 'follow':
            # Compter les likes dans les 7 jours suivants
            follow_date = datetime.fromisoformat(event['detected_at'])
            likes_after = 0
            
            for like in likes:
                like_date = datetime.fromisoformat(like['liked_at'])
                if 0 <= (like_date - follow_date).days <= 7:
                    likes_after += 1
            
            if likes_after >= 3:
                signals.append({
                    'type': 'follow_then_engage',
                    'strength': min(100, likes_after * 20),
                    'data': {
                        'likes_count': likes_after,
                        'days_after_follow': 7
                    }
                })
        
        elif event['event_type'] == 'unfollow':
            # Compter les likes dans les 7 jours précédents
            unfollow_date = datetime.fromisoformat(event['detected_at'])
            likes_before = 0
            
            for like in likes:
                like_date = datetime.fromisoformat(like['liked_at'])
                if 0 <= (unfollow_date - like_date).days <= 7:
                    likes_before += 1
            
            if likes_before >= 2:
                signals.append({
                    'type': 'engage_then_unfollow',
                    'strength': 60,
                    'data': {
                        'likes_count': likes_before,
                        'days_before_unfollow': 7
                    }
                })
    
    return signals


def analyze_like_patterns(conn, member_id):
    """Analyse les patterns de likes pour détecter des signaux."""
    cur = conn.cursor()
    
    # Récupérer les likes récents
    cur.execute("""
        SELECT liked_at
        FROM liked_posts
        WHERE circle_member_id = ?
        ORDER BY liked_at DESC
        LIMIT 50
    """, (member_id,))
    
    likes = cur.fetchall()
    
    if not likes:
        return []
    
    signals = []
    
    # Calculer l'écart moyen entre les likes
    if len(likes) > 1:
        deltas = []
        for i in range(len(likes) - 1):
            try:
                date1 = datetime.fromisoformat(likes[i]['liked_at'])
                date2 = datetime.fromisoformat(likes[i+1]['liked_at'])
                delta = (date1 - date2).total_seconds() / 3600  # en heures
                deltas.append(delta)
            except:
                continue
        
        if deltas:
            avg_delta = sum(deltas) / len(deltas)
            
            # Signal: Liker consécutif (likes très rapprochés)
            if avg_delta < 24:  # Moins de 24h entre les likes
                signals.append({
                    'type': 'consistent_liker',
                    'strength': min(100, int(100 / (avg_delta + 1))),
                    'data': {'average_hours_between_likes': avg_delta}
                })
            
            # Signal: Engagement élevé
            if len(likes) > 10 and avg_delta < 48:
                signals.append({
                    'type': 'high_engagement',
                    'strength': 80,
                    'data': {'total_likes': len(likes), 'avg_delta_hours': avg_delta}
                })
    
    # Calculer le streak de likes consécutifs
    streak = 0
    last_date = None
    for like in reversed(likes):
        try:
            like_date = datetime.fromisoformat(like['liked_at']).date()
            if last_date is None:
                streak = 1
            elif (last_date - like_date).days <= 1:
                streak += 1
            else:
                break
            last_date = like_date
        except:
            continue
    
    # Mettre à jour le streak
    cur.execute("""
        UPDATE circle_members
        SET consecutive_likes_streak = ?
        WHERE id = ?
    """, (streak, member_id))
    conn.commit()
    
    if streak >= 3:
        signals.append({
            'type': 'stalker',
            'strength': min(100, streak * 20),
            'data': {'consecutive_days': streak}
        })
    
    return signals


async def load_session_cookies():
    if SESSION_FILE.exists():
        try:
            with open(SESSION_FILE, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    log.warning(f"Fichier de cookies vide: {SESSION_FILE}")
                    return None
                return json.loads(content)
        except json.JSONDecodeError as e:
            log.error(f"Erreur de parsing JSON des cookies: {e}")
            log.info("Suppression du fichier de cookies corrompu")
            SESSION_FILE.unlink()
            return None
        except Exception as e:
            log.error(f"Erreur lors du chargement des cookies: {e}")
            return None
    return None


async def save_session_cookies(context):
    cookies = await context.cookies()
    with open(SESSION_FILE, 'w') as f:
        json.dump(cookies, f, indent=2)


async def human_delay(min_s=2.0, max_s=6.0):
    await asyncio.sleep(random.uniform(min_s, max_s))


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


def detect_mutual_connections(conn, member_id, user_id, all_prospects):
    """Détecte les connexions mutuelles entre l'utilisateur Pro et le membre du cercle."""
    cur = conn.cursor()
    
    # Récupérer les autres membres du cercle de cet utilisateur Pro
    cur.execute("""
        SELECT member_username, full_name
        FROM circle_members
        WHERE user_id = ? AND id != ?
    """, (user_id, member_id))
    
    other_members = cur.fetchall()
    other_usernames = {m['member_username'] for m in other_members}
    
    # Trouver les connexions communes parmi les prospects
    mutual_count = 0
    for prospect in all_prospects:
        prospect_username = prospect.get('member_username')
        if prospect_username and prospect_username in other_usernames:
            # Sauvegarder la connexion mutuelle
            try:
                cur.execute("""
                    INSERT OR IGNORE INTO mutual_connections
                        (circle_member_id, mutual_username, connection_type, detected_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                """, (
                    member_id,
                    prospect_username,
                    'mutual'
                ))
                mutual_count += 1
            except Exception as e:
                log.warning(f"Erreur sauvegarde connexion mutuelle: {e}")
                continue
    
    # Mettre à jour le compteur
    cur.execute("""
        UPDATE circle_members
        SET mutual_followers_count = ?
        WHERE id = ?
    """, (mutual_count, member_id))
    
    conn.commit()
    
    if mutual_count > 0:
        log.info(f"🔗 {mutual_count} connexion(s) mutuelle(s) détectée(s)")
    
    return mutual_count


async def check_if_user_is_follower(page, pro_username, prospect_username):
    """Vérifie si prospect_username suit pro_username."""
    try:
        # Aller sur le profil de l'utilisateur Pro
        await page.goto(f'https://www.instagram.com/{pro_username}/', wait_until='domcontentloaded')
        await human_delay(2, 3)
        
        # Cliquer sur le bouton "followers" - essayer plusieurs sélecteurs
        try:
            # Essayer différents sélecteurs possibles
            selectors = [
                f'a[href="/{pro_username}/followers/"]',
                'a[href*="/followers/"]',
                'a:has-text("followers")',
                'a:has-text("abonnés")',
            ]
            
            followers_button = None
            for selector in selectors:
                try:
                    followers_button = await page.wait_for_selector(selector, timeout=3000)
                    if followers_button:
                        break
                except:
                    continue
            
            if not followers_button:
                log.warning(f"Bouton followers non trouvé pour @{pro_username}")
                return False
            
            await followers_button.click()
            await human_delay(2, 3)
        except Exception as e:
            log.warning(f"Erreur lors du clic sur followers: {e}")
            return False
        
        # Attendre la modal des followers
        try:
            await page.wait_for_selector('div[role="dialog"]', timeout=10000)
        except:
            log.warning(f"Modal des followers non trouvée pour @{pro_username}")
            return False
        
        await human_delay(1, 2)
        
        # Chercher la barre de recherche dans la modal
        try:
            search_input = await page.wait_for_selector('div[role="dialog"] input[type="text"]', timeout=5000)
            await search_input.fill(prospect_username)
            await human_delay(2, 3)
            
            log.info(f"🔍 Recherche de @{prospect_username} dans les followers...")
            
            # Vérifier si le prospect apparaît dans les résultats
            links = await page.locator('div[role="dialog"] a[href^="/"]').all()
            
            for link in links:
                try:
                    href = await link.get_attribute('href')
                    if href:
                        follower_username = href.strip('/').split('/')[0]
                        if follower_username == prospect_username:
                            log.info(f"✅ @{prospect_username} trouvé dans les followers de @{pro_username}")
                            # Fermer la modal
                            await page.keyboard.press('Escape')
                            return True
                except:
                    continue
            
            log.info(f"⚠️ @{prospect_username} non trouvé dans les followers de @{pro_username}")
            # Fermer la modal
            await page.keyboard.press('Escape')
            return False
            
        except:
            log.warning(f"Barre de recherche non trouvée dans la modal des followers")
            # Fermer la modal
            await page.keyboard.press('Escape')
            return False
        
    except Exception as e:
        log.error(f"Erreur lors de la vérification du follower: {e}")
        return False


async def get_user_followers(page, username: str, max_count: int = 50):
    """Récupère les followers d'un utilisateur."""
    try:
        await human_delay(2, 4)
        log.info(f"Récupération des followers de @{username}")
        
        await page.goto(f"https://www.instagram.com/{username}/", wait_until="domcontentloaded")
        
        # Attendre que la page soit complètement chargée
        try:
            await page.wait_for_load_state('networkidle', timeout=10000)
        except:
            log.warning("Timeout networkidle, continuation...")
        
        await human_delay(3, 5)
        
        # Scroll léger pour simuler un comportement humain
        await human_scroll(page)
        
        # Cliquer sur followers avec fallback de sélecteurs
        selectors = [
            'a[href$="/followers/"]',
            'a[href*="/followers/"]:not([href*="/following/"])',
            'a:has-text("followers")'
        ]
        
        if not await safe_click(page, selectors, "followers"):
            return []
        
        await human_delay(2, 4)
        
        # Attendre la modal
        try:
            await page.wait_for_selector('div[role="dialog"]', timeout=10000)
        except:
            log.error("Modal followers non trouvée")
            return []
        
        followers = []
        seen = set()
        
        # Récupérer les followers visibles
        for _ in range(5):  # Scroll 5 fois
            links = await page.locator('div[role="dialog"] a[href^="/"]').all()
            
            for link in links:
                if len(followers) >= max_count:
                    break
                
                try:
                    href = await link.get_attribute('href')
                    if href and href.startswith('/'):
                        follower_username = href.strip('/').split('/')[0]
                        
                        if follower_username and follower_username not in seen:
                            seen.add(follower_username)
                            
                            # Récupérer le nom complet
                            full_name = None
                            try:
                                name_elem = link.locator('..').locator('span').first
                                full_name = await name_elem.text_content()
                            except:
                                pass
                            
                            followers.append({
                                'username': follower_username,
                                'full_name': full_name
                            })
                except:
                    continue
            
            # Scroll dans la modal
            await page.locator('div[role="dialog"]').evaluate('el => el.scrollTop = el.scrollHeight')
            await human_delay(1, 2)
        
        # Fermer la modal
        await page.keyboard.press('Escape')
        
        log.info(f"Récupéré {len(followers)} followers pour @{username}")
        return followers
    
    except Exception as e:
        log.error(f"Erreur lors de la récupération des followers: {e}")
        return []


async def get_posts_liked_by_prospect(page, pro_username, prospect_username, max_posts=10):
    """Récupère les posts de pro_username qui ont été likés par prospect_username."""
    liked_posts = []
    
    try:
        log.info(f"Recherche des posts de @{pro_username} likés par @{prospect_username}...")
        
        # Retourner sur le profil de l'utilisateur Pro si nécessaire
        current_url = page.url
        if pro_username not in current_url:
            await page.goto(f'https://www.instagram.com/{pro_username}/', wait_until='domcontentloaded')
            await human_delay(2, 3)
        
        # Récupérer les liens des posts récents
        post_links = await page.locator('article a[href*="/p/"]').all()
        post_links = post_links[:max_posts]  # Limiter au nombre max
        
        log.info(f"Analyse de {len(post_links)} posts de @{pro_username}...")
        
        for i, post_link in enumerate(post_links, 1):
            try:
                # Cliquer sur le post
                await post_link.click()
                await human_delay(2, 3)
                
                # Récupérer l'URL du post
                post_url = page.url
                post_id = post_url.split('/p/')[-1].split('/')[0] if '/p/' in post_url else None
                
                # Cliquer sur "J'aime" pour voir la liste
                try:
                    likes_button = await page.wait_for_selector('a[href*="/liked_by/"]', timeout=5000)
                    await likes_button.click()
                    await human_delay(2, 3)
                    
                    # Chercher le prospect dans la liste des likes
                    found = False
                    for _ in range(3):  # Scroll 3 fois max
                        links = await page.locator('div[role="dialog"] a[href^="/"]').all()
                        
                        for link in links:
                            try:
                                href = await link.get_attribute('href')
                                if href:
                                    liker_username = href.strip('/').split('/')[0]
                                    if liker_username == prospect_username:
                                        log.info(f"✅ Post {i}/{len(post_links)} liké par @{prospect_username}")
                                        liked_posts.append({
                                            'post_id': post_id,
                                            'post_url': post_url,
                                            'liked_at': datetime.now().isoformat()
                                        })
                                        found = True
                                        break
                            except:
                                continue
                        
                        if found:
                            break
                        
                        # Scroll dans la modal
                        await page.locator('div[role="dialog"]').evaluate('el => el.scrollTop = el.scrollHeight')
                        await human_delay(1, 2)
                    
                    # Fermer la modal des likes
                    await page.keyboard.press('Escape')
                    await human_delay(1, 1)
                    
                except:
                    # Pas de bouton "J'aime" visible ou post sans likes
                    pass
                
                # Fermer le post
                await page.keyboard.press('Escape')
                await human_delay(1, 2)
                
            except Exception as e:
                log.warning(f"Erreur lors de l'analyse du post {i}: {e}")
                # Essayer de fermer toute modal ouverte
                await page.keyboard.press('Escape')
                await human_delay(1, 1)
                continue
        
        log.info(f"🎯 {len(liked_posts)} post(s) de @{pro_username} liké(s) par @{prospect_username}")
        return liked_posts
        
    except Exception as e:
        log.error(f"Erreur lors de la récupération des posts likés: {e}")
        return liked_posts


async def get_liked_posts_from_profile(page, username: str, max_posts: int = 20):
    """Récupère les posts récents likés par un utilisateur (approximation)."""
    try:
        await human_delay(2, 4)
        log.info(f"Analyse des posts de @{username}")
        
        await page.goto(f"https://www.instagram.com/{username}/", wait_until="domcontentloaded")
        
        # Attendre que la page soit complètement chargée
        try:
            await page.wait_for_load_state('networkidle', timeout=10000)
        except:
            log.warning("Timeout networkidle, continuation...")
        
        await human_delay(3, 5)
        
        # Scroll léger pour simuler un comportement humain
        await human_scroll(page)
        
        # Récupérer les posts récents
        post_links = await page.locator('article a[href*="/p/"]').all()
        
        liked_posts = []
        
        for i, link in enumerate(post_links[:max_posts]):
            try:
                href = await link.get_attribute('href')
                post_id = href.split('/p/')[1].split('/')[0] if '/p/' in href else None
                
                if post_id:
                    liked_posts.append({
                        'post_id': post_id,
                        'post_url': f"https://www.instagram.com/p/{post_id}/",
                        'post_owner': username,
                        'liked_at': datetime.now().isoformat()
                    })
            except:
                continue
        
        return liked_posts
    
    except Exception as e:
        log.error(f"Erreur lors de l'analyse des posts: {e}")
        return []


async def run_check_async():
    """Fonction asynchrone pour vérifier le cercle/prospects."""
    log.info("=== Début du check Agent Pro Circle ===")
    conn = get_conn()

    try:
        # Récupérer tous les utilisateurs Pro
        pro_users = get_pro_users(conn)
        
        if not pro_users:
            log.info("Aucun utilisateur Pro à vérifier")
            return
        
        log.info(f"{len(pro_users)} utilisateur(s) Pro à vérifier")

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=False,
                slow_mo=random.randint(50, 150),
                args=['--disable-blink-features=AutomationControlled', '--no-sandbox']
            )
            
            context = await browser.new_context(
                viewport={'width': 1280, 'height': 800},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                locale='fr-FR',
                timezone_id='Europe/Paris'
            )
            
            cookies = await load_session_cookies()
            if cookies:
                await context.add_cookies(cookies)
            
            page = await context.new_page()
            
            # Si pas de cookies, se connecter d'abord
            if not cookies:
                await page.goto("https://www.instagram.com/")
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
                    
                    # Gérer les popups
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
                    log.info("Connexion manuelle requise (60s)...")
                    await asyncio.sleep(60)
                    await save_session_cookies(context)
            
            # Limiter à 5 profils par session pour éviter la détection
            MAX_PROFILES_PER_SESSION = 5
            users_to_process = pro_users[:MAX_PROFILES_PER_SESSION]
            
            if len(pro_users) > MAX_PROFILES_PER_SESSION:
                log.info(f"⚠️ Limitation à {MAX_PROFILES_PER_SESSION} utilisateurs sur {len(pro_users)} total")
            
            # Traiter chaque utilisateur Pro
            for idx, user in enumerate(users_to_process, 1):
                user_id = user['id']
                username = user['username']
                
                log.info(f"📊 Analyse des prospects de @{username} ({idx}/{len(users_to_process)})")
                
                # Récupérer les prospects à analyser
                prospects = get_prospects_to_analyze(conn, user_id)
                
                if not prospects:
                    log.info(f"⚠️ Aucun prospect à analyser pour @{username}")
                    continue
                
                log.info(f"🔍 {len(prospects)} prospect(s) à analyser")
                
                # Aller sur le profil de l'utilisateur Pro (Luka)
                try:
                    await page.goto(f'https://www.instagram.com/{username}/', wait_until='domcontentloaded')
                    await human_delay(3, 5)
                    
                    log.info(f"✅ Profil de @{username} (utilisateur Pro) chargé")
                except Exception as e:
                    log.error(f"❌ Erreur lors de l'accès au profil @{username}: {e}")
                    continue
                
                # Analyser chaque prospect
                for prospect in prospects:
                    member_id = prospect['id']
                    prospect_username = prospect['member_username']
                    
                    log.info(f"🔎 Analyse de l'engagement de @{prospect_username} envers @{username}...")
                    
                    # Vérifier si le prospect suit l'utilisateur Pro
                    is_follower = await check_if_user_is_follower(page, username, prospect_username)
                    
                    if is_follower:
                        log.info(f"✅ @{prospect_username} suit @{username}")
                    else:
                        log.info(f"⚠️ @{prospect_username} ne suit pas @{username}")
                    
                    # Détecter les connexions mutuelles (avec les autres prospects)
                    mutual_count = detect_mutual_connections(conn, member_id, user_id, prospects)
                    
                    # Récupérer les posts de Luka qui ont été likés par Pako
                    liked_posts = await get_posts_liked_by_prospect(page, username, prospect_username, max_posts=10)
                    
                    # Sauvegarder les likes
                    for post in liked_posts:
                        save_liked_post(conn, member_id, post)
                    
                    # Mettre à jour le compteur de likes
                    cur = conn.cursor()
                    cur.execute("""
                        UPDATE circle_members
                        SET total_likes_given = (
                            SELECT COUNT(*) FROM liked_posts WHERE circle_member_id = ?
                        ),
                        last_like_given_at = (
                            SELECT MAX(liked_at) FROM liked_posts WHERE circle_member_id = ?
                        )
                        WHERE id = ?
                    """, (member_id, member_id, member_id))
                    conn.commit()
                    
                    # Analyser les patterns de likes
                    signals = analyze_like_patterns(conn, member_id)
                    if signals:
                        detect_and_save_signals(conn, member_id, signals)
                    
                    # Analyser la corrélation follow/unfollow avec likes
                    correlation_signals = analyze_follow_like_correlation(conn, member_id)
                    if correlation_signals:
                        detect_and_save_signals(conn, member_id, correlation_signals)
                        for sig in correlation_signals:
                            log.info(f"🔗 Corrélation détectée: {sig['type']} - Force: {sig['strength']}")
                    
                    # Calculer le score
                    score = calculate_relationship_score(conn, member_id)
                    
                    # Récupérer le streak (durée de connexion) et connexions mutuelles
                    cur = conn.cursor()
                    cur.execute("""
                        SELECT consecutive_likes_streak, mutual_followers_count
                        FROM circle_members
                        WHERE id = ?
                    """, (member_id,))
                    result = cur.fetchone()
                    connection_duration = result['consecutive_likes_streak'] if result else 0
                    mutual_connections = result['mutual_followers_count'] if result else 0
                    
                    log.info(f"✅ @{prospect_username}: Score {score}/100 | Durée connexion: {connection_duration} jours | Connexions mutuelles: {mutual_connections}")
                    
                    await human_delay(5, 10)
                
                # Pause entre utilisateurs
                if idx < len(users_to_process):
                    await human_delay(10, 20)
                
                # Pause naturelle tous les 3 utilisateurs
                if idx % 3 == 0 and idx < len(users_to_process):
                    await human_break(2, 4)
            
            await save_session_cookies(context)
            await browser.close()
    
    except Exception as e:
        log.error(f"Erreur durant le check : {e}", exc_info=True)
    finally:
        conn.close()
    
    log.info("=== Fin du check Agent Pro Circle ===")


def run_check():
    asyncio.run(run_check_async())


if __name__ == "__main__":
    scheduler = BlockingScheduler(timezone="Europe/Paris")

    scheduler.add_job(
        run_check,
        CronTrigger(hour="*/4"),  # Toutes les 4 heures
        id="agent_pro_circle_check",
        name="Agent Pro — Circle/Prospects check",
        max_instances=1,
        misfire_grace_time=3600
    )

    log.info("Agent Pro Circle démarré — checks toutes les 4 heures")

    if os.environ.get("RUN_ON_START", "false").lower() == "true":
        log.info("RUN_ON_START activé")
        run_check()

    try:
        scheduler.start()
    except KeyboardInterrupt:
        log.info("Agent Pro Circle arrêté.")
