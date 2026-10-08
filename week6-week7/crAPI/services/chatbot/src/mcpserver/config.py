import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    TLS_ENABLED = os.getenv("TLS_ENABLED", "false").lower() in ("true", "1", "yes")
    WEB_SERVICE = os.getenv("WEB_SERVICE", "crapi-web")
    IDENTITY_SERVICE = os.getenv("IDENTITY_SERVICE", "crapi-identity:8080")
    CHROMA_PERSIST_DIRECTORY = os.getenv("CHROMA_PERSIST_DIRECTORY", "/app/vectorstore")
    OPENAPI_SPEC = os.getenv("OPENAPI_SPEC", "/app/resources/crapi-openapi-spec.json")
    API_USER = os.getenv("API_USER", "admin@example.com")
    API_PASSWORD = os.getenv("API_PASSWORD", "Admin!123")
