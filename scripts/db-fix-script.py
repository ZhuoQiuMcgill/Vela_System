#!/usr/bin/env python3
"""
Script to fix the transaction_type column constraint in the VELA SYSTEM database.
"""

import sqlite3
import os
import sys

# Define paths
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(PROJECT_ROOT, "vela.db")

def fix_transaction_type_constraint():
    """Fix the transaction_type column constraint to be case-insensitive."""
    print(f"Connecting to database at {DB_PATH}")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Begin transaction
        conn.execute("BEGIN TRANSACTION")
        
        # 1. Create a temporary table without the constraint
        print("Creating temporary table...")
        cursor.execute('''
        CREATE TABLE transactions_temp (
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
        )
        ''')
        
        # 2. Copy data from original table to temp table, converting transaction_type to lowercase
        print("Copying and normalizing data...")
        cursor.execute('''
        INSERT INTO transactions_temp
        SELECT id, user_id, category_id, amount, 
               LOWER(transaction_type), description, created_at,
               is_recurring, cycle_days, duration_days, start_date, end_date
        FROM transactions
        ''')
        
        # 3. Drop the original table
        print("Dropping original table...")
        cursor.execute('DROP TABLE transactions')
        
        # 4. Rename the temporary table to the original name
        print("Renaming temporary table...")
        cursor.execute('ALTER TABLE transactions_temp RENAME TO transactions')
        
        # 5. Recreate the indexes on the new table
        print("Recreating indexes...")
        cursor.execute('CREATE INDEX idx_transactions_user_id ON transactions (user_id)')
        cursor.execute('CREATE INDEX idx_transactions_date ON transactions (start_date, end_date)')
        cursor.execute('CREATE INDEX idx_transactions_type ON transactions (transaction_type)')
        cursor.execute('CREATE INDEX idx_transactions_category ON transactions (category_id)')
        
        # 6. Add the constraint with COLLATE NOCASE for case-insensitive comparison
        print("Adding case-insensitive constraint...")
        cursor.execute('''
        CREATE TRIGGER enforce_transaction_type_constraint
        BEFORE INSERT ON transactions
        FOR EACH ROW
        BEGIN
            SELECT CASE
                WHEN LOWER(NEW.transaction_type) NOT IN ('income', 'expense') THEN
                    RAISE(ABORT, 'CHECK constraint failed: transaction_type IN (''income'', ''expense'')')
            END;
        END;
        ''')
        
        # Commit the transaction
        conn.commit()
        print("Database updated successfully!")
        
    except sqlite3.Error as e:
        conn.rollback()
        print(f"Database error: {e}")
        return False
    finally:
        conn.close()
    
    return True

if __name__ == "__main__":
    print("VELA SYSTEM - Fix Transaction Type Constraint")
    print("=============================================")
    
    success = fix_transaction_type_constraint()
    
    if success:
        print("\nOperation completed successfully.")
        print("Please restart your Flask application to apply the changes.")
    else:
        print("\nOperation failed. Please check the error messages above.")
