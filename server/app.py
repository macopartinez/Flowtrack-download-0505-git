from flask import Flask, session
from flask_cors import CORS
from routes.auth import auth_bp
from routes.clients import clients_bp
from routes.subscription import subscription_bp
import os

app = Flask(__name__)

# Secret key for sessions (change this in production!)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Session configuration
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours

# CORS configuration - allow credentials for session cookies
CORS(app, 
     supports_credentials=True,
     origins=['http://localhost:5173', 'http://localhost:5000', 'http://127.0.0.1:5173'],
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(clients_bp)
app.register_blueprint(subscription_bp)

@app.route('/')
def index():
    """Health check endpoint"""
    return {
        'status': 'ok',
        'message': 'Waler API is running',
        'version': '1.0.0'
    }

@app.route('/api/health')
def health():
    """Detailed health check"""
    return {
        'status': 'healthy',
        'database': 'connected',
        'session': 'active' if 'user_id' in session else 'inactive'
    }

if __name__ == '__main__':
    print("🚀 Starting Waler API Server...")
    print("📍 Server running on http://localhost:5001")
    print("📊 Database: waler.db")
    print("\n✅ Available routes:")
    print("   - POST /api/auth/register")
    print("   - POST /api/auth/login")
    print("   - POST /api/auth/logout")
    print("   - GET  /api/auth/me")
    print("   - GET  /api/clients")
    print("   - POST /api/clients")
    print("   - GET  /api/subscription/status")
    print("\n⚡ Press Ctrl+C to stop\n")
    
    app.run(debug=True, port=5001, host='0.0.0.0')
