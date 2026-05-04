"""
Agent Connections — Waler SaaS
Rôle : Analyse de la qualité des relations existantes (followers/following)
Cron : 1 fois par jour (3h du matin)
Utilise Playwright pour simuler un comportement humain réaliste
"""

import os
import time
import random
import logging
import asyncio
import json
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv
from playwright.async_api import async_playwright

load_dotenv()

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'server', 'waler.db')

AGENT_ID = os.environ.get("AGENT_CONNECTIONS_ID", "agent_connections")
AGENT_INSTAGRAM_USER = os.environ.get("AGENT_A_INSTAGRAM_USER")
AGENT_INSTAGRAM_PASS = os.environ.get("AGENT_A_INSTAGRAM_PASS")

SESSION_FILE = Path(f"session-connections-{AGENT_INSTAGRAM_USER}.json")
MAX_USERS_PER_SESSION = 5
MAX_CONNECTIONS_PER_USER = 50  # Analyser max 50 connexions par utilisateur

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [Agent Connections] %(levelname)s — %(message)s"
)
log = logging.getLogger("agent_connections")


def get_conn():
    """Connexion à la base SQLite"""
    return sqlite3.connect(DATABASE_PATH)


def get_active_users(conn):
    """Retourne tous les utilisateurs actifs avec abonnement Premium/Pro"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, username, email, subscription_tier
        FROM users
        WHERE subscription_status = 'active'
          AND subscription_tier IN ('premium', 'pro')
    """)
    users = []
    for row in cursor.fetchall():
        users.append({
            'id': row[0],
            'username': row[1],
            'email': row[2],
            'subscription_tier': row[3]
        })
    return users


def save_or_update_connection(conn, user_id, connection_data):
    """Enregistre ou met à jour une connexion dans la base"""
    cursor = conn.cursor()
    
    # Vérifier si la connexion existe déjà
    cursor.execute("""
        SELECT id, interaction_count FROM connections
        WHERE user_id = ? AND connection_username = ?
    """, (user_id, connection_data['username']))
    
    existing = cursor.fetchone()
    
    # Calculer les scores
    quality_score = calculate_quality_score(connection_data)
    engagement_score = calculate_engagement_score(connection_data)
    relationship_context = generate_relationship_context(connection_data)
    
    if existing:
        # Mise à jour
        connection_id = existing[0]
        old_interaction_count = existing[1]
        
        cursor.execute("""
            UPDATE connections SET
                full_name = ?,
                bio = ?,
                profile_pic_url = ?,
                followers_count = ?,
                following_count = ?,
                posts_count = ?,
                is_verified = ?,
                is_private = ?,
                is_following_me = ?,
                am_i_following = ?,
                mutual_followers_count = ?,
                relationship_type = ?,
                quality_score = ?,
                engagement_score = ?,
                interaction_count = ?,
                relationship_context = ?,
                last_analyzed_at = ?
            WHERE id = ?
        """, (
            connection_data.get('full_name'),
            connection_data.get('bio'),
            connection_data.get('profile_pic_url'),
            connection_data.get('followers_count', 0),
            connection_data.get('following_count', 0),
            connection_data.get('posts_count', 0),
            connection_data.get('is_verified', False),
            connection_data.get('is_private', False),
            connection_data.get('is_following_me', False),
            connection_data.get('am_i_following', False),
            connection_data.get('mutual_followers_count', 0),
            connection_data.get('relationship_type', 'unknown'),
            quality_score,
            engagement_score,
            connection_data.get('interaction_count', 0),
            json.dumps(relationship_context),
            datetime.now(),
            connection_id
        ))
        
        log.info(f"✅ Connexion mise à jour : @{connection_data['username']} (qualité: {quality_score}/100, engagement: {engagement_score}/100)")
    else:
        # Insertion
        cursor.execute("""
            INSERT INTO connections (
                user_id, connection_username, connection_user_id, full_name, bio,
                profile_pic_url, followers_count, following_count, posts_count,
                is_verified, is_private, is_following_me, am_i_following,
                mutual_followers_count, relationship_type, quality_score,
                engagement_score, interaction_count, relationship_context,
                first_detected_at, last_analyzed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            connection_data['username'],
            connection_data.get('user_id'),
            connection_data.get('full_name'),
            connection_data.get('bio'),
            connection_data.get('profile_pic_url'),
            connection_data.get('followers_count', 0),
            connection_data.get('following_count', 0),
            connection_data.get('posts_count', 0),
            connection_data.get('is_verified', False),
            connection_data.get('is_private', False),
            connection_data.get('is_following_me', False),
            connection_data.get('am_i_following', False),
            connection_data.get('mutual_followers_count', 0),
            connection_data.get('relationship_type', 'unknown'),
            quality_score,
            engagement_score,
            connection_data.get('interaction_count', 0),
            json.dumps(relationship_context),
            datetime.now(),
            datetime.now()
        ))
        
        log.info(f"✅ Nouvelle connexion enregistrée : @{connection_data['username']} (qualité: {quality_score}/100)")
    
    conn.commit()


def calculate_quality_score(connection_data):
    """Calcule un score de qualité de la relation (0-100)"""
    score = 50  # Base score
    
    # Type de relation
    rel_type = connection_data.get('relationship_type', 'unknown')
    if rel_type == 'mutual':
        score += 20  # Relation réciproque
    elif rel_type == 'follower_only':
        score += 10  # Ils te suivent
    elif rel_type == 'following_only':
        score -= 10  # Tu les suis mais pas réciproquement
    elif rel_type == 'ghost':
        score -= 20  # Ghost follower
    
    # Amis en commun
    mutual = connection_data.get('mutual_followers_count', 0)
    if mutual > 0:
        score += min(20, mutual * 2)
    
    # Compte vérifié
    if connection_data.get('is_verified'):
        score += 5
    
    # Ratio followers/following (qualité du compte)
    followers = connection_data.get('followers_count', 0)
    following = connection_data.get('following_count', 1)
    ratio = followers / following if following > 0 else 0
    
    if ratio > 2:
        score += 5
    elif ratio < 0.3:
        score -= 5
    
    # Compte privé (plus personnel)
    if connection_data.get('is_private'):
        score += 5
    
    return max(0, min(100, score))


def calculate_engagement_score(connection_data):
    """Calcule un score d'engagement (0-100) basé sur les interactions"""
    score = 0
    
    # Nombre d'interactions
    interaction_count = connection_data.get('interaction_count', 0)
    score += min(40, interaction_count * 5)
    
    # Dernière interaction récente
    last_interaction = connection_data.get('last_interaction_date')
    if last_interaction:
        days_since = (datetime.now() - last_interaction).days
        if days_since < 7:
            score += 30
        elif days_since < 30:
            score += 20
        elif days_since < 90:
            score += 10
    
    # Type de relation
    rel_type = connection_data.get('relationship_type', 'unknown')
    if rel_type == 'mutual':
        score += 20
    elif rel_type == 'ghost':
        score = max(0, score - 30)
    
    # Posts actifs
    posts = connection_data.get('posts_count', 0)
    if posts > 100:
        score += 10
    elif posts < 10:
        score -= 10
    
    return max(0, min(100, score))


def generate_relationship_context(connection_data):
    """Génère le contexte relationnel de la connexion"""
    context = {
        'type': 'unknown',
        'strength': 'weak',
        'suggestions': []
    }
    
    rel_type = connection_data.get('relationship_type', 'unknown')
    quality_score = calculate_quality_score(connection_data)
    engagement_score = calculate_engagement_score(connection_data)
    mutual = connection_data.get('mutual_followers_count', 0)
    
    # Déterminer le type de relation
    if rel_type == 'mutual':
        if engagement_score > 60:
            context['type'] = 'active_friend'
            context['strength'] = 'strong'
            context['suggestions'].append("💚 Relation active et réciproque")
        elif engagement_score > 30:
            context['type'] = 'casual_friend'
            context['strength'] = 'medium'
            context['suggestions'].append("🤝 Relation réciproque à entretenir")
        else:
            context['type'] = 'dormant_mutual'
            context['strength'] = 'weak'
            context['suggestions'].append("💡 Relation réciproque mais peu active")
    
    elif rel_type == 'follower_only':
        context['type'] = 'follower'
        context['strength'] = 'medium'
        if mutual > 0:
            context['suggestions'].append(f"👥 {mutual} ami(s) en commun - Considérer de suivre en retour")
        else:
            context['suggestions'].append("👤 Cette personne te suit mais tu ne la suis pas")
    
    elif rel_type == 'following_only':
        context['type'] = 'one_sided'
        context['strength'] = 'weak'
        if engagement_score < 20:
            context['suggestions'].append("⚠️ Relation unilatérale - Considérer de ne plus suivre")
        else:
            context['suggestions'].append("📱 Tu suis cette personne mais pas réciproquement")
    
    elif rel_type == 'ghost':
        context['type'] = 'ghost'
        context['strength'] = 'none'
        context['suggestions'].append("👻 Ghost follower - Aucune interaction détectée")
        context['suggestions'].append("💡 Considérer de retirer ce follower")
    
    # Suggestions basées sur la qualité
    if quality_score > 70:
        context['suggestions'].append("⭐ Connexion de qualité à préserver")
    elif quality_score < 30:
        context['suggestions'].append("🔍 Relation à reconsidérer")
    
    return context


async def scrape_followers_and_following(page, target_username):
    """Récupère les listes de followers et following d'un utilisateur"""
    try:
        await page.goto(f'https://www.instagram.com/{target_username}/')
        await page.wait_for_timeout(random.randint(2000, 4000))
        
        connections = {
            'followers': [],
            'following': []
        }
        
        # Récupérer les followers
        log.info(f"📥 Récupération des followers de @{target_username}...")
        followers_link = page.locator('a[href*="/followers/"]').first
        if await followers_link.count() > 0:
            await followers_link.click()
            await page.wait_for_timeout(random.randint(2000, 3000))
            
            await page.wait_for_selector('div[role="dialog"]', timeout=10000)
            
            # Scroll pour charger plus de followers
            dialog = page.locator('div[role="dialog"]').first
            for _ in range(5):  # Scroll 5 fois
                await dialog.evaluate('el => el.scrollTop = el.scrollHeight')
                await page.wait_for_timeout(random.randint(1000, 2000))
            
            follower_elements = await page.locator('div[role="dialog"] a[href^="/"]').all()
            for element in follower_elements[:MAX_CONNECTIONS_PER_USER]:
                try:
                    href = await element.get_attribute('href')
                    username = href.strip('/').split('/')[-1]
                    if username and username not in ['explore', 'reels', 'direct']:
                        connections['followers'].append(username)
                except:
                    continue
            
            # Fermer la modal
            close_button = page.locator('button svg[aria-label="Close"]').first
            if await close_button.count() > 0:
                await close_button.click()
                await page.wait_for_timeout(1000)
        
        log.info(f"✅ {len(connections['followers'])} followers récupérés")
        
        # Récupérer les following
        log.info(f"📤 Récupération des following de @{target_username}...")
        await page.goto(f'https://www.instagram.com/{target_username}/')
        await page.wait_for_timeout(random.randint(2000, 3000))
        
        following_link = page.locator('a[href*="/following/"]').first
        if await following_link.count() > 0:
            await following_link.click()
            await page.wait_for_timeout(random.randint(2000, 3000))
            
            await page.wait_for_selector('div[role="dialog"]', timeout=10000)
            
            # Scroll pour charger plus de following
            dialog = page.locator('div[role="dialog"]').first
            for _ in range(5):
                await dialog.evaluate('el => el.scrollTop = el.scrollHeight')
                await page.wait_for_timeout(random.randint(1000, 2000))
            
            following_elements = await page.locator('div[role="dialog"] a[href^="/"]').all()
            for element in following_elements[:MAX_CONNECTIONS_PER_USER]:
                try:
                    href = await element.get_attribute('href')
                    username = href.strip('/').split('/')[-1]
                    if username and username not in ['explore', 'reels', 'direct']:
                        connections['following'].append(username)
                except:
                    continue
            
            # Fermer la modal
            close_button = page.locator('button svg[aria-label="Close"]').first
            if await close_button.count() > 0:
                await close_button.click()
                await page.wait_for_timeout(1000)
        
        log.info(f"✅ {len(connections['following'])} following récupérés")
        
        return connections
        
    except Exception as e:
        log.error(f"❌ Erreur lors du scraping des connexions de @{target_username}: {e}")
        return {'followers': [], 'following': []}


async def analyze_connection_profile(page, username):
    """Analyse le profil d'une connexion"""
    try:
        await page.goto(f'https://www.instagram.com/{username}/')
        await page.wait_for_timeout(random.randint(2000, 4000))
        
        connection_data = {'username': username}
        
        # Nom complet
        try:
            full_name = await page.locator('section header h2').first.inner_text()
            connection_data['full_name'] = full_name
        except:
            pass
        
        # Bio
        try:
            bio = await page.locator('section header div._aa_c span').first.inner_text()
            connection_data['bio'] = bio
        except:
            pass
        
        # Stats
        try:
            stats = await page.locator('section ul li').all()
            if len(stats) >= 3:
                posts_text = await stats[0].inner_text()
                followers_text = await stats[1].inner_text()
                following_text = await stats[2].inner_text()
                
                connection_data['posts_count'] = parse_count(posts_text)
                connection_data['followers_count'] = parse_count(followers_text)
                connection_data['following_count'] = parse_count(following_text)
        except:
            pass
        
        # Compte vérifié
        try:
            verified = await page.locator('svg[aria-label="Verified"]').count()
            connection_data['is_verified'] = verified > 0
        except:
            connection_data['is_verified'] = False
        
        # Compte privé
        try:
            private_text = await page.locator('h2:has-text("This account is private")').count()
            connection_data['is_private'] = private_text > 0
        except:
            connection_data['is_private'] = False
        
        # Photo de profil
        try:
            img = await page.locator('header img').first.get_attribute('src')
            connection_data['profile_pic_url'] = img
        except:
            pass
        
        return connection_data
        
    except Exception as e:
        log.error(f"❌ Erreur lors de l'analyse du profil @{username}: {e}")
        return {'username': username}


def parse_count(text):
    """Parse un nombre Instagram (ex: '1.2K' -> 1200)"""
    text = text.split()[0].replace(',', '')
    if 'K' in text:
        return int(float(text.replace('K', '')) * 1000)
    elif 'M' in text:
        return int(float(text.replace('M', '')) * 1000000)
    else:
        try:
            return int(text)
        except:
            return 0


async def login_instagram(page):
    """Connexion à Instagram avec gestion des cookies"""
    try:
        if SESSION_FILE.exists():
            cookies = json.loads(SESSION_FILE.read_text())
            await page.context.add_cookies(cookies)
            log.info("🍪 Cookies chargés")
            
            await page.goto('https://www.instagram.com/')
            await page.wait_for_timeout(3000)
            
            if await page.locator('svg[aria-label="Home"]').count() > 0:
                log.info("✅ Déjà connecté via cookies")
                return True
        
        log.info("🔐 Connexion à Instagram...")
        await page.goto('https://www.instagram.com/accounts/login/')
        await page.wait_for_timeout(2000)
        
        await page.fill('input[name="username"]', AGENT_INSTAGRAM_USER)
        await page.wait_for_timeout(random.randint(500, 1000))
        
        await page.fill('input[name="password"]', AGENT_INSTAGRAM_PASS)
        await page.wait_for_timeout(random.randint(500, 1000))
        
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(5000)
        
        cookies = await page.context.cookies()
        SESSION_FILE.write_text(json.dumps(cookies))
        log.info("✅ Connecté et cookies sauvegardés")
        
        return True
        
    except Exception as e:
        log.error(f"❌ Erreur de connexion: {e}")
        return False


async def process_user(page, user):
    """Traite un utilisateur : analyse toutes ses connexions"""
    log.info(f"🔍 Traitement de l'utilisateur {user['username']} (ID: {user['id']})")
    
    conn = get_conn()
    
    # Récupérer les listes de followers et following
    connections_lists = await scrape_followers_and_following(page, user['username'])
    
    followers_set = set(connections_lists['followers'])
    following_set = set(connections_lists['following'])
    
    log.info(f"📊 {len(followers_set)} followers, {len(following_set)} following")
    
    # Identifier les types de relations
    mutual = followers_set & following_set  # Intersection
    follower_only = followers_set - following_set
    following_only = following_set - followers_set
    
    log.info(f"🤝 {len(mutual)} mutuels, 👤 {len(follower_only)} followers only, 📱 {len(following_only)} following only")
    
    # Analyser les connexions (limiter pour éviter les timeouts)
    all_connections = list(mutual)[:20] + list(follower_only)[:15] + list(following_only)[:15]
    
    log.info(f"📝 Analyse de {len(all_connections)} connexions...")
    
    for i, connection_username in enumerate(all_connections):
        log.info(f"Analyse {i+1}/{len(all_connections)}: @{connection_username}")
        
        # Analyser le profil
        connection_data = await analyze_connection_profile(page, connection_username)
        
        # Déterminer le type de relation
        if connection_username in mutual:
            connection_data['relationship_type'] = 'mutual'
            connection_data['is_following_me'] = True
            connection_data['am_i_following'] = True
        elif connection_username in follower_only:
            connection_data['relationship_type'] = 'follower_only'
            connection_data['is_following_me'] = True
            connection_data['am_i_following'] = False
        elif connection_username in following_only:
            connection_data['relationship_type'] = 'following_only'
            connection_data['is_following_me'] = False
            connection_data['am_i_following'] = True
        
        # Sauvegarder
        save_or_update_connection(conn, user['id'], connection_data)
        
        # Pause entre chaque analyse
        await page.wait_for_timeout(random.randint(2000, 4000))
    
    conn.close()
    log.info(f"✅ Traitement terminé pour @{user['username']}")


async def run_agent():
    """Exécution principale de l'agent"""
    log.info("=" * 60)
    log.info("🚀 Démarrage de l'Agent Connections")
    log.info("=" * 60)
    
    conn = get_conn()
    users = get_active_users(conn)
    conn.close()
    
    if not users:
        log.info("⚠️ Aucun utilisateur actif à traiter")
        return
    
    log.info(f"👥 {len(users)} utilisateur(s) à traiter")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        
        page = await context.new_page()
        
        if not await login_instagram(page):
            log.error("❌ Impossible de se connecter à Instagram")
            await browser.close()
            return
        
        for i, user in enumerate(users[:MAX_USERS_PER_SESSION]):
            log.info(f"\n--- Utilisateur {i+1}/{min(len(users), MAX_USERS_PER_SESSION)} ---")
            
            try:
                await process_user(page, user)
            except Exception as e:
                log.error(f"❌ Erreur lors du traitement de {user['username']}: {e}")
            
            if i < len(users) - 1:
                pause = random.randint(30, 60)
                log.info(f"⏸️ Pause de {pause}s avant le prochain utilisateur...")
                await page.wait_for_timeout(pause * 1000)
        
        await browser.close()
    
    log.info("=" * 60)
    log.info("✅ Agent Connections terminé")
    log.info("=" * 60)


def main():
    """Point d'entrée principal avec scheduler"""
    log.info("🤖 Agent Connections initialisé")
    
    scheduler = BlockingScheduler()
    
    # Planifier l'exécution 1 fois par jour à 3h du matin
    scheduler.add_job(
        lambda: asyncio.run(run_agent()),
        CronTrigger(hour=3, minute=0),
        id='agent_connections_job',
        name='Agent Connections - Relationship Quality Analysis'
    )
    
    log.info("⏰ Planification : 3h00 du matin (Europe/Paris)")
    log.info("🔄 En attente de la prochaine exécution...")
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        log.info("🛑 Arrêt de l'Agent Connections")


if __name__ == "__main__":
    main()
