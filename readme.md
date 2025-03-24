# VELA SYSTEM

A lightweight personal accounting system backend with dynamic budget calculation, category management, and long-term balance tracking.

## System Overview

VELA SYSTEM is a Flask-based API-only service designed for personal finance management. It provides a robust backend for tracking income and expenses, managing categories, and calculating daily available budgets. The system is built with simplicity and flexibility in mind, using SQLite for data persistence.

## Core Features

### 1. User Management

- **Secure Authentication**: Username/password authentication with bcrypt hashing
- **JWT-based API Access**: Stateless authentication using JSON Web Tokens
- **Balance Tracking**: Multiple balance calculations for different financial perspectives

### 2. Transaction Management

VELA SYSTEM supports three distinct transaction types:

- **Single Transactions**: One-time incomes or expenses that affect your balance immediately
- **Recurring Income**: Regular income (e.g., salary) spread over a cycle period
- **Continuous Expenses**: Expenses distributed over a specific duration (e.g., vacation costs)

### 3. Category Management

- **Automatic Categorization**: Default categories created for new users
- **Custom Categories**: Create, modify, and delete transaction categories
- **Category Reports**: Breakdown of spending and income by category

### 4. Dynamic Day Capacity Calculation

The core concept of VELA SYSTEM is the "day capacity" - your daily available budget:

- **Real-time Formula**: `Daily Budget = Σ(active recurring income allocations) - Σ(active continuous expense allocations)`
- **Time-aware Calculations**: Transactions affect day capacity only during their active periods
- **Trend Analysis**: Track how your daily budget changes over time

### 5. Multi-perspective Balance Tracking

- **Current Total Balance**: Immediate financial state (initial balance + completed transactions)
- **Long-term Balance**: Comprehensive view including the impact of recurring transactions

## System Architecture

VELA SYSTEM follows a modular architecture with clear separation of concerns:

```
VELA SYSTEM
├── app.py                 # Application entry point
├── config.py              # Configuration settings
├── models.py              # Data models and database schema
├── routes.py              # API endpoints and request handling
├── utils.py               # Helper functions and business logic
├── vela.db                # SQLite database file
├── sql/                   # SQL scripts for database management
│   ├── create_tables.sql  # Table creation scripts
│   └── drop_tables.sql    # Table cleanup scripts
└── scripts/               # Utility scripts
    ├── db_manage.py       # Database management CLI
    └── migrate_db.py      # Schema migration tool
```

## Database Design

### Entity Relationship Diagram

```
┌─────────┐       ┌──────────────┐       ┌────────────┐
│  Users  │       │ Transactions │       │ Categories │
├─────────┤       ├──────────────┤       ├────────────┤
│ id      │       │ id           │       │ id         │
│ username│◄──┐   │ user_id      │─────► │ user_id    │
│ password│   └───│ category_id  │◄───── │ name       │
│ balance │       │ amount       │       │ description│
└─────────┘       │ type         │       └────────────┘
                  │ description  │
                  │ is_recurring │
                  │ cycle_days   │
                  │ duration_days│
                  │ start_date   │
                  │ end_date     │
                  └──────────────┘
```

### Data Models

1. **User**: Account information and authentication
2. **Category**: Transaction categorization system  
3. **Transaction**: Financial transactions with timing logic

## Implementation Details

### Transaction Processing Logic

1. **Single Transactions**
   - Directly affect current total balance
   - No impact on day capacity
   - Example: One-time purchase or income

2. **Recurring Income**
   - Contribution to day capacity = amount ÷ cycle_days
   - Affects day capacity within active cycles
   - Example: Monthly salary providing daily budget allocation

3. **Continuous Expenses**
   - Daily allocation = amount ÷ duration_days
   - Reduces day capacity during active period
   - Example: Vacation expenses spread across trip duration

### Balance Calculation

1. **Current Total Balance**
   ```python
   def current_total_balance(user):
       balance = user.initial_balance
       for transaction in user.transactions:
           if not transaction.is_recurring and not transaction.duration_days:
               if transaction.transaction_type == TransactionType.INCOME:
                   balance += transaction.amount
               else:
                   balance -= transaction.amount
       return balance
   ```

2. **Long-term Balance**
   ```python
   def long_term_balance(user):
       balance = user.initial_balance
       today = datetime.utcnow().date()
       
       for transaction in user.transactions:
           # Add all income transactions
           if transaction.transaction_type == TransactionType.INCOME:
               if transaction.is_recurring and transaction.cycle_days:
                   # Calculate cycles from start_date to now
                   days_since_start = (today - transaction.start_date).days
                   if days_since_start >= 0:
                       cycles = (days_since_start // transaction.cycle_days) + 1
                       balance += transaction.amount * cycles
               else:  # Single income
                   balance += transaction.amount
           else:  # Expense transaction
               if transaction.duration_days:
                   # Include if expense period has started
                   if transaction.start_date <= today:
                       balance -= transaction.amount
               else:  # Single expense
                   balance -= transaction.amount
       
       return balance
   ```

### Day Capacity Calculation

```python
def calculate_day_capacity(user, date):
    total_income_allocation = 0
    total_expense_allocation = 0
    
    for transaction in user.transactions:
        # Skip single transactions
        if not transaction.is_recurring and not transaction.duration_days:
            continue
            
        # Check if transaction is active on the specified date
        if not is_transaction_active(transaction, date):
            continue
            
        # Calculate daily allocation
        daily_allocation = calculate_daily_allocation(transaction)
        
        if transaction.transaction_type == TransactionType.INCOME:
            total_income_allocation += daily_allocation
        else:
            total_expense_allocation += daily_allocation
    
    return total_income_allocation - total_expense_allocation
```

## Installation and Setup

### Prerequisites

- Python 3.8+
- pip (Python package manager)
- Virtual environment (recommended)

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd vela-system
   ```

2. **Create and activate a virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize database**

   ```bash
   python scripts/db_manage.py init
   ```

5. **Run the application**

   ```bash
   python src/app.py
   ```

   The API server will start at `http://127.0.0.1:5000/api/`

### Environment Variables

- `SECRET_KEY`: JWT secret key (default: "vela-system-secret-key")
- `FLASK_ENV`: Environment setting (development/production)
- `FLASK_DEBUG`: Enable debug mode (True/False)

## Upgrading From Previous Versions

### From v1.0 to v1.1

1. **Backup your database**

   ```bash
   python scripts/migrate_db.py --backup-only
   ```

2. **Run migration script**

   ```bash
   python scripts/migrate_db.py
   ```

   This will:
   - Add the categories table
   - Add category support to transactions
   - Create default categories for existing users

## Design Decisions

### SQLite Database

We chose SQLite for its simplicity, portability, and zero-configuration setup. For personal finance tracking, SQLite provides sufficient performance while allowing the entire database to be stored in a single file.

### Hybrid Property Calculations

Balance and day capacity calculations are implemented as hybrid properties that execute the calculation logic at runtime rather than storing these values in the database. This approach:

- Ensures calculations are always current
- Reduces database complexity
- Avoids data synchronization issues

### Category Implementation

The category system was designed to be:

1. **User-specific**: Each user has their own set of categories
2. **Default-enabled**: New users get pre-populated categories
3. **Flexible**: Categories can be added, renamed, or deleted
4. **Transition-friendly**: Deleted categories' transactions are moved to "Other"

## Security Considerations

- **Password Storage**: Bcrypt hashing for secure password storage
- **Token-based Authentication**: JWT with expiration for API security
- **Token Verification**: Server-side validation of tokens
- **SQL Injection Protection**: SQLAlchemy ORM prevents SQL injection
- **Environment Variables**: Sensitive configs can be set via environment variables

## Performance Optimization

- **Database Indexing**: Strategic indexes on foreign keys and frequently queried columns
- **Lazy Loading**: Relationships use lazy loading to improve query performance
- **Query Optimization**: Filtered queries to minimize data transfer
- **Calculation Caching**: Future optimization could include caching calculation results

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.