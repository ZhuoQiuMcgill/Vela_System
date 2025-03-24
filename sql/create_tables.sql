-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    initial_balance FLOAT DEFAULT 0.0
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Create transactions table without the CHECK constraint
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    amount FLOAT NOT NULL,
    transaction_type VARCHAR(10) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_recurring BOOLEAN DEFAULT FALSE,
    cycle_days INTEGER,
    duration_days INTEGER,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories (user_id);