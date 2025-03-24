# VELA SYSTEM Frontend API Reference

This document provides a concise reference of the VELA SYSTEM API endpoints for frontend development use.

## Base URL

```
http://[server-address]/api
```

## Authentication

All endpoints except registration and login require authentication via Bearer token:

```
Authorization: Bearer <jwt-token>
```

### Register User

```
POST /register
```

**Request:**
```json
{
  "username": "user1",
  "password": "password123",
  "initial_balance": 5000.00
}
```

**Response:** `201 Created`
```json
{
  "message": "User created successfully with default categories"
}
```

### Login

```
POST /login
```

**Request:**
```json
{
  "username": "user1",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": 1,
  "username": "user1",
  "current_total_balance": 5000.00,
  "long_term_balance": 8500.00
}
```

## Categories

### Get All Categories

```
GET /categories
```

**Response:** `200 OK`
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Salary",
      "description": "Regular employment income"
    },
    {
      "id": 2,
      "name": "Food",
      "description": "Groceries and dining"
    }
  ]
}
```

### Create Category

```
POST /categories
```

**Request:**
```json
{
  "name": "Travel",
  "description": "Vacation expenses"
}
```

**Response:** `201 Created`
```json
{
  "message": "Category created successfully",
  "category_id": 9,
  "name": "Travel",
  "description": "Vacation expenses"
}
```

### Update Category

```
PUT /categories/{category_id}
```

**Request:**
```json
{
  "name": "Travel & Leisure",
  "description": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "message": "Category updated successfully",
  "category": {
    "id": 9,
    "name": "Travel & Leisure",
    "description": "Updated description"
  }
}
```

### Delete Category

```
DELETE /categories/{category_id}
```

**Response:** `200 OK`
```json
{
  "message": "Category deleted successfully"
}
```

## Transactions

VELA SYSTEM supports three distinct transaction modes:

### 1. Single Transactions

Single transactions are one-time incomes or expenses that affect your balance immediately.

- **Direct Impact**: Immediately adds to or subtracts from your current balance
- **No Day Capacity Effect**: Does not affect your daily available budget
- **Example**: One-time purchase, one-time income

```
POST /transactions
```

**Request:**
```json
{
  "amount": 100.00,
  "transaction_type": "expense",
  "transaction_mode": "single",
  "category_id": 4,
  "description": "Grocery shopping",
  "start_date": "2023-01-15"
}
```

### 2. Recurring Income

Recurring income represents regular income that is spread over a cycle period.

- **Day Capacity Effect**: Contributes to your daily budget (amount ÷ cycle_days)
- **Example**: Monthly salary providing a daily budget allocation

```
POST /transactions
```

**Request:**
```json
{
  "amount": 3000.00,
  "transaction_type": "income",
  "transaction_mode": "recurring",
  "cycle_days": 30,
  "category_id": 1,
  "description": "Monthly Salary",
  "start_date": "2023-01-01"
}
```

### 3. Continuous Expenses

Continuous expenses are expenses that are distributed over time rather than impacting your balance all at once.

- **Amortization**: Cost is spread over the specified duration
- **Day Capacity Effect**: Reduces your daily budget (amount ÷ duration_days)
- **Example**: Vacation expenses spread across trip duration, or spreading the cost of a large purchase over its useful life

```
POST /transactions
```

**Request:**
```json
{
  "amount": 1200.00,
  "transaction_type": "expense",
  "transaction_mode": "continuous",
  "duration_days": 730,  // 2 years = 730 days
  "category_id": 5,
  "description": "New smartphone (amortized over 2 years)",
  "start_date": "2023-01-15"
}
```

**Response for all transaction types:** `201 Created`
```json
{
  "message": "Transaction created successfully",
  "transaction_id": 1,
  "current_total_balance": 6000.00,
  "long_term_balance": 9500.00
}
```

### Get Transactions

```
GET /transactions
```

**Query Parameters:**
- `start`: Start date (YYYY-MM-DD)
- `end`: End date (YYYY-MM-DD)
- `category_id`: Filter by category

**Response:** `200 OK`
```json
{
  "transactions": [
    {
      "id": 1,
      "amount": 1000.00,
      "transaction_type": "income",
      "transaction_mode": "single",
      "category_id": 1,
      "category_name": "Salary",
      "description": "Freelance payment",
      "created_at": "2024-01-15 12:30:45",
      "start_date": "2024-01-15",
      "end_date": null,
      "is_recurring": false,
      "cycle_days": null,
      "duration_days": null
    }
  ],
  "current_total_balance": 5500.00,
  "long_term_balance": 9000.00
}
```

### Get Transaction Details

```
GET /transactions/{transaction_id}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "amount": 1000.00,
  "transaction_type": "income",
  "transaction_mode": "single",
  "category_id": 1,
  "category_name": "Salary",
  "description": "Freelance payment",
  "created_at": "2024-01-15 12:30:45",
  "start_date": "2024-01-15",
  "end_date": null,
  "is_recurring": false,
  "cycle_days": null,
  "duration_days": null
}
```

### Update Transaction

```
PUT /transactions/{transaction_id}
```

**Request:** (include fields to update)
```json
{
  "amount": 1200.00,
  "description": "Updated description",
  "category_id": 2,
  "transaction_mode": "continuous",
  "duration_days": 365
}
```

**Response:** `200 OK`
```json
{
  "message": "Transaction updated successfully",
  "current_total_balance": 5700.00,
  "long_term_balance": 9200.00
}
```

### Update Transaction Category

```
PUT /transactions/{transaction_id}/category
```

**Request:**
```json
{
  "category_id": 3
}
```

**Response:** `200 OK`
```json
{
  "message": "Transaction category updated successfully"
}
```

### Delete Transaction

```
DELETE /transactions/{transaction_id}
```

**Response:** `200 OK`
```json
{
  "message": "Transaction deleted successfully",
  "current_total_balance": 5000.00,
  "long_term_balance": 8500.00
}
```

## Reports

### Get Day Capacity

```
GET /reports/day_capacity
```

**Query Parameters:**
- `date`: Date to calculate (YYYY-MM-DD, defaults to today)

**Response:** `200 OK`
```json
{
  "date": "2024-01-20",
  "day_capacity": 400.00,
  "current_total_balance": 5500.00,
  "long_term_balance": 9000.00
}
```

### Get Date Range Summary

```
GET /reports/summary
```

**Query Parameters:**
- `start`: Start date (YYYY-MM-DD)
- `end`: End date (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "total_income": 3000.00,
  "total_expense": 1500.00,
  "net_change": 1500.00,
  "current_total_balance": 6500.00,
  "long_term_balance": 10000.00,
  "day_capacity_trend": [
    {
      "date": "2024-01-01",
      "day_capacity": 300.00
    },
    {
      "date": "2024-01-02",
      "day_capacity": 300.00
    }
  ]
}
```

### Get Daily Category Report

```
GET /reports/categories/daily
```

**Query Parameters:**
- `date`: Date for report (YYYY-MM-DD, defaults to today)

**Response:** `200 OK`
```json
{
  "date": "2024-01-20",
  "income_categories": [
    {
      "name": "Salary",
      "amount": 1000.00,
      "percentage": 66.67
    },
    {
      "name": "Freelance",
      "amount": 500.00,
      "percentage": 33.33
    }
  ],
  "expense_categories": [
    {
      "name": "Food",
      "amount": 200.00,
      "percentage": 50.00
    },
    {
      "name": "Housing",
      "amount": 150.00,
      "percentage": 37.50
    }
  ],
  "total_income": 1500.00,
  "total_expense": 400.00
}
```

### Get Monthly Category Report

```
GET /reports/categories/monthly
```

**Query Parameters:**
- `year`: Year (e.g., 2024)
- `month`: Month (1-12)

**Response:** `200 OK`
```json
{
  "year": 2024,
  "month": 1,
  "income_categories": [
    {
      "name": "Salary",
      "amount": 3000.00,
      "percentage": 75.00
    },
    {
      "name": "Freelance",
      "amount": 1000.00,
      "percentage": 25.00
    }
  ],
  "expense_categories": [
    {
      "name": "Housing",
      "amount": 1200.00,
      "percentage": 60.00
    },
    {
      "name": "Food",
      "amount": 500.00,
      "percentage": 25.00
    }
  ],
  "total_income": 4000.00,
  "total_expense": 2000.00
}
```

## Impact on Financial Metrics

### Current Balance
- Single transactions immediately impact your current balance
- Recurring income and continuous expenses do not directly affect current balance

### Day Capacity (Daily Budget)
- Recurring income increases your daily budget by (amount ÷ cycle_days)
- Continuous expenses decrease your daily budget by (amount ÷ duration_days)
- Single transactions have no effect on day capacity

### Long-term Balance
Includes the impact of all transactions, providing a comprehensive view of your financial state.

## Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created
- `400 Bad Request`: Invalid parameters 
- `401 Unauthorized`: Missing/invalid authentication
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error