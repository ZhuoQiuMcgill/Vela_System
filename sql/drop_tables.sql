-- Drop indexes first
DROP INDEX IF EXISTS idx_transactions_user_id;
DROP INDEX IF EXISTS idx_transactions_date;
DROP INDEX IF EXISTS idx_transactions_type;

-- Drop transactions table first (because it references users)
DROP TABLE IF EXISTS transactions;

-- Drop users table
DROP TABLE IF EXISTS users;
