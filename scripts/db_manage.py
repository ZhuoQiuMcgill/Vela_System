#!/usr/bin/env python3
"""
VELA SYSTEM - Database Management CLI

A command-line utility for managing the VELA SYSTEM SQLite database.
"""

import sqlite3
import argparse
import os
import sys

# Define paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(PROJECT_ROOT, "data.db")
SQL_DIR = os.path.join(PROJECT_ROOT, "sql")
CREATE_SQL_PATH = os.path.join(SQL_DIR, "create_tables.sql")
DROP_SQL_PATH = os.path.join(SQL_DIR, "drop_tables.sql")


def read_sql_file(file_path):
    """Read SQL statements from a file."""
    if not os.path.exists(file_path):
        print(f"Error: SQL file not found at {file_path}")
        sys.exit(1)

    try:
        with open(file_path, 'r') as file:
            return file.read()
    except Exception as e:
        print(f"Error reading SQL file: {e}")
        sys.exit(1)


def execute_sql(db_path, sql_statements):
    """Execute SQL statements on the database."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Split the SQL into separate statements and execute each one
        for statement in sql_statements.split(';'):
            if statement.strip():
                cursor.execute(statement)

        conn.commit()
        conn.close()
        return True
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return False


def create_tables(db_path):
    """Create database tables."""
    if not os.path.exists(SQL_DIR):
        print(f"Error: SQL directory not found at {SQL_DIR}")
        print("Please create the sql directory and add create_tables.sql file")
        sys.exit(1)

    sql = read_sql_file(CREATE_SQL_PATH)
    if execute_sql(db_path, sql):
        print(f"Tables created successfully in {db_path}")
        return True
    else:
        print("Failed to create tables")
        return False


def drop_tables(db_path):
    """Drop database tables."""
    if not os.path.exists(SQL_DIR):
        print(f"Error: SQL directory not found at {SQL_DIR}")
        print("Please create the sql directory and add drop_tables.sql file")
        sys.exit(1)

    sql = read_sql_file(DROP_SQL_PATH)
    if execute_sql(db_path, sql):
        print(f"Tables dropped successfully from {db_path}")
        return True
    else:
        print("Failed to drop tables")
        return False


def init_db(db_path):
    """Initialize the database (drop if exists and create new)."""
    if os.path.exists(db_path):
        drop_tables(db_path)
    return create_tables(db_path)


def main():
    """Main function to handle CLI commands."""
    parser = argparse.ArgumentParser(description="VELA SYSTEM Database Management CLI")

    # Add commands as subparsers
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Create tables command
    create_parser = subparsers.add_parser("create", help="Create database tables")

    # Drop tables command
    drop_parser = subparsers.add_parser("drop", help="Drop database tables")

    # Initialize database command
    init_parser = subparsers.add_parser("init", help="Initialize database (drop if exists and create new)")

    # Parse arguments
    args = parser.parse_args()

    # Execute the appropriate command
    if args.command == "create":
        create_tables(DB_PATH)
    elif args.command == "drop":
        drop_tables(DB_PATH)
    elif args.command == "init":
        init_db(DB_PATH)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()