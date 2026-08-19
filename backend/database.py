import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def get_db_connection():
    """
    Establish and return a connection to the PostgreSQL database
    using credentials from environment variables.
    """
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    dbname = os.getenv("DB_NAME", "postgres")
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "")

    return psycopg2.connect(
        host=host,
        port=port,
        dbname=dbname,
        user=user,
        password=password,
        connect_timeout=5
    )


def check_db_health():
    """
    Test the PostgreSQL database connection and retrieve server version and available schemas.
    Returns a dictionary containing connection status, details, version, and schemas.
    """
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Retrieve PostgreSQL server version
        cursor.execute("SELECT version();")
        version_row = cursor.fetchone()
        version = version_row[0] if version_row else "Unknown"

        # Retrieve available non-system schemas
        cursor.execute(
            "SELECT schema_name FROM information_schema.schemata "
            "WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast') "
            "ORDER BY schema_name;"
        )
        schemas = [row[0] for row in cursor.fetchall()]

        return {
            "connected": True,
            "version": version,
            "schemas": schemas,
            "details": "Successfully connected to PostgreSQL database."
        }
    except Exception as e:
        return {
            "connected": False,
            "version": None,
            "schemas": [],
            "error": str(e).strip() or "Failed to connect to PostgreSQL database."
        }
    finally:
        if cursor is not None:
            try:
                cursor.close()
            except Exception:
                pass
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
