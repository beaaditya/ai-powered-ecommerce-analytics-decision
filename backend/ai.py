import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai

# Load environment variables from the root .env file
root_env_path = Path(__file__).resolve().parent.parent / ".env"
if root_env_path.exists():
    load_dotenv(dotenv_path=root_env_path)
else:
    load_dotenv()

# Gemini Model Configuration
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
FALLBACK_GEMINI_MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest"]


def is_gemini_configured() -> bool:
    """
    Check if GEMINI_API_KEY is configured in the environment variables.
    Does NOT make any API calls.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    return bool(api_key and api_key.strip())


def get_gemini_client() -> genai.Client:
    """
    Create and return a Google GenAI Client instance.
    Raises ValueError if GEMINI_API_KEY is not configured.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not api_key.strip():
        raise ValueError("GEMINI_API_KEY is not set. Please configure it in the .env file.")
    return genai.Client(api_key=api_key.strip())


def generate_text(prompt: str, model: str = DEFAULT_GEMINI_MODEL) -> str:
    """
    Generate text using the Gemini model given a text prompt.
    Returns the string text response with fallback handling.
    """
    if not prompt or not isinstance(prompt, str):
        raise ValueError("A non-empty string prompt must be provided.")

    client = get_gemini_client()
    candidate_models = [model] + [m for m in FALLBACK_GEMINI_MODELS if m != model]
    last_err = None

    for cand_model in candidate_models:
        try:
            response = client.models.generate_content(
                model=cand_model,
                contents=prompt,
            )
            return response.text if response.text else ""
        except Exception as e:
            last_err = e
            continue

    # Avoid exposing API key in any error messages
    raise RuntimeError(f"Gemini API error during content generation: {last_err}") from None
