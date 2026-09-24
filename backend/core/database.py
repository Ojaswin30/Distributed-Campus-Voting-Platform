import sqlite3
from config import DB_PATH


def get_db() -> sqlite3.Connection:
    """
    Returns an active SQLite database connection with row factory,
    foreign key constraints enabled, and WAL journal mode for concurrency.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn
