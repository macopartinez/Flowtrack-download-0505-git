from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'waler.db')

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.json
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    platform = data.get('platform')
    usage_mode = data.get('usageMode', 'personal')
    selected_plan = data.get('selectedPlan')
    
    # Validation
    if not all([username, email, password, platform]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Validate plan selection - REQUIRED for onboarding
    if not selected_plan or selected_plan not in ['premium', 'pro']:
        return jsonify({'error': 'You must select a pricing plan to continue'}), 400
    
    if platform not in ['instagram', 'facebook']:
        return jsonify({'error': 'Invalid platform'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if email already exists
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Email already registered'}), 400
        
        # Check if username already exists
        cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Username already taken'}), 400
        
        # Hash password
        password_hash = generate_password_hash(password)
        
        # Insert user with selected plan
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, platform, usage_mode, subscription_tier, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        ''', (username, email, password_hash, platform, usage_mode, selected_plan))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        # Get created user
        cursor.execute('SELECT id, username, email, platform, usage_mode FROM users WHERE id = ?', (user_id,))
        user = dict(cursor.fetchone())
        conn.close()
        
        # Set session
        session['user_id'] = user['id']
        session['email'] = user['email']
        
        return jsonify(user), 201
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    data = request.json
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        user_row = cursor.fetchone()
        conn.close()
        
        if not user_row:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        user = dict(user_row)
        
        if not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Set session
        session['user_id'] = user['id']
        session['email'] = user['email']
        
        # Return user without password
        del user['password_hash']
        return jsonify(user)
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout user"""
    session.clear()
    return jsonify({'status': 'success'})

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current authenticated user"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, username, email, platform, subscription_tier, subscription_status FROM users WHERE id = ?', 
                      (session['user_id'],))
        user_row = cursor.fetchone()
        conn.close()
        
        if not user_row:
            session.clear()
            return jsonify({'error': 'User not found'}), 401
        
        user = dict(user_row)
        return jsonify(user)
        
    except Exception as e:
        print(f"Get user error: {e}")
        return jsonify({'error': 'Failed to get user'}), 500
