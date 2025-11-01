import sqlite3
import pandas as pd

DB_NAME = "expense_data.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def insert_expense(date, category, amount):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO expenses (date, category, amount) VALUES (?, ?, ?)",
                   (date, category, amount))
    conn.commit()
    conn.close()

def fetch_expenses():
    conn = sqlite3.connect(DB_NAME)
    df = pd.read_sql_query("SELECT * FROM expenses", conn)
    conn.close()
    return df
