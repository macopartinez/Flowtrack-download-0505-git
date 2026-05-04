"""
Agent Prospects — Waler SaaS
Rôle : Détection et analyse des nouveaux followers (prospects relationnels)
Cron : 4 fois par jour (6h / 12h / 18h / 00h)
Utilise Playwright pour simuler un comportement humain réaliste
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

AGENT_ID = os.environ.get("AGENT_PROSPECTS_ID", "agent_prospects")
AGENT_INSTAGRAM_USER = os.environ.get("AGENT_A_INSTAGRAM_USER")
AGENT_INSTAGRAM_PASS = os.environ.get("AGENT_A_INSTAGRAM_PASS")

SESSION_FILE = Path(f"session-prospects-{AGENT_INSTAGRAM_USER}.json")
MAX_USERS_PER_SESSION = 10

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [Agent Prospects] %(levelname)s — %(message)s"
)
log = logging.getLogger("agent_prospects")


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


def get_known_followers(conn, user_id):
    """Retourne la liste des followers déjà connus (dans account_changes ou prospects)"""
    cursor = conn.cursor()
    
    # Followers déjà enregistrés dans account_changes
    cursor.execute("""
        SELECT DISTINCT account_username
        FROM account_changes
        WHERE user_id = ? AND change_type = 'follower'
    """, (user_id,))
    known_from_changes = {row[0] for row in cursor.fetchall()}
    
    # Prospects déjà enregistrés
    cursor.execute("""
        SELECT DISTINCT prospect_username
        FROM prospects
        WHERE user_id = ?
    """, (user_id,))
    known_from_prospects = {row[0] for row in cursor.fetchall()}
    
    return known_from_changes | known_from_prospects


def save_prospect(conn, user_id, prospect_data):
    """Enregistre un nouveau prospect dans la base"""
    cursor = conn.cursor()
    
    # Vérifier si le prospect existe déjà
    cursor.execute("""
        SELECT id FROM prospects
        WHERE user_id = ? AND prospect_username = ?
    """, (user_id, prospect_data['username']))
    
    if cursor.fetchone():
        log.info(f"Prospect @{prospect_data['username']} déjà enregistré pour user {user_id}")
        return
    
    # Calculer le score de pertinence
    relevance_score = calculate_relevance_score(prospect_data)
    
    # Générer le contexte relationnel
    relationship_context = generate_relationship_context(prospect_data)
    
    cursor.execute("""
        INSERT INTO prospects (
            user_id, prospect_username, prospect_user_id, full_name, bio,
            profile_pic_url, followers_count, following_count, posts_count,
            is_verified, is_private, mutual_followers_count, relevance_score,
            relationship_context, detected_at, analyzed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        prospect_data['username'],
        prospect_data.get('user_id'),
        prospect_data.get('full_name'),
        prospect_data.get('bio'),
        prospect_data.get('profile_pic_url'),
        prospect_data.get('followers_count', 0),
        prospect_data.get('following_count', 0),
        prospect_data.get('posts_count', 0),
        prospect_data.get('is_verified', False),
        prospect_data.get('is_private', False),
        prospect_data.get('mutual_followers_count', 0),
        relevance_score,
        json.dumps(relationship_context),
        datetime.now(),
        datetime.now()
    ))
    
    conn.commit()
    log.info(f"✅ Nouveau prospect enregistré : @{prospect_data['username']} (score: {relevance_score}/100)")


def calculate_relevance_score(prospect_data):
    """Calcule un score de pertinence relationnelle (0-100)"""
    score = 50  # Base score
    
    # Followers mutuels (+30 points max)
    mutual = prospect_data.get('mutual_followers_count', 0)
    if mutual > 0:
        score += min(30, mutual * 3)
    
    # Compte vérifié (+10 points)
    if prospect_data.get('is_verified'):
        score += 10
    
    # Ratio followers/following (qualité du compte)
    followers = prospect_data.get('followers_count', 0)
    following = prospect_data.get('following_count', 1)
    ratio = followers / following if following > 0 else 0
    
    if ratio > 2:  # Plus de followers que following
        score += 10
    elif ratio < 0.5:  # Beaucoup plus de following que followers
        score -= 10
    
    # Bio remplie (+5 points)
    if prospect_data.get('bio') and len(prospect_data.get('bio', '')) > 20:
        score += 5
    
    # Compte privé (-5 points)
    if prospect_data.get('is_private'):
        score -= 5
    
    return max(0, min(100, score))


def generate_relationship_context(prospect_data):
    """Génère le contexte relationnel du prospect"""
    context = {
        'type': 'unknown',
        'reason': '',
        'suggestions': []
    }
    
    mutual = prospect_data.get('mutual_followers_count', 0)
    followers = prospect_data.get('followers_count', 0)
    is_verified = prospect_data.get('is_verified', False)
    
    # Déterminer le type de relation
    if mutual >= 5:
        context['type'] = 'close_network'
        context['reason'] = f"Vous avez {mutual} amis en commun"
        context['suggestions'].append("Cette personne fait partie de votre cercle proche")
    elif mutual >= 1:
        context['type'] = 'extended_network'
        context['reason'] = f"Vous avez {mutual} ami(s) en commun"
        context['suggestions'].append("Connexion via votre réseau")
    elif is_verified and followers > 10000:
        context['type'] = 'influencer'
        context['reason'] = f"Compte vérifié avec {followers:,} followers"
        context['suggestions'].append("Personnalité publique ou influenceur")
    elif followers > 1000:
        context['type'] = 'active_user'
        context['reason'] = f"{followers:,} followers"
        context['suggestions'].append("Utilisateur actif sur Instagram")
    else:
        context['type'] = 'new_user'
        context['reason'] = "Nouveau sur Instagram ou petit compte"
        context['suggestions'].append("Peut-être une vraie connexion personnelle")
    
    # Suggestions d'action
    if context['type'] in ['close_network', 'extended_network']:
        context['suggestions'].append("💡 Considérer de suivre en retour")
    
    return context


async def scrape_new_followers(page, target_username):
    """Récupère la liste des nouveaux followers d'un utilisateur"""
    try:
        # Aller sur le profil
        await page.goto(f'https://www.instagram.com/{target_username}/')
        await page.wait_for_timeout(random.randint(2000, 4000))
        
        # Cliquer sur "followers"
        followers_link = page.locator('a[href*="/followers/"]').first
        if await followers_link.count() == 0:
            log.warning(f"Impossible de trouver le lien followers pour @{target_username}")
            return []
        
        await followers_link.click()
        await page.wait_for_timeout(random.randint(2000, 3000))
        
        # Attendre que la modal des followers soit chargée
        await page.wait_for_selector('div[role="dialog"]', timeout=10000)
        
        # Récupérer les premiers followers (max 20)
        followers = []
        follower_elements = await page.locator('div[role="dialog"] a[href^="/"]').all()
        
        for i, element in enumerate(follower_elements[:20]):
            try:
                href = await element.get_attribute('href')
                username = href.strip('/').split('/')[-1]
                
                if username and username not in ['explore', 'reels', 'direct']:
                    followers.append(username)
                    
                if i % 5 == 0:
                    await page.wait_for_timeout(random.randint(500, 1000))
                    
            except Exception as e:
                log.debug(f"Erreur lors de la récupération d'un follower: {e}")
                continue
        
        log.info(f"✅ {len(followers)} followers récupérés pour @{target_username}")
        return followers
        
    except Exception as e:
        log.error(f"❌ Erreur lors du scraping des followers de @{target_username}: {e}")
        return []


async def analyze_prospect_profile(page, username):
    """Analyse le profil d'un prospect"""
    try:
        await page.goto(f'https://www.instagram.com/{username}/')
        await page.wait_for_timeout(random.randint(2000, 4000))
        
        prospect_data = {'username': username}
        
        # Nom complet
        try:
            full_name = await page.locator('section header h2').first.inner_text()
            prospect_data['full_name'] = full_name
        except:
            pass
        
        # Bio
        try:
            bio = await page.locator('section header div._aa_c span').first.inner_text()
            prospect_data['bio'] = bio
        except:
            pass
        
        # Stats (followers, following, posts)
        try:
            stats = await page.locator('section ul li').all()
            if len(stats) >= 3:
                posts_text = await stats[0].inner_text()
                followers_text = await stats[1].inner_text()
                following_text = await stats[2].inner_text()
                
                prospect_data['posts_count'] = parse_count(posts_text)
                prospect_data['followers_count'] = parse_count(followers_text)
                prospect_data['following_count'] = parse_count(following_text)
        except:
            pass
        
        # Compte vérifié
        try:
            verified = await page.locator('svg[aria-label="Verified"]').count()
            prospect_data['is_verified'] = verified > 0
        except:
            prospect_data['is_verified'] = False
        
        # Compte privé
        try:
            private_text = await page.locator('h2:has-text("This account is private")').count()
            prospect_data['is_private'] = private_text > 0
        except:
            prospect_data['is_private'] = False
        
        # Photo de profil
        try:
            img = await page.locator('header img').first.get_attribute('src')
            prospect_data['profile_pic_url'] = img
        except:
            pass
        
        log.info(f"✅ Profil analysé : @{username}")
        return prospect_data
        
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
        # Charger les cookies si disponibles
        if SESSION_FILE.exists():
            cookies = json.loads(SESSION_FILE.read_text())
            await page.context.add_cookies(cookies)
            log.info("🍪 Cookies chargés")
            
            await page.goto('https://www.instagram.com/')
            await page.wait_for_timeout(3000)
            
            # Vérifier si connecté
            if await page.locator('svg[aria-label="Home"]').count() > 0:
                log.info("✅ Déjà connecté via cookies")
                return True
        
        # Sinon, connexion manuelle
        log.info("🔐 Connexion à Instagram...")
        await page.goto('https://www.instagram.com/accounts/login/')
        await page.wait_for_timeout(2000)
        
        await page.fill('input[name="username"]', AGENT_INSTAGRAM_USER)
        await page.wait_for_timeout(random.randint(500, 1000))
        
        await page.fill('input[name="password"]', AGENT_INSTAGRAM_PASS)
        await page.wait_for_timeout(random.randint(500, 1000))
        
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(5000)
        
        # Sauvegarder les cookies
        cookies = await page.context.cookies()
        SESSION_FILE.write_text(json.dumps(cookies))
        log.info("✅ Connecté et cookies sauvegardés")
        
        return True
        
    except Exception as e:
        log.error(f"❌ Erreur de connexion: {e}")
        return False


async def process_user(page, user):
    """Traite un utilisateur : détecte et analyse les nouveaux followers"""
    log.info(f"🔍 Traitement de l'utilisateur {user['username']} (ID: {user['id']})")
    
    conn = get_conn()
    
    # Récupérer les followers connus
    known_followers = get_known_followers(conn, user['id'])
    log.info(f"📊 {len(known_followers)} followers déjà connus")
    
    # Récupérer les followers actuels
    current_followers = await scrape_new_followers(page, user['username'])
    
    if not current_followers:
        log.warning(f"⚠️ Aucun follower récupéré pour @{user['username']}")
        conn.close()
        return
    
    # Identifier les nouveaux followers
    new_followers = [f for f in current_followers if f not in known_followers]
    
    if not new_followers:
        log.info(f"✅ Aucun nouveau follower pour @{user['username']}")
        conn.close()
        return
    
    log.info(f"🌱 {len(new_followers)} nouveau(x) follower(s) détecté(s) : {', '.join(['@' + f for f in new_followers[:5]])}")
    
    # Analyser chaque nouveau follower
    for i, follower_username in enumerate(new_followers[:5]):  # Limiter à 5 par session
        log.info(f"📝 Analyse du prospect {i+1}/{min(len(new_followers), 5)}: @{follower_username}")
        
        prospect_data = await analyze_prospect_profile(page, follower_username)
        save_prospect(conn, user['id'], prospect_data)
        
        # Enregistrer aussi dans account_changes
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO account_changes (user_id, account_username, change_type, detected_at)
            VALUES (?, ?, 'follower', ?)
        """, (user['id'], follower_username, datetime.now()))
        conn.commit()
        
        # Pause entre chaque analyse
        await page.wait_for_timeout(random.randint(3000, 6000))
    
    conn.close()
    log.info(f"✅ Traitement terminé pour @{user['username']}")


async def run_agent():
    """Exécution principale de l'agent"""
    log.info("=" * 60)
    log.info("🚀 Démarrage de l'Agent Prospects")
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
        
        # Connexion
        if not await login_instagram(page):
            log.error("❌ Impossible de se connecter à Instagram")
            await browser.close()
            return
        
        # Traiter chaque utilisateur
        for i, user in enumerate(users[:MAX_USERS_PER_SESSION]):
            log.info(f"\n--- Utilisateur {i+1}/{min(len(users), MAX_USERS_PER_SESSION)} ---")
            
            try:
                await process_user(page, user)
            except Exception as e:
                log.error(f"❌ Erreur lors du traitement de {user['username']}: {e}")
            
            # Pause entre chaque utilisateur
            if i < len(users) - 1:
                pause = random.randint(10, 20)
                log.info(f"⏸️ Pause de {pause}s avant le prochain utilisateur...")
                await page.wait_for_timeout(pause * 1000)
        
        await browser.close()
    
    log.info("=" * 60)
    log.info("✅ Agent Prospects terminé")
    log.info("=" * 60)


def main():
    """Point d'entrée principal avec scheduler"""
    log.info("🤖 Agent Prospects initialisé")
    
    scheduler = BlockingScheduler()
    
    # Planifier l'exécution 4 fois par jour
    scheduler.add_job(
        lambda: asyncio.run(run_agent()),
        CronTrigger(hour='6,12,18,0', minute=0),
        id='agent_prospects_job',
        name='Agent Prospects - New Followers Detection'
    )
    
    log.info("⏰ Planification : 6h, 12h, 18h, 00h (Europe/Paris)")
    log.info("🔄 En attente de la prochaine exécution...")
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        log.info("🛑 Arrêt de l'Agent Prospects")


if __name__ == "__main__":
    main()
