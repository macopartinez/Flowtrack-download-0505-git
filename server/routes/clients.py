from flask import Blueprint, request, jsonify, session
from datetime import datetime
import requests
import os

clients_bp = Blueprint('clients', __name__, url_prefix='/api/clients')

# Instagram Graph API configuration
INSTAGRAM_API_URL = "https://graph.instagram.com"
INSTAGRAM_ACCESS_TOKEN = os.getenv('INSTAGRAM_ACCESS_TOKEN')

@clients_bp.route('/', methods=['GET'])
def get_clients():
    """Get all clients for the authenticated coach"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    coach_id = session['user_id']
    
    # TODO: Query database for clients
    # For now, return mock data
    mock_clients = [
        {
            'id': '1',
            'instagramUsername': 'johndoe',
            'displayName': 'John Doe',
            'tags': ['growth', 'mindset'],
            'currentFollowers': 12500,
            'currentFollowing': 890,
            'followersChange': 450,
            'followingChange': -20,
            'lastUpdated': datetime.now().isoformat()
        },
        {
            'id': '2',
            'instagramUsername': 'janesmith',
            'displayName': 'Jane Smith',
            'tags': ['product launch', 'ecommerce'],
            'currentFollowers': 8200,
            'currentFollowing': 1200,
            'followersChange': -120,
            'followingChange': 50,
            'lastUpdated': datetime.now().isoformat()
        }
    ]
    
    return jsonify(mock_clients)

@clients_bp.route('/', methods=['POST'])
def add_client():
    """Add a new client"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    coach_id = session['user_id']
    data = request.json
    
    instagram_username = data.get('instagramUsername')
    display_name = data.get('displayName')
    tags = data.get('tags', [])
    initial_goal = data.get('initialGoal')
    
    if not instagram_username or not display_name:
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Fetch initial Instagram metrics
    try:
        metrics = fetch_instagram_metrics(instagram_username)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch Instagram data: {str(e)}'}), 400
    
    # TODO: Save to database
    new_client = {
        'id': str(datetime.now().timestamp()),
        'coachId': coach_id,
        'instagramUsername': instagram_username,
        'displayName': display_name,
        'tags': tags,
        'initialGoal': initial_goal,
        'currentFollowers': metrics.get('followers_count', 0),
        'currentFollowing': metrics.get('following_count', 0),
        'followersChange': 0,
        'followingChange': 0,
        'createdAt': datetime.now().isoformat(),
        'lastUpdated': datetime.now().isoformat()
    }
    
    return jsonify(new_client), 201

@clients_bp.route('/<client_id>', methods=['GET'])
def get_client(client_id):
    """Get a specific client's details"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    coach_id = session['user_id']
    
    # TODO: Query database for client
    # Verify coach owns this client
    
    mock_client = {
        'id': client_id,
        'instagramUsername': 'johndoe',
        'displayName': 'John Doe',
        'tags': ['growth', 'mindset'],
        'currentFollowers': 12500,
        'currentFollowing': 890,
        'followersChange': 450,
        'followingChange': -20,
        'notes': 'Client is making great progress...',
        'milestones': [
            {'id': '1', 'title': 'Reached 10K followers', 'completed': True, 'date': '2024-03-15'},
            {'id': '2', 'title': 'First viral post', 'completed': True, 'date': '2024-03-20'},
            {'id': '3', 'title': 'Reach 15K followers', 'completed': False, 'date': None}
        ],
        'lastUpdated': datetime.now().isoformat()
    }
    
    return jsonify(mock_client)

@clients_bp.route('/<client_id>', methods=['PUT'])
def update_client(client_id):
    """Update a client's information"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    coach_id = session['user_id']
    data = request.json
    
    # TODO: Verify coach owns this client
    # TODO: Update database
    
    return jsonify({'status': 'success', 'message': 'Client updated'})

@clients_bp.route('/<client_id>', methods=['DELETE'])
def delete_client(client_id):
    """Remove a client"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    coach_id = session['user_id']
    
    # TODO: Verify coach owns this client
    # TODO: Delete from database
    
    return jsonify({'status': 'success', 'message': 'Client removed'})

@clients_bp.route('/<client_id>/metrics', methods=['GET'])
def get_client_metrics(client_id):
    """Get historical metrics for a client"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    coach_id = session['user_id']
    period = request.args.get('period', '30')  # days
    
    # TODO: Query database for historical metrics
    # For now, return mock data
    mock_metrics = []
    for i in range(int(period)):
        mock_metrics.append({
            'date': (datetime.now() - timedelta(days=int(period) - i)).isoformat(),
            'followers': 10000 + i * 100,
            'following': 800 - i * 2
        })
    
    return jsonify(mock_metrics)

@clients_bp.route('/<client_id>/refresh', methods=['POST'])
def refresh_client_metrics(client_id):
    """Manually refresh a client's Instagram metrics"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    coach_id = session['user_id']
    
    # TODO: Get client's Instagram username from database
    instagram_username = 'johndoe'  # Mock
    
    try:
        metrics = fetch_instagram_metrics(instagram_username)
        
        # TODO: Update database with new metrics
        # TODO: Calculate changes from previous metrics
        
        return jsonify({
            'status': 'success',
            'metrics': metrics
        })
    except Exception as e:
        return jsonify({'error': f'Failed to refresh metrics: {str(e)}'}), 500

def fetch_instagram_metrics(username):
    """
    Fetch Instagram metrics for a user
    Note: This requires Instagram Graph API access
    For public accounts, you can use web scraping or third-party APIs
    """
    # TODO: Implement actual Instagram API call
    # This is a placeholder that would need proper Instagram Business API setup
    
    # Option 1: Instagram Graph API (requires business account)
    # url = f"{INSTAGRAM_API_URL}/{username}?fields=followers_count,following_count&access_token={INSTAGRAM_ACCESS_TOKEN}"
    # response = requests.get(url)
    # return response.json()
    
    # Option 2: Use a third-party service like RapidAPI Instagram API
    # For now, return mock data
    return {
        'followers_count': 10000,
        'following_count': 800
    }

@clients_bp.route('/<client_id>/notes', methods=['PUT'])
def update_client_notes(client_id):
    """Update session notes for a client"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    coach_id = session['user_id']
    data = request.json
    notes = data.get('notes', '')
    
    # TODO: Verify coach owns this client
    # TODO: Update database
    
    return jsonify({'status': 'success', 'message': 'Notes updated'})

@clients_bp.route('/<client_id>/milestones', methods=['POST'])
def add_milestone(client_id):
    """Add a milestone for a client"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    coach_id = session['user_id']
    data = request.json
    
    title = data.get('title')
    if not title:
        return jsonify({'error': 'Title is required'}), 400
    
    # TODO: Save milestone to database
    new_milestone = {
        'id': str(datetime.now().timestamp()),
        'title': title,
        'completed': False,
        'date': None,
        'createdAt': datetime.now().isoformat()
    }
    
    return jsonify(new_milestone), 201

@clients_bp.route('/<client_id>/milestones/<milestone_id>', methods=['PUT'])
def toggle_milestone(client_id, milestone_id):
    """Toggle milestone completion status"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    coach_id = session['user_id']
    data = request.json
    completed = data.get('completed', False)
    
    # TODO: Update database
    
    return jsonify({
        'status': 'success',
        'completed': completed,
        'date': datetime.now().isoformat() if completed else None
    })

from datetime import timedelta
