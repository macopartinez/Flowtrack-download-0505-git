"""
Agent de vérification 2FA pour Waler
Écoute les DMs sur @waler_official et vérifie les codes de vérification
"""

from instagrapi import Client
import sqlite3
import re
import time
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
INSTAGRAM_USER = os.getenv("WALER_OFFICIAL_USER", "waler_official")
INSTAGRAM_PASS = os.getenv("WALER_OFFICIAL_PASS", "")
DB_PATH = os.getenv("DB_PATH", "waler.db")
CHECK_INTERVAL = 10  # secondes

# Messages
MSG_SUCCESS = """✅ Code vérifié!

Votre code de vérification: {token}

Entrez ce code dans l'application Waler pour activer votre compte."""

MSG_SECURITY_ERROR = """❌ Erreur de sécurité

Ce code appartient à @{expected_username}, pas à @{sender_username}.

Si c'est votre compte, vérifiez que vous avez copié le bon code."""

MSG_INVALID_CODE = """❌ Code invalide ou expiré

Vérifiez que vous avez copié le bon code ou demandez-en un nouveau dans l'application."""

MSG_HELP = """👋 Bienvenue sur Waler!

Pour vérifier votre compte:
1. Inscrivez-vous sur l'application Waler
2. Copiez le code de vérification fourni
3. Envoyez-le ici en message

Format: VERIFY-ABC123-@votre_username"""


class VerificationAgent:
    def __init__(self):
        self.client = Client()
        self.db = None
        self.processed_messages = set()
        
    def connect_instagram(self):
        """Connexion à Instagram"""
        print(f"🔐 Connexion à Instagram en tant que @{INSTAGRAM_USER}...")
        try:
            self.client.login(INSTAGRAM_USER, INSTAGRAM_PASS)
            print("✅ Connecté avec succès!")
            return True
        except Exception as e:
            print(f"❌ Erreur de connexion: {e}")
            return False
    
    def connect_db(self):
        """Connexion à la base de données"""
        print(f"💾 Connexion à la base de données {DB_PATH}...")
        try:
            self.db = sqlite3.connect(DB_PATH, check_same_thread=False)
            print("✅ Base de données connectée!")
            return True
        except Exception as e:
            print(f"❌ Erreur DB: {e}")
            return False
    
    def get_verification_token(self, verification_code):
        """Récupère le token de vérification depuis la DB"""
        if not self.db:
            return None
        
        try:
            cursor = self.db.execute(
                "SELECT verification_token, verification_token_expiry FROM users WHERE verification_code = ?",
                (verification_code,)
            )
            result = cursor.fetchone()
            
            if result:
                token, expiry = result
                # Vérifier expiration
                if expiry:
                    from datetime import datetime
                    expiry_date = datetime.fromisoformat(expiry)
                    if expiry_date < datetime.now():
                        return None  # Expiré
                return token
            return None
        except Exception as e:
            print(f"❌ Erreur DB query: {e}")
            return None
    
    def process_message(self, thread_id, message):
        """Traite un message reçu"""
        # Éviter de traiter le même message plusieurs fois
        msg_id = f"{thread_id}_{message.id}"
        if msg_id in self.processed_messages:
            return
        
        self.processed_messages.add(msg_id)
        
        # Ignorer les messages vides
        if not message.text:
            return
        
        text = message.text.strip()
        
        # Commande d'aide
        if text.lower() in ['help', 'aide', 'start']:
            self.client.direct_send(MSG_HELP, thread_ids=[thread_id])
            return
        
        # Détecter format: VERIFY-ABC123-@username
        match = re.match(r'VERIFY-([A-Z0-9]+)-@(.+)', text, re.IGNORECASE)
        if not match:
            return  # Pas un code de vérification
        
        code_id = match.group(1).upper()
        expected_username = match.group(2).lower().strip()
        full_code = f"VERIFY-{code_id}-@{expected_username}"
        
        print(f"📨 Code reçu: {full_code}")
        
        # Récupérer le username de l'expéditeur
        try:
            sender = self.client.user_info(message.user_id)
            sender_username = sender.username.lower()
            
            print(f"👤 Expéditeur: @{sender_username}")
            print(f"🎯 Attendu: @{expected_username}")
            
            # VÉRIFICATION SÉCURITÉ: Expéditeur = Username attendu?
            if sender_username != expected_username:
                print(f"⚠️  Erreur de sécurité détectée!")
                self.client.direct_send(
                    MSG_SECURITY_ERROR.format(
                        expected_username=expected_username,
                        sender_username=sender_username
                    ),
                    thread_ids=[thread_id]
                )
                return
            
            # Chercher le token dans la DB
            token = self.get_verification_token(full_code)
            
            if token:
                print(f"✅ Token trouvé: {token}")
                self.client.direct_send(
                    MSG_SUCCESS.format(token=token),
                    thread_ids=[thread_id]
                )
            else:
                print(f"❌ Code invalide ou expiré")
                self.client.direct_send(
                    MSG_INVALID_CODE,
                    thread_ids=[thread_id]
                )
                
        except Exception as e:
            print(f"❌ Erreur lors du traitement: {e}")
    
    def check_messages(self):
        """Vérifie les nouveaux messages"""
        try:
            threads = self.client.direct_threads(amount=20)
            
            for thread in threads:
                try:
                    messages = self.client.direct_messages(thread.id, amount=5)
                    
                    for message in messages:
                        # Ignorer nos propres messages
                        if message.user_id == self.client.user_id:
                            continue
                        
                        self.process_message(thread.id, message)
                        
                except Exception as e:
                    print(f"⚠️  Erreur thread {thread.id}: {e}")
                    continue
                    
        except Exception as e:
            print(f"❌ Erreur check messages: {e}")
    
    def run(self):
        """Boucle principale"""
        print("🚀 Démarrage de l'agent de vérification Waler...")
        
        if not self.connect_instagram():
            print("❌ Impossible de se connecter à Instagram")
            return
        
        if not self.connect_db():
            print("❌ Impossible de se connecter à la base de données")
            return
        
        print(f"✅ Agent démarré! Vérification toutes les {CHECK_INTERVAL}s")
        print("📱 En attente de messages de vérification...")
        print("=" * 50)
        
        try:
            while True:
                self.check_messages()
                time.sleep(CHECK_INTERVAL)
                
        except KeyboardInterrupt:
            print("\n👋 Arrêt de l'agent...")
        except Exception as e:
            print(f"❌ Erreur fatale: {e}")
        finally:
            if self.db:
                self.db.close()
            print("✅ Agent arrêté")


if __name__ == "__main__":
    agent = VerificationAgent()
    agent.run()
