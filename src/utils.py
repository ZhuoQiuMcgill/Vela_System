from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from models import TransactionType, Transaction, Category
from sqlalchemy import func


def hash_password(password):
    """Create a secure hash of the password using SHA-256 (built-in to Werkzeug)."""
    from werkzeug.security import generate_password_hash
    # Use sha256 instead of bcrypt since bcrypt is causing issues
    return generate_password_hash(password, method='pbkdf2:sha256')


def verify_password(stored_hash, provided_password):
    """Verify a stored password hash against a provided password."""
    from werkzeug.security import check_password_hash
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


def calculate_category_stats(user, start_date, end_date):
    """Calculate category statistics for a given date range."""
    # Get all transactions in date range
    transactions = Transaction.query.filter_by(user_id=user.id).filter(
        Transaction.start_date >= start_date,
        Transaction.start_date <= end_date
    ).all()

    # Get all user's categories
    categories = Category.query.filter_by(user_id=user.id).all()
    category_map = {c.id: c.name for c in categories}

    # Initialize statistics
    income_by_category = {}
    expense_by_category = {}
    total_income = 0
    total_expense = 0

    # Process each transaction
    for t in transactions:
        # Get category name
        category_name = category_map.get(t.category_id, "Uncategorized")

        # Calculate the amount to consider for this date range
        amount = t.amount

        # For single transactions
        if not t.is_recurring and not t.duration_days:
            if t.transaction_type == TransactionType.INCOME:
                total_income += amount
                income_by_category[category_name] = income_by_category.get(category_name, 0) + amount
            else:
                total_expense += amount
                expense_by_category[category_name] = expense_by_category.get(category_name, 0) + amount
        # For recurring income, prorate based on cycles in the date range
        elif t.is_recurring and t.cycle_days:
            # Only include if transaction has started by the end date
            if t.start_date <= end_date:
                # Calculate days in this range where the transaction is active
                range_days = (min(end_date, datetime.utcnow().date()) -
                              max(start_date, t.start_date)).days + 1
                # Calculate cycles in this range
                cycles_in_range = max(1, range_days // t.cycle_days)
                prorated_amount = amount * cycles_in_range

                total_income += prorated_amount
                income_by_category[category_name] = income_by_category.get(category_name, 0) + prorated_amount
        # For continuous expenses, prorate based on active days in the date range
        elif t.duration_days:
            # Calculate end date of expense
            expense_end_date = t.start_date + timedelta(days=t.duration_days)
            # Only include if transaction period overlaps with the date range
            if t.start_date <= end_date and expense_end_date >= start_date:
                # Calculate days in this range where the expense is active
                active_start = max(start_date, t.start_date)
                active_end = min(end_date, expense_end_date)
                active_days = (active_end - active_start).days + 1

                # Prorate the amount
                prorated_amount = (amount / t.duration_days) * active_days

                total_expense += prorated_amount
                expense_by_category[category_name] = expense_by_category.get(category_name, 0) + prorated_amount

    # Calculate percentages
    income_categories = []
    expense_categories = []

    for category, amount in income_by_category.items():
        percentage = round((amount / total_income * 100) if total_income > 0 else 0, 2)
        income_categories.append({
            'name': category,
            'amount': round(amount, 2),
            'percentage': percentage
        })

    for category, amount in expense_by_category.items():
        percentage = round((amount / total_expense * 100) if total_expense > 0 else 0, 2)
        expense_categories.append({
            'name': category,
            'amount': round(amount, 2),
            'percentage': percentage
        })

    # Sort by amount descending
    income_categories.sort(key=lambda x: x['amount'], reverse=True)
    expense_categories.sort(key=lambda x: x['amount'], reverse=True)

    return {
        'income_categories': income_categories,
        'expense_categories': expense_categories,
        'total_income': round(total_income, 2),
        'total_expense': round(total_expense, 2)
    }
