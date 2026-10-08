import logging
import uuid

from quart import after_this_request, request

from .config import Config
from .extensions import db

logger = logging.getLogger(__name__)

SESSION_COOKIE_NAME = "chat_session_id"


async def get_or_create_session_id():
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_id:
        session_id = str(uuid.uuid4())

        @after_this_request
        def after_index(response):
            response.set_cookie(
                SESSION_COOKIE_NAME, session_id, httponly=True, secure=True
            )
            return response

    return session_id


def _get_api_key_field(provider: str) -> str | None:
    if provider == "openai":
        return "openai_api_key"
    if provider == "anthropic":
        return "anthropic_api_key"
    return None


async def store_api_key(session_id, api_key, provider: str):
    key_field = _get_api_key_field(provider)
    if not key_field:
        return
    await db.sessions.update_one(
        {"session_id": session_id}, {"$set": {key_field: api_key}}, upsert=True
    )


async def get_api_key(session_id):
    provider = Config.LLM_PROVIDER
    key_field = _get_api_key_field(provider)
    if provider == "openai" and Config.OPENAI_API_KEY:
        logger.debug(
            "API key source - session_id: %s, provider: %s, source: environment",
            session_id,
            provider,
        )
        return Config.OPENAI_API_KEY
    if provider == "anthropic" and Config.ANTHROPIC_API_KEY:
        logger.debug(
            "API key source - session_id: %s, provider: %s, source: environment",
            session_id,
            provider,
        )
        return Config.ANTHROPIC_API_KEY
    if not key_field:
        logger.debug(
            "API key not required for provider - session_id: %s, provider: %s",
            session_id,
            provider,
        )
        return None
    doc = await db.sessions.find_one({"session_id": session_id})
    if not doc:
        logger.debug(
            "No session document found - session_id: %s, provider: %s",
            session_id,
            provider,
        )
        return None
    if key_field not in doc:
        logger.debug(
            "API key not found in session - session_id: %s, provider: %s",
            session_id,
            provider,
        )
        return None
    logger.debug(
        "API key source - session_id: %s, provider: %s, source: session_stored",
        session_id,
        provider,
    )
    return doc[key_field]


async def delete_api_key(session_id):
    updates = {}
    for key_field in ("openai_api_key", "anthropic_api_key"):
        updates[key_field] = ""
    await db.sessions.update_one({"session_id": session_id}, {"$unset": updates})


async def store_model_name(session_id, model_name):
    logger.info(
        "Storing model name - session_id: %s, model_name: %s",
        session_id,
        model_name or "(empty)",
    )
    await db.sessions.update_one(
        {"session_id": session_id}, {"$set": {"model_name": model_name}}, upsert=True
    )
    logger.debug("Model name stored successfully - session_id: %s", session_id)


async def get_model_name(session_id):
    doc = await db.sessions.find_one({"session_id": session_id})
    if not doc:
        logger.info(
            "Model name derivation - session_id: %s, source: env_default, model: %s (no session doc found)",
            session_id,
            Config.LLM_MODEL_NAME or "(not set)",
        )
        return Config.LLM_MODEL_NAME
    if "model_name" not in doc:
        logger.info(
            "Model name derivation - session_id: %s, source: env_default, model: %s (no model in session)",
            session_id,
            Config.LLM_MODEL_NAME or "(not set)",
        )
        return Config.LLM_MODEL_NAME
    logger.info(
        "Model name derivation - session_id: %s, source: session_stored, model: %s",
        session_id,
        doc["model_name"] or "(empty)",
    )
    return doc["model_name"]


async def get_user_jwt() -> str | None:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth.replace("Bearer ", "")
    return None
