from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime, timedelta
import enum

db = SQLAlchemy()

class TransactionType(enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    initial_balance = db.Column(db.Float, default=0.0)
    
    transactions = db.relationship('Transaction', backref='user', lazy=True)
    
    @hybrid_property
    def current_total_balance(self):
        """Dynamically calculate the current total balance."""
        # Initial balance + sum of all single transactions
        balance = self.initial_balance
        
        for transaction in self.transactions:
            if not transaction.is_recurring and not transaction.duration_days:
                # Only add single transactions to the balance
                if transaction.transaction_type == TransactionType.INCOME:
                    balance += transaction.amount
                else:
                    balance -= transaction.amount
                    
        return round(balance, 2)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    transaction_type = db.Column(db.Enum(TransactionType), nullable=False)
    description = db.Column(db.String(255))
    
    # Time-related fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # For recurring income
    is_recurring = db.Column(db.Boolean, default=False)
    cycle_days = db.Column(db.Integer)  # e.g., 30 for monthly
    
    # For continuous expense
    duration_days = db.Column(db.Integer)  # e.g., 10 for a 10-day expense
    
    # Start and end dates
    start_date = db.Column(db.Date, default=datetime.utcnow().date)
    end_date = db.Column(db.Date)  # For continuous expenses
    
    def __repr__(self):
        return f'<Transaction {self.id}: {self.amount} ({self.transaction_type})>'
