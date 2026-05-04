#!/usr/bin/env python3
"""
Initialize Waler database
Run this script to create the database and tables
"""

import sqlite3
import os

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(SCRIPT_DIR, 'waler.db')
SQL_FILE_PATH = os.path.join(SCRIPT_DIR, 'init_db.sql')

def init_database():
    """Initialize the database with schema"""
    print(f"Initializing database at: {DATABASE_PATH}")
    
    # Check if database already exists
    if os.path.exists(DATABASE_PATH):
        response = input("Database already exists. Do you want to recreate it? (y/N): ")
        if response.lower() != 'y':
            print("Aborted.")
            return
        os.remove(DATABASE_PATH)
        print("Existing database removed.")
    
    # Create database and tables
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Read and execute SQL file
        with open(SQL_FILE_PATH, 'r') as f:
            sql_script = f.read()
        
        cursor.executescript(sql_script)
        conn.commit()
        
        print("✅ Database created successfully!")
        print(f"📍 Location: {DATABASE_PATH}")
        
        # Show created tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print("\n📊 Created tables:")
        for table in tables:
            print(f"  - {table[0]}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        raise

if __name__ == "__main__":
    init_database()
