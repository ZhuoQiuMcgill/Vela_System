-- Drop indexes first
DROP INDEX IF EXISTS idx_transactions_user_id;
DROP INDEX IF EXISTS idx_transactions_date;
DROP INDEX IF EXISTS idx_transactions_type;
DROP INDEX IF EXISTS idx_transactions_category;
DROP INDEX IF EXISTS idx_categories_user_id;

-- Drop transactions table first (because it references users and categories)
DROP TABLE IF EXISTS transactions;

-- Drop categories table (because it references users)
DROP TABLE IF EXISTS categories;

-- Drop users table
DROP TABLE IF EXISTS users;