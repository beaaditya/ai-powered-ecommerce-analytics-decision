import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.main import app as backend_app


class VercelPathAdapter:
    """
    Restores the original request path after Vercel rewrites
    /api/* requests to /api/index.py.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            path = scope.get("path", "")

            # Vercel rewrite may replace the original request path
            # with the Python function filename.
            if path in (
                "/api/index.py",
                "/api/index",
                "/api/index.py/",
                "/api/",
                "/api",
            ):
                headers = dict(scope.get("headers", []))

                matched_path = (
                    headers.get(b"x-matched-path")
                    or headers.get(b"x-vercel-matched-path")
                    or headers.get(b"x-forwarded-uri")
                )

                if matched_path:
                    real_path = matched_path.decode("utf-8").split("?")[0]

                    scope["path"] = real_path

                    if "raw_path" in scope:
                        scope["raw_path"] = real_path.encode("utf-8")

            # Handle deployments where Vercel strips /api.
            elif not path.startswith("/api"):
                if path in ("/docs", "/openapi.json"):
                    api_path = "/api" + path

                    scope["path"] = api_path

                    if "raw_path" in scope:
                        scope["raw_path"] = api_path.encode("utf-8")

                elif path not in ("/", "/redoc"):
                    api_path = "/api" + path

                    scope["path"] = api_path

                    if "raw_path" in scope:
                        scope["raw_path"] = api_path.encode("utf-8")

        await self.app(scope, receive, send)


app = VercelPathAdapter(backend_app)
