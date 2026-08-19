import os
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
root_env_path = Path(__file__).resolve().parent.parent / ".env"
if root_env_path.exists():
    load_dotenv(dotenv_path=root_env_path)
else:
    load_dotenv()

# --------------------------------------------------
# DATABASE
# --------------------------------------------------

conn = psycopg2.connect(
    host=os.getenv("DB_HOST", "localhost"),
    port=os.getenv("DB_PORT", "5432"),
    database=os.getenv("DB_NAME", "dunnhumby_retail"),
    user=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASSWORD", "")
)

conn.autocommit = True
cur = conn.cursor()

# --------------------------------------------------
# CSV LOCATION
# --------------------------------------------------

env_data_dir = os.getenv("CSV_DATA_DIR")
if env_data_dir and Path(env_data_dir).exists():
    DATA_DIR = Path(env_data_dir)
else:
    DATA_DIR = Path(__file__).resolve().parent.parent / "dunnhumby_The-Complete-Journey CSV"

# --------------------------------------------------
# IMPORT FUNCTION
# --------------------------------------------------

def import_csv(filename, table):
    filepath = DATA_DIR / filename

    print(f"Importing {filename}...")

    with open(filepath, "r", encoding="utf-8-sig") as f:
        cur.copy_expert(
            f"""
            COPY {table}
            FROM STDIN
            WITH (
                FORMAT CSV,
                HEADER TRUE,
                NULL ''
            )
            """,
            f
        )

    print(f"Finished: {filename}")

# --------------------------------------------------
# IMPORT ORDER
# --------------------------------------------------

files = [
    ("product.csv", "raw.product"),
    ("campaign_desc.csv", "raw.campaign_desc"),
    ("campaign_table.csv", "raw.campaign_table"),
    ("coupon.csv", "raw.coupon"),
    ("coupon_redempt.csv", "raw.coupon_redempt"),
    ("hh_demographic.csv", "raw.hh_demographic"),

    # Large tables last
    ("transaction_data.csv", "raw.transaction_data"),
    ("causal_data.csv", "raw.causal_data"),
]

for filename, table in files:
    import_csv(filename, table)

cur.close()
conn.close()

print("\nALL FILES IMPORTED SUCCESSFULLY.")