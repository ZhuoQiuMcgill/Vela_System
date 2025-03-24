# VELA SYSTEM API Documentation

This document provides the complete API reference for VELA SYSTEM, a personal accounting system with dynamic daily budget calculation capabilities.

## Base URL

All API endpoints are relative to: `http://[server-address]/api/`

## Authentication

Most endpoints require authentication using a JWT token. Include the token in the `Authorization` header as follows:

```
Authorization: Bearer <your-token>
```

## API Endpoints

### Authentication

#### Register User

Creates a new user account.

- **URL**: `/register`
- **Method**: `POST`
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "password": "secretpassword",
    "initial_balance": 5000.00
  }
  ```
  | Field | Type | Required | Description |
  |-------|------|----------|-------------|
  | username | string | Yes | Unique username for the account |
  | password | string | Yes | User's password |
  | initial_balance | float | No | Initial account balance (defaults to 0.0) |

- **Response**:
  - **Success**: `201 Created`
    ```json
    {
      "message": "User created successfully"
    }
    ```
  - **Error**: `400 Bad Request`
    ```json
    {
      "message": "Username already exists"
    }
    ```
    or
    ```json
    {
      "message": "Missing username or password"
    }
    ```
  - **Error**: `500 Internal Server Error`
    ```json
    {
      "message": "An error occurred"
    }
    ```

#### User Login

Authenticates a user and returns a JWT token.

- **URL**: `/login`
- **Method**: `POST`
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "password": "secretpassword"
  }
  ```
  | Field | Type | Required | Description |
  |-------|------|----------|-------------|
  | username | string | Yes | User's username |
  | password | string | Yes | User's password |

- **Response**:
  - **Success**: `200 OK`
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user_id": 1,
      "username": "johndoe",
      "current_total_balance": 5000.00
    }
    ```
  - **Error**: `401 Unauthorized`
    ```json
    {
      "message": "Invalid username or password"
    }
    ```
  - **Error**: `400 Bad Request`
    ```json
    {
      "message": "Missing username or password"
    }
    ```

### Transactions

#### Create Transaction

Creates a new transaction record.

- **URL**: `/transactions`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "amount": 1000.00,
    "transaction_type": "income",
    "description": "Freelance payment",
    "is_recurring": false,
    "start_date": "2024-01-15"
  }
  ```
  | Field | Type | Required | Description |
  |-------|------|----------|-------------|
  | amount | float | Yes | Transaction amount |
  | transaction_type | string | Yes | Either "income" or "expense" |
  | description | string | No | Description of the transaction |
  | is_recurring | boolean | No | Whether this is a recurring transaction (defaults to false) |
  | cycle_days | integer | No | For recurring transactions, the cycle period in days |
  | duration_days | integer | No | For continuous expenses, the duration in days |
  | start_date | string | No | Transaction start date in YYYY-MM-DD format (defaults to current date) |

- **Response**:
  - **Success**: `201 Created`
    ```json
    {
      "message": "Transaction created successfully",
      "transaction_id": 1,
      "current_total_balance": 6000.00
    }
    ```
  - **Error**: `400 Bad Request`
    ```json
    {
      "message": "Missing required fields"
    }
    ```
    or
    ```json
    {
      "message": "Invalid transaction type"
    }
    ```
  - **Error**: `500 Internal Server Error`
    ```json
    {
      "message": "An error occurred: [error details]"
    }
    ```

#### Get Transactions

Retrieves a list of transactions with optional date filters.

- **URL**: `/transactions`
- **Method**: `GET`
- **Authentication**: Required
- **URL Parameters**:
  | Parameter | Required | Description |
  |-----------|----------|-------------|
  | start | No | Start date filter in YYYY-MM-DD format |
  | end | No | End date filter in YYYY-MM-DD format |

- **Response**:
  - **Success**: `200 OK`
    ```json
    {
      "transactions": [
        {
          "id": 1,
          "amount": 1000.00,
          "transaction_type": "income",
          "description": "Freelance payment",
          "created_at": "2024-01-15 12:30:45",
          "start_date": "2024-01-15",
          "end_date": null,
          "is_recurring": false,
          "cycle_days": null,
          "duration_days": null
        },
        {
          "id": 2,
          "amount": 500.00,
          "transaction_type": "expense",
          "description": "Rent",
          "created_at": "2024-01-16 10:15:30",
          "start_date": "2024-01-16",
          "end_date": null,
          "is_recurring": false,
          "cycle_days": null,
          "duration_days": null
        }
      ],
      "current_total_balance": 5500.00
    }
    ```

#### Get Transaction Details

Retrieves details for a specific transaction.

- **URL**: `/transactions/{transaction_id}`
- **Method**: `GET`
- **Authentication**: Required
- **URL Parameters**:
  | Parameter | Required | Description |
  |-----------|----------|-------------|
  | transaction_id | Yes | ID of the transaction to retrieve |

- **Response**:
  - **Success**: `200 OK`
    ```json
    {
      "id": 1,
      "amount": 1000.00,
      "transaction_type": "income",
      "description": "Freelance payment",
      "created_at": "2024-01-15 12:30:45",
      "start_date": "2024-01-15",
      "end_date": null,
      "is_recurring": false,
      "cycle_days": null,
      "duration_days": null
    }
    ```
  - **Error**: `404 Not Found`
    ```json
    {
      "message": "Transaction not found"
    }
    ```

#### Update Transaction

Updates an existing transaction.

- **URL**: `/transactions/{transaction_id}`
- **Method**: `PUT`
- **Authentication**: Required
- **URL Parameters**:
  | Parameter | Required | Description |
  |-----------|----------|-------------|
  | transaction_id | Yes | ID of the transaction to update |

- **Request Body**: Include only the fields you want to update
  ```json
  {
    "amount": 1200.00,
    "description": "Updated freelance payment"
  }
  ```
  | Field | Type | Required | Description |
  |-------|------|----------|-------------|
  | amount | float | No | New transaction amount |
  | transaction_type | string | No | New transaction type ("income" or "expense") |
  | description | string | No | New description |
  | is_recurring | boolean | No | Update recurring status |
  | cycle_days | integer | No | Update cycle period |
  | duration_days | integer | No | Update duration |
  | start_date | string | No | Update start date (YYYY-MM-DD format) |

- **Response**:
  - **Success**: `200 OK`
    ```json
    {
      "message": "Transaction updated successfully",
      "current_total_balance": 5700.00
    }
    ```
  - **Error**: `404 Not Found`
    ```json
    {
      "message": "Transaction not found"
    }
    ```
  - **Error**: `400 Bad Request`
    ```json
    {
      "message": "Invalid transaction type"
    }
    ```
  - **Error**: `500 Internal Server Error`
    ```json
    {
      "message": "An error occurred: [error details]"
    }
    ```

#### Delete Transaction

Deletes a transaction.

- **URL**: `/transactions/{transaction_id}`
- **Method**: `DELETE`
- **Authentication**: Required
- **URL Parameters**:
  | Parameter | Required | Description |
  |-----------|----------|-------------|
  | transaction_id | Yes | ID of the transaction to delete |

- **Response**:
  - **Success**: `200 OK`
    ```json
    {
      "message": "Transaction deleted successfully",
      "current_total_balance": 5000.00
    }
    ```
  - **Error**: `404 Not Found`
    ```json
    {
      "message": "Transaction not found"
    }
    ```
  - **Error**: `500 Internal Server Error`
    ```json
    {
      "message": "An error occurred: [error details]"
    }
    ```

### Reports

#### Get Day Capacity

Retrieves the daily available budget (day_capacity) for a specific date.

- **URL**: `/reports/day_capacity`
- **Method**: `GET`
- **Authentication**: Required
- **URL Parameters**:
  | Parameter | Required | Description |
  |-----------|----------|-------------|
  | date | No | Date to calculate day capacity for (YYYY-MM-DD format, defaults to current date) |

- **Response**:
  - **Success**: `200 OK`
    ```json
    {
      "date": "2024-01-20",
      "day_capacity": 400.00
    }
    ```
  - **Error**: `400 Bad Request`
    ```json
    {
      "message": "Invalid date format, use YYYY-MM-DD"
    }
    ```

#### Get Date Range Summary

Retrieves a summary of transactions and day capacity trend for a date range.

- **URL**: `/reports/summary`
- **Method**: `GET`
- **Authentication**: Required
- **URL Parameters**:
  | Parameter | Required | Description |
  |-----------|----------|-------------|
  | start | Yes | Start date of the summary period (YYYY-MM-DD format) |
  | end | Yes | End date of the summary period (YYYY-MM-DD format) |

- **Response**:
  - **Success**: `200 OK`
    ```json
    {
      "start_date": "2024-01-01",
      "end_date": "2024-01-31",
      "total_income": 3000.00,
      "total_expense": 1500.00,
      "net_change": 1500.00,
      "current_total_balance": 6500.00,
      "day_capacity_trend": [
        {
          "date": "2024-01-01",
          "day_capacity": 300.00
        },
        {
          "date": "2024-01-02",
          "day_capacity": 300.00
        },
        // Additional days...
        {
          "date": "2024-01-31",
          "day_capacity": 350.00
        }
      ]
    }
    ```
  - **Error**: `400 Bad Request`
    ```json
    {
      "message": "Both start and end dates are required"
    }
    ```
    or
    ```json
    {
      "message": "Invalid date format, use YYYY-MM-DD"
    }
    ```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - The request succeeded |
| 201 | Created - A new resource was created |
| 400 | Bad Request - Invalid input parameters |
| 401 | Unauthorized - Missing or invalid authentication |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server-side error |

## Transaction Types

The system supports two transaction types:
- `income`: Increases your balance
- `expense`: Decreases your balance

## Transaction Categories

Transactions can be categorized as:
1. **Single transactions**: One-time income or expense (default)
2. **Recurring income**: Regular income with a specified cycle period (e.g., salary)
3. **Continuous expense**: Expense spread over a specific duration (e.g., vacation costs)

## Example API Usage Scenarios

### Scenario 1: Register and Add Monthly Income

1. Register a new user:
   ```bash
   curl -X POST http://[server-address]/api/register \
     -H "Content-Type: application/json" \
     -d '{"username": "alice", "password": "securepass", "initial_balance": 5000.00}'
   ```

2. Login to get a token:
   ```bash
   curl -X POST http://[server-address]/api/login \
     -H "Content-Type: application/json" \
     -d '{"username": "alice", "password": "securepass"}'
   ```

3. Add a monthly salary (recurring income):
   ```bash
   curl -X POST http://[server-address]/api/transactions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer [your-token]" \
     -d '{
       "amount": 3000.00,
       "transaction_type": "income",
       "description": "Monthly Salary",
       "is_recurring": true,
       "cycle_days": 30,
       "start_date": "2024-01-01"
     }'
   ```

### Scenario 2: Add Vacation Expense and Check Day Capacity

1. Add a 10-day vacation expense:
   ```bash
   curl -X POST http://[server-address]/api/transactions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer [your-token]" \
     -d '{
       "amount": 1500.00,
       "transaction_type": "expense",
       "description": "Vacation expenses",
       "duration_days": 10,
       "start_date": "2024-01-15"
     }'
   ```

2. Check day capacity during vacation:
   ```bash
   curl -X GET "http://[server-address]/api/reports/day_capacity?date=2024-01-18" \
     -H "Authorization: Bearer [your-token]"
   ```

### Scenario 3: Get Monthly Summary

Retrieve a summary for January 2024:
```bash
curl -X GET "http://[server-address]/api/reports/summary?start=2024-01-01&end=2024-01-31" \
  -H "Authorization: Bearer [your-token]"
```
