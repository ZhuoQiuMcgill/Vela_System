from flask import Blueprint, request, jsonify
from models import db, User, Transaction, TransactionType
from utils import hash_password, verify_password, calculate_day_capacity
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
from functools import wraps
import jwt
import os

api = Blueprint('api', __name__)
SECRET_KEY = os.environ.get('SECRET_KEY', 'vela-system-secret-key')

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
            
        try:
            # Remove 'Bearer ' prefix if it exists
            if token.startswith('Bearer '):
                token = token[7:]
                
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
            
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

# Authentication routes
@api.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Missing username or password'}), 400
        
    username = data['username']
    password = data['password']
    initial_balance = data.get('initial_balance', 0.0)
    
    # Check if user already exists
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 400
        
    # Create new user
    new_user = User(
        username=username,
        password_hash=hash_password(password),
        initial_balance=initial_balance
    )
    
    db.session.add(new_user)
    
    try:
        db.session.commit()
        return jsonify({'message': 'User created successfully'}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'An error occurred'}), 500

@api.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Missing username or password'}), 400
        
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not verify_password(user.password_hash, data['password']):
        return jsonify({'message': 'Invalid username or password'}), 401
        
    # Generate JWT token
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=1)  # 1 day expiration
    }, SECRET_KEY, algorithm="HS256")
    
    return jsonify({
        'token': token,
        'user_id': user.id,
        'username': user.username,
        'current_total_balance': user.current_total_balance
    }), 200

# Transaction routes
@api.route('/transactions', methods=['POST'])
@token_required
def create_transaction(current_user):
    data = request.get_json()
    
    if not data or 'amount' not in data or 'transaction_type' not in data:
        return jsonify({'message': 'Missing required fields'}), 400
        
    # Validate transaction type
    try:
        transaction_type = TransactionType(data['transaction_type'])
    except ValueError:
        return jsonify({'message': 'Invalid transaction type'}), 400
        
    # Create new transaction
    new_transaction = Transaction(
        user_id=current_user.id,
        amount=float(data['amount']),
        transaction_type=transaction_type,
        description=data.get('description', ''),
        is_recurring=data.get('is_recurring', False),
        cycle_days=data.get('cycle_days'),
        duration_days=data.get('duration_days'),
        start_date=datetime.strptime(data.get('start_date', datetime.utcnow().strftime('%Y-%m-%d')), '%Y-%m-%d').date()
    )
    
    # Calculate end_date for continuous expenses
    if new_transaction.duration_days:
        new_transaction.end_date = new_transaction.start_date + timedelta(days=new_transaction.duration_days)
    
    db.session.add(new_transaction)
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Transaction created successfully',
            'transaction_id': new_transaction.id,
            'current_total_balance': current_user.current_total_balance
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'An error occurred: {str(e)}'}), 500

@api.route('/transactions', methods=['GET'])
@token_required
def get_transactions(current_user):
    # Get query parameters
    start_date = request.args.get('start')
    end_date = request.args.get('end')
    
    query = Transaction.query.filter_by(user_id=current_user.id)
    
    # Apply date filters if provided
    if start_date:
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        query = query.filter(Transaction.start_date >= start)
        
    if end_date:
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
        query = query.filter(Transaction.start_date <= end)
    
    transactions = query.all()
    
    result = []
    for t in transactions:
        result.append({
            'id': t.id,
            'amount': t.amount,
            'transaction_type': t.transaction_type.value,
            'description': t.description,
            'created_at': t.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'start_date': t.start_date.strftime('%Y-%m-%d'),
            'end_date': t.end_date.strftime('%Y-%m-%d') if t.end_date else None,
            'is_recurring': t.is_recurring,
            'cycle_days': t.cycle_days,
            'duration_days': t.duration_days
        })
    
    return jsonify({
        'transactions': result,
        'current_total_balance': current_user.current_total_balance
    }), 200

@api.route('/transactions/<int:transaction_id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
def transaction_operations(current_user, transaction_id):
    transaction = Transaction.query.filter_by(
        id=transaction_id, 
        user_id=current_user.id
    ).first()
    
    if not transaction:
        return jsonify({'message': 'Transaction not found'}), 404
    
    # GET operation
    if request.method == 'GET':
        result = {
            'id': transaction.id,
            'amount': transaction.amount,
            'transaction_type': transaction.transaction_type.value,
            'description': transaction.description,
            'created_at': transaction.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'start_date': transaction.start_date.strftime('%Y-%m-%d'),
            'end_date': transaction.end_date.strftime('%Y-%m-%d') if transaction.end_date else None,
            'is_recurring': transaction.is_recurring,
            'cycle_days': transaction.cycle_days,
            'duration_days': transaction.duration_days
        }
        return jsonify(result), 200
    
    # PUT operation
    elif request.method == 'PUT':
        data = request.get_json()
        
        if 'amount' in data:
            transaction.amount = float(data['amount'])
            
        if 'transaction_type' in data:
            try:
                transaction.transaction_type = TransactionType(data['transaction_type'])
            except ValueError:
                return jsonify({'message': 'Invalid transaction type'}), 400
                
        if 'description' in data:
            transaction.description = data['description']
            
        if 'is_recurring' in data:
            transaction.is_recurring = data['is_recurring']
            
        if 'cycle_days' in data:
            transaction.cycle_days = data['cycle_days']
            
        if 'duration_days' in data:
            transaction.duration_days = data['duration_days']
            # Update end_date if duration changes
            if transaction.duration_days:
                transaction.end_date = transaction.start_date + timedelta(days=transaction.duration_days)
            else:
                transaction.end_date = None
                
        if 'start_date' in data:
            transaction.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            # Update end_date if start_date changes
            if transaction.duration_days:
                transaction.end_date = transaction.start_date + timedelta(days=transaction.duration_days)
        
        try:
            db.session.commit()
            return jsonify({
                'message': 'Transaction updated successfully',
                'current_total_balance': current_user.current_total_balance
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'An error occurred: {str(e)}'}), 500
    
    # DELETE operation
    elif request.method == 'DELETE':
        db.session.delete(transaction)
        
        try:
            db.session.commit()
            return jsonify({
                'message': 'Transaction deleted successfully',
                'current_total_balance': current_user.current_total_balance
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'An error occurred: {str(e)}'}), 500

# Reports routes
@api.route('/reports/day_capacity', methods=['GET'])
@token_required
def get_day_capacity(current_user):
    date = request.args.get('date', datetime.utcnow().strftime('%Y-%m-%d'))
    
    try:
        # Validate date format
        datetime.strptime(date, '%Y-%m-%d')
    except ValueError:
        return jsonify({'message': 'Invalid date format, use YYYY-MM-DD'}), 400
        
    day_capacity = calculate_day_capacity(current_user, date)
    
    return jsonify({
        'date': date,
        'day_capacity': day_capacity
    }), 200

@api.route('/reports/summary', methods=['GET'])
@token_required
def get_summary(current_user):
    start_date = request.args.get('start')
    end_date = request.args.get('end')
    
    if not start_date or not end_date:
        return jsonify({'message': 'Both start and end dates are required'}), 400
        
    try:
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'message': 'Invalid date format, use YYYY-MM-DD'}), 400
        
    # Calculate summary
    total_income = 0
    total_expense = 0
    
    # Get all transactions in date range
    transactions = Transaction.query.filter_by(user_id=current_user.id).filter(
        Transaction.start_date >= start,
        Transaction.start_date <= end
    ).all()
    
    # Calculate day_capacity for each day in range
    days = (end - start).days + 1
    day_capacity_trend = []
    
    for i in range(days):
        current_date = start + timedelta(days=i)
        day_capacity = calculate_day_capacity(current_user, current_date)
        day_capacity_trend.append({
            'date': current_date.strftime('%Y-%m-%d'),
            'day_capacity': day_capacity
        })
    
    # Calculate income and expense totals
    for t in transactions:
        if not t.is_recurring and not t.duration_days:  # Only count single transactions
            if t.transaction_type == TransactionType.INCOME:
                total_income += t.amount
            else:
                total_expense += t.amount
    
    return jsonify({
        'start_date': start_date,
        'end_date': end_date,
        'total_income': round(total_income, 2),
        'total_expense': round(total_expense, 2),
        'net_change': round(total_income - total_expense, 2),
        'current_total_balance': current_user.current_total_balance,
        'day_capacity_trend': day_capacity_trend
    }), 200
