# VELA SYSTEM

A lightweight personal accounting system backend deployed on a cloud server.

## Project Overview

VELA SYSTEM is a Flask-based API-only service for personal income/expense management with dynamically calculated daily available budget (day_capacity). The application uses SQLite for data persistence with a single-file database stored directly in the project directory.

## Core Features

1. **User System**
   - Registration/Login with username and password authentication
   - Passwords stored as bcrypt hashes
   - JWT-based authentication for API endpoints

2. **Amount Management**
   - Support for three transaction types:
     - Single transactions (immediate effect)
     - Recurring income (with cycle period)
     - Continuous expenses (with duration)
   - Complete CRUD operations for transactions
   - Historical record queries with time range filtering

3. **Dynamic Day Capacity Calculation**
   - Daily available budget based on active recurring incomes and continuous expenses
   - Validity period judgments for different transaction types
   - Real-time formula: Daily available budget = Σ(active recurring income allocations) - Σ(active continuous expense allocations)

4. **Data Aggregation**
   - Reports by day/month/custom periods
   - Income/expense totals
   - Daily available budget trends
   - Current total balance

## Technical Implementation

### Project Structure

- `app.py` - Main application file
- `models.py` - SQLAlchemy data models
- `routes.py` - API endpoints
- `utils.py` - Helper functions for password hashing and day_capacity calculations
- `config.py` - Application configuration
- `vela.db` - SQLite database file (created on first run)

### Database Design

- **users table**
  - id, username, password_hash, initial_balance
  - current_total_balance (dynamically calculated)

- **transactions table**
  - id, user_id, amount, transaction_type, description
  - created_at, start_date, end_date
  - is_recurring, cycle_days, duration_days

### API Endpoints

#### Authentication
- `POST /api/register` - Create a new user account
- `POST /api/login` - Authenticate and get JWT token

#### Transaction Operations
- `POST /api/transactions` - Create a new transaction
- `GET /api/transactions` - List transactions (with optional time filters)
- `GET /api/transactions/<id>` - Get transaction details
- `PUT /api/transactions/<id>` - Update transaction
- `DELETE /api/transactions/<id>` - Delete transaction

#### Reports
- `GET /api/reports/day_capacity?date=YYYY-MM-DD` - Get day_capacity for a specific date
- `GET /api/reports/summary?start=YYYY-MM-DD&end=YYYY-MM-DD` - Get summary for a date range

## Installation and Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd vela-system
   ```

2. **Create a virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**

   ```bash
   python app.py
   ```

   The server will start at `http://127.0.0.1:5000`

## API Usage Examples

### Register a new user

```bash
curl -X POST http://127.0.0.1:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username": "user1", "password": "password123", "initial_balance": 10000}'
```

### Login and get token

```bash
curl -X POST http://127.0.0.1:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user1", "password": "password123"}'
```

### Add a recurring income (monthly salary)

```bash
curl -X POST http://127.0.0.1:5000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "amount": 30000,
    "transaction_type": "income",
    "description": "Monthly Salary",
    "is_recurring": true,
    "cycle_days": 30,
    "start_date": "2023-01-01"
  }'
```

### Add a continuous expense

```bash
curl -X POST http://127.0.0.1:5000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "amount": 6000,
    "transaction_type": "expense",
    "description": "10-day trip expenses",
    "duration_days": 10,
    "start_date": "2023-01-15"
  }'
```

### Get day capacity for a specific date

```bash
curl -X GET "http://127.0.0.1:5000/api/reports/day_capacity?date=2023-01-20" \
  -H "Authorization: Bearer <your-token>"
```

### Get summary for a date range

```bash
curl -X GET "http://127.0.0.1:5000/api/reports/summary?start=2023-01-01&end=2023-01-31" \
  -H "Authorization: Bearer <your-token>"
```

## Security Notes

- Passwords are hashed using bcrypt
- API endpoints are protected with JWT authentication
- Set a strong SECRET_KEY in production using environment variables

## Performance Considerations

- Single-user response time is optimized for <500ms
- Date range queries support up to 3 years of data
- All amounts are stored with 2 decimal places precision
