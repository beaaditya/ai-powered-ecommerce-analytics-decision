import os
import sys
from pathlib import Path

# Ensure root directory is included in Python path for Vercel Serverless environment
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

try:
    from backend.main import app
except ImportError:
    from main import app  # Fallback
