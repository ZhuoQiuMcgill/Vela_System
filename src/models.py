from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime, timedelta
import enum

db = SQLAlchemy()


class TransactionTypeAdapter(enum.Enum):
    """Custom Enum adapter to ensure lowercase values are stored in database."""
    INCOME = "income"
    EXPENSE = "expense"

    @classmethod
    def _missing_(cls, value):
        # This allows us to look up enum members by value in a case-insensitive way
        for member in cls:
            if member.value == value.lower():
                return member
        return None


# Use the adapter instead of the original enum
class TransactionType(enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"

    @classmethod
    def _missing_(cls, value):
        # Handle case-insensitive lookups
        if isinstance(value, str):
            for member in cls:
                if member.value.lower() == value.lower():
                    return member
        return None


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    initial_balance = db.Column(db.Float, default=0.0)

    transactions = db.relationship('Transaction', backref='user', lazy=True)
    categories = db.relationship('Category', backref='user', lazy=True)

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

    @hybrid_property
    def long_term_balance(self):
        """Calculate the long-term balance including all transactions."""
        # Start with initial balance
        balance = self.initial_balance

        # Add all income transactions (including recurring)
        for transaction in self.transactions:
            if transaction.transaction_type == TransactionType.INCOME:
                if transaction.is_recurring and transaction.cycle_days:
                    # Calculate total cycles from start_date to now
                    today = datetime.utcnow().date()
                    days_since_start = (today - transaction.start_date).days
                    if days_since_start >= 0:  # Only if the recurring income has started
                        cycles = (days_since_start // transaction.cycle_days) + 1
                        balance += transaction.amount * cycles
                else:  # Single income
                    balance += transaction.amount
            else:  # Expense transaction
                if transaction.duration_days:
                    # Include only if the expense period has started
                    if transaction.start_date <= datetime.utcnow().date():
                        balance -= transaction.amount
                else:  # Single expense
                    balance -= transaction.amount

        return round(balance, 2)

    def __repr__(self):
        return f'<User {self.username}>'


class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255))

    transactions = db.relationship('Transaction', backref='category', lazy=True)

    def __repr__(self):
        return f'<Category {self.name}>'


class Transaction(db.Model):
    __tablename__ = 'transactions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
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