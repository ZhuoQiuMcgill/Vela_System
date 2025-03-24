from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from models import TransactionType

def hash_password(password):
    """Create a bcrypt hash of the password."""
    return generate_password_hash(password, method='bcrypt')

def verify_password(stored_hash, provided_password):
    """Verify a stored password hash against a provided password."""
    return check_password_hash(stored_hash, provided_password)

def calculate_day_capacity(user, date):
    """Calculate the daily available budget (day_capacity) for a specific date."""
    total_income_allocation = 0
    total_expense_allocation = 0
    
    date_obj = datetime.strptime(date, '%Y-%m-%d').date() if isinstance(date, str) else date
    
    for transaction in user.transactions:
        # Skip single transactions as they don't affect day_capacity
        if not transaction.is_recurring and not transaction.duration_days:
            continue
            
        # Check if transaction is active on the specified date
        if not is_transaction_active(transaction, date_obj):
            continue
            
        # Calculate daily allocation based on transaction type
        daily_allocation = calculate_daily_allocation(transaction)
        
        if transaction.transaction_type == TransactionType.INCOME:
            total_income_allocation += daily_allocation
        else:
            total_expense_allocation += daily_allocation
    
    # Day capacity = income allocations - expense allocations
    day_capacity = total_income_allocation - total_expense_allocation
    return round(day_capacity, 2)

def is_transaction_active(transaction, date):
    """Check if a transaction is active on a specific date."""
    # For single transactions, they're not considered in day_capacity
    if not transaction.is_recurring and not transaction.duration_days:
        return False
        
    # Check if the date is after the start date
    if date < transaction.start_date:
        return False
        
    # For continuous expenses, check if within duration
    if transaction.duration_days:
        end_date = transaction.start_date + timedelta(days=transaction.duration_days)
        if date >= end_date:
            return False
    
    # For recurring income with cycle_days, check if we're in a valid cycle
    if transaction.is_recurring and transaction.cycle_days:
        # Calculate days since start
        days_since_start = (date - transaction.start_date).days
        # Check if we're in a valid cycle (days_since_start % cycle_days is valid)
        if days_since_start < 0:
            return False
            
    # If we got here, the transaction is active
    return True

def calculate_daily_allocation(transaction):
    """Calculate the daily allocation for a recurring/continuous transaction."""
    if transaction.is_recurring and transaction.cycle_days:
        # Recurring income: amount / cycle_days
        return transaction.amount / transaction.cycle_days
    elif transaction.duration_days:
        # Continuous expense: amount / duration_days
        return transaction.amount / transaction.duration_days
    return 0
