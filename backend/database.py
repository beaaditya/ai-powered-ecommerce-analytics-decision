import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def get_db_connection():
    """
    Establish and return a connection to the PostgreSQL database
    using credentials from environment variables.
    Supports either DATABASE_URL (for Supabase / Render cloud deployments)
    or individual DB_* environment variables (for local development).
    """
    database_url = os.getenv("DATABASE_URL")
    connect_timeout = int(os.getenv("DB_CONNECT_TIMEOUT", "10"))
    sslmode = os.getenv("DB_SSLMODE")

    if database_url and database_url.strip():
        conn_kwargs = {"connect_timeout": connect_timeout}
        if sslmode:
            conn_kwargs["sslmode"] = sslmode
        return psycopg2.connect(database_url.strip(), **conn_kwargs)

    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    dbname = os.getenv("DB_NAME", "postgres")
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "")

    conn_kwargs = {
        "host": host,
        "port": port,
        "dbname": dbname,
        "user": user,
        "password": password,
        "connect_timeout": connect_timeout,
    }
    if sslmode:
        conn_kwargs["sslmode"] = sslmode

    return psycopg2.connect(**conn_kwargs)



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
