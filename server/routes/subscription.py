from flask import Blueprint, request, jsonify, session
from datetime import datetime, timedelta
import stripe
import os

subscription_bp = Blueprint('subscription', __name__, url_prefix='/api/subscription')

# Stripe configuration
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')

# Price IDs (set these in your Stripe dashboard)
PRICE_IDS = {
    'premium': os.getenv('STRIPE_PREMIUM_PRICE_ID'),
    'pro': os.getenv('STRIPE_PRO_PRICE_ID')
}

@subscription_bp.route('/status', methods=['GET'])
def get_subscription_status():
    """Get current user's subscription status"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        # Query database for user subscription
        import sqlite3
        db_path = os.path.join(os.path.dirname(__file__), '..', 'waler.db')
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT subscription_tier, subscription_status, trial_ends_at
            FROM users
            WHERE id = ?
        ''', (user_id,))
        
        user = cursor.fetchone()
        conn.close()
        
        if user:
            return jsonify({
                'tier': user['subscription_tier'],  # 'premium' | 'pro' | None
                'trialEndsAt': user['trial_ends_at'],
                'subscriptionEndsAt': None,
                'status': user['subscription_status'] or 'inactive'
            })
        else:
            return jsonify({
                'tier': None,
                'trialEndsAt': None,
                'subscriptionEndsAt': None,
                'status': 'inactive'
            })
    except Exception as e:
        print(f"Error fetching subscription status: {e}")
        return jsonify({'error': 'Failed to fetch subscription status'}), 500

@subscription_bp.route('/create-checkout', methods=['POST'])
def create_checkout_session():
    """Create Stripe Checkout session for subscription"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    tier = data.get('tier')  # 'premium' or 'pro'
    
    if tier not in PRICE_IDS:
        return jsonify({'error': 'Invalid tier'}), 400
    
    user_id = session['user_id']
    
    try:
        # Create Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
            customer_email=session.get('email'),
            client_reference_id=str(user_id),
            payment_method_types=['card'],
            line_items=[{
                'price': PRICE_IDS[tier],
                'quantity': 1,
            }],
            mode='subscription',
            subscription_data={
                'trial_period_days': 7 if tier == 'premium' else 14,
                'metadata': {
                    'user_id': user_id,
                    'tier': tier
                }
            },
            success_url=f"{os.getenv('CLIENT_URL')}/dashboard?subscription=success",
            cancel_url=f"{os.getenv('CLIENT_URL')}/onboard?subscription=cancelled",
        )
        
        return jsonify({'checkoutUrl': checkout_session.url})
    
    except Exception as e:
        print(f"Stripe error: {e}")
        return jsonify({'error': 'Failed to create checkout session'}), 500

@subscription_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks"""
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({'error': 'Invalid signature'}), 400
    
    # Handle different event types
    if event['type'] == 'checkout.session.completed':
        session_data = event['data']['object']
        handle_checkout_completed(session_data)
    
    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        handle_subscription_updated(subscription)
    
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        handle_subscription_cancelled(subscription)
    
    return jsonify({'status': 'success'})

def handle_checkout_completed(session):
    """Handle successful checkout"""
    user_id = session.get('client_reference_id')
    subscription_id = session.get('subscription')
    
    # TODO: Update database with subscription info
    print(f"Checkout completed for user {user_id}, subscription {subscription_id}")

def handle_subscription_updated(subscription):
    """Handle subscription updates"""
    user_id = subscription['metadata'].get('user_id')
    tier = subscription['metadata'].get('tier')
    status = subscription['status']
    
    # TODO: Update database
    print(f"Subscription updated for user {user_id}: {tier} - {status}")

def handle_subscription_cancelled(subscription):
    """Handle subscription cancellation"""
    user_id = subscription['metadata'].get('user_id')
    
    # TODO: Update database to remove subscription
    print(f"Subscription cancelled for user {user_id}")

@subscription_bp.route('/cancel', methods=['POST'])
def cancel_subscription():
    """Cancel user's subscription"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    # TODO: Get user's Stripe subscription ID from database
    # TODO: Cancel subscription via Stripe API
    # stripe.Subscription.delete(subscription_id)
    
    return jsonify({'status': 'success'})
