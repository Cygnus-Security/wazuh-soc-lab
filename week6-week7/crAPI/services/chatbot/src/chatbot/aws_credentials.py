"""AWS credentials helper with STS assume role support."""

import logging
import os
import threading
import time
from typing import Optional

import boto3
from botocore.config import Config as BotocoreConfig

from .config import Config

logger = logging.getLogger(__name__)

# Clear empty token env vars that botocore might pick up and use for bearer token auth.
# Empty strings cause botocore to attempt token-based auth with an invalid token.
_TOKEN_ENV_VARS_TO_CLEAR = [
    "AWS_BEARER_TOKEN",
    "AWS_BEARER_TOKEN_BEDROCK",
    "AZURE_AD_TOKEN",
]
for _var in _TOKEN_ENV_VARS_TO_CLEAR:
    if _var in os.environ and not os.environ[_var]:
        logger.info("[AWS_CREDS_INIT] Removing empty env var: %s", _var)
        del os.environ[_var]

# Cache for assumed role credentials
_credentials_cache = {
    "credentials": None,
    "expiration": 0,
    "lock": threading.Lock(),
}

# Refresh credentials 5 minutes before expiration
CREDENTIALS_REFRESH_BUFFER_SECONDS = 300


def _get_base_session():
    """Get a boto3 session with base credentials (from env vars or instance profile)."""
    region = os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION")
    has_access_key = bool(os.getenv("AWS_ACCESS_KEY_ID"))
    has_secret_key = bool(os.getenv("AWS_SECRET_ACCESS_KEY"))
    has_session_token = bool(os.getenv("AWS_SESSION_TOKEN"))
    logger.info(
        "[BASE_SESSION] Creating boto3 session - region: %s, has_access_key: %s, "
        "has_secret_key: %s, has_session_token: %s, will_use_instance_profile: %s",
        region,
        has_access_key,
        has_secret_key,
        has_session_token,
        not (has_access_key and has_secret_key),
    )
    # Use None for empty strings so boto3 falls back to instance profile/IRSA
    session = boto3.Session(
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID") or None,
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY") or None,
        aws_session_token=os.getenv("AWS_SESSION_TOKEN") or None,
        region_name=region,
    )
    # Log the credential source boto3 is using
    creds = session.get_credentials()
    if creds:
        logger.info(
            "[BASE_SESSION] Session created - credential_method: %s, access_key_prefix: %s",
            creds.method if hasattr(creds, "method") else "unknown",
            creds.access_key[:8] + "..." if creds and creds.access_key else "(none)",
        )
    else:
        logger.warning("[BASE_SESSION] Session created but NO credentials found!")
    return session


def _assume_role() -> dict:
    """Assume the configured IAM role and return temporary credentials."""
    role_arn = Config.AWS_ASSUME_ROLE_ARN
    external_id = Config.AWS_EXTERNAL_ID
    session_name = Config.AWS_ROLE_SESSION_NAME

    logger.info(
        "[ASSUME_ROLE] Starting assume role - role_arn: %s, session_name: %s, has_external_id: %s",
        role_arn,
        session_name,
        bool(external_id),
    )

    try:
        base_session = _get_base_session()
        logger.debug("Base session created successfully for assume role")
    except Exception as e:
        logger.error(
            "Failed to create base session for assume role - role_arn: %s, error: %s",
            role_arn,
            str(e),
        )
        raise

    try:
        sts_client = base_session.client("sts")
        logger.debug("STS client created successfully")
    except Exception as e:
        logger.error(
            "Failed to create STS client for assume role - role_arn: %s, error: %s",
            role_arn,
            str(e),
        )
        raise

    assume_role_kwargs = {
        "RoleArn": role_arn,
        "RoleSessionName": session_name,
        "DurationSeconds": 3600,  # 1 hour
    }

    if external_id:
        assume_role_kwargs["ExternalId"] = external_id
        logger.debug("External ID configured for assume role")

    logger.debug(
        "Calling STS assume_role with kwargs: %s",
        {k: v for k, v in assume_role_kwargs.items() if k != "ExternalId"},
    )

    try:
        logger.info("[ASSUME_ROLE] Calling sts:AssumeRole...")
        response = sts_client.assume_role(**assume_role_kwargs)
        credentials = response["Credentials"]

        logger.info(
            "[ASSUME_ROLE] SUCCESS - role_arn: %s, session_name: %s, expires_at: %s, "
            "assumed_role_id: %s, access_key_prefix: %s",
            role_arn,
            session_name,
            credentials["Expiration"],
            response.get("AssumedRoleUser", {}).get("AssumedRoleId", "unknown"),
            credentials["AccessKeyId"][:8] + "..."
            if credentials.get("AccessKeyId")
            else "(none)",
        )

        return {
            "access_key": credentials["AccessKeyId"],
            "secret_key": credentials["SecretAccessKey"],
            "token": credentials["SessionToken"],
            "expiry_time": credentials["Expiration"].timestamp(),
        }
    except Exception as e:
        logger.error(
            "[ASSUME_ROLE] FAILED - role_arn: %s, session_name: %s, error_type: %s, error: %s",
            role_arn,
            session_name,
            type(e).__name__,
            str(e),
        )
        raise


def _get_cached_credentials() -> Optional[dict]:
    """Get cached credentials if they're still valid."""
    with _credentials_cache["lock"]:
        if _credentials_cache["credentials"] is None:
            logger.debug("No cached credentials available")
            return None

        # Check if credentials are about to expire
        time_until_expiry = _credentials_cache["expiration"] - time.time()
        if time_until_expiry <= CREDENTIALS_REFRESH_BUFFER_SECONDS:
            logger.info(
                "Cached credentials expiring soon - time_until_expiry: %.0f seconds, refresh_buffer: %d seconds",
                time_until_expiry,
                CREDENTIALS_REFRESH_BUFFER_SECONDS,
            )
            return None

        logger.debug(
            "Using cached credentials - time_until_expiry: %.0f seconds",
            time_until_expiry,
        )
        return _credentials_cache["credentials"]


def _set_cached_credentials(credentials: dict) -> None:
    """Cache the credentials."""
    with _credentials_cache["lock"]:
        _credentials_cache["credentials"] = credentials
        _credentials_cache["expiration"] = credentials["expiry_time"]
        logger.debug(
            "Cached new credentials - expires_at: %s", credentials["expiry_time"]
        )


def get_aws_credentials() -> dict:
    """
    Get AWS credentials, using assume role if configured, or static credentials.

    Returns:
        dict with 'access_key', 'secret_key', 'token' (optional), and 'region'.

    Raises:
        RuntimeError: If no credentials are available.
    """
    region = os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION")
    logger.info(
        "[AWS_CREDS] get_aws_credentials called - region: %s, AWS_ASSUME_ROLE_ARN: %s, "
        "has_static_access_key: %s, has_static_secret_key: %s, has_bearer_token: %s",
        region,
        Config.AWS_ASSUME_ROLE_ARN or "(not set)",
        bool(os.getenv("AWS_ACCESS_KEY_ID")),
        bool(os.getenv("AWS_SECRET_ACCESS_KEY")),
        bool(Config.AWS_BEARER_TOKEN_BEDROCK),
    )

    # If assume role is configured, use it
    if Config.AWS_ASSUME_ROLE_ARN:
        logger.info(
            "[AWS_CREDS] Assume role path - role_arn: %s", Config.AWS_ASSUME_ROLE_ARN
        )
        # Try to use cached credentials
        cached = _get_cached_credentials()
        if cached:
            logger.info(
                "[AWS_CREDS] Using CACHED assume role credentials - access_key_prefix: %s",
                cached["access_key"][:8] + "..."
                if cached.get("access_key")
                else "(none)",
            )
            return {
                "access_key": cached["access_key"],
                "secret_key": cached["secret_key"],
                "token": cached["token"],
                "region": region,
            }

        # Assume role and cache credentials
        logger.info("[AWS_CREDS] No cached credentials, will call assume role now")
        credentials = _assume_role()
        _set_cached_credentials(credentials)
        logger.info(
            "[AWS_CREDS] Assume role succeeded - access_key_prefix: %s",
            credentials["access_key"][:8] + "..."
            if credentials.get("access_key")
            else "(none)",
        )
        return {
            "access_key": credentials["access_key"],
            "secret_key": credentials["secret_key"],
            "token": credentials["token"],
            "region": region,
        }

    # If static credentials are provided via environment variables
    access_key = os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    session_token = os.getenv("AWS_SESSION_TOKEN")

    if access_key and secret_key:
        logger.info(
            "[AWS_CREDS] Using STATIC credentials from env - access_key_prefix: %s, has_session_token: %s",
            access_key[:8] + "..." if access_key else "(none)",
            bool(session_token),
        )
        result = {
            "access_key": access_key,
            "secret_key": secret_key,
            "region": region,
        }
        if session_token:
            result["token"] = session_token
        return result

    # No credentials available - raise error
    raise RuntimeError(
        "No AWS credentials available. Set AWS_ASSUME_ROLE_ARN for assume role, "
        "or AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY for static credentials."
    )


def get_boto3_session() -> boto3.Session:
    """
    Get a boto3 session with explicit credentials.

    This handles assume role if configured, otherwise uses static credentials.
    """
    logger.debug("Creating boto3 session with explicit credentials")
    credentials = get_aws_credentials()

    return boto3.Session(
        aws_access_key_id=credentials["access_key"],
        aws_secret_access_key=credentials["secret_key"],
        aws_session_token=credentials.get("token"),
        region_name=credentials.get("region"),
    )


def get_bedrock_client():
    """
    Create a boto3 bedrock-runtime client with explicit credentials.

    This bypasses any token-based auth that botocore might pick up from env vars.
    """
    logger.info(
        "[BEDROCK_CLIENT] Creating bedrock-runtime client with explicit credentials"
    )
    credentials = get_aws_credentials()
    region = (
        credentials.get("region")
        or os.getenv("AWS_REGION")
        or os.getenv("AWS_DEFAULT_REGION")
    )

    logger.info(
        "[BEDROCK_CLIENT] Using credentials - access_key_prefix: %s, has_token: %s, region: %s",
        credentials["access_key"][:8] + "..."
        if credentials.get("access_key")
        else "(none)",
        bool(credentials.get("token")),
        region,
    )

    # Create client with explicit credentials, bypassing any default chain or token discovery
    client = boto3.client(
        "bedrock-runtime",
        aws_access_key_id=credentials["access_key"],
        aws_secret_access_key=credentials["secret_key"],
        aws_session_token=credentials.get("token"),
        region_name=region,
        # Disable any retries on auth errors to fail fast
        config=BotocoreConfig(
            signature_version="v4",  # Force SigV4, not bearer token
            retries={"max_attempts": 3},
        ),
    )
    logger.info(
        "[BEDROCK_CLIENT] Client created successfully with explicit credentials"
    )
    return client


def get_bedrock_credentials_kwargs() -> dict:
    """
    Get kwargs to pass to ChatBedrock or BedrockEmbeddings for credentials.

    Always uses explicit credentials to bypass any token-based auth.

    Returns a dict that can be unpacked into the constructor.
    """
    logger.info("[BEDROCK_KWARGS] get_bedrock_credentials_kwargs called")

    try:
        credentials = get_aws_credentials()
    except Exception as e:
        logger.error(
            "[BEDROCK_KWARGS] Failed to get credentials: %s - %s",
            type(e).__name__,
            str(e),
        )
        raise

    region = (
        credentials.get("region")
        or os.getenv("AWS_REGION")
        or os.getenv("AWS_DEFAULT_REGION")
    )

    # Pass explicit credentials to ChatBedrock/BedrockEmbeddings
    # This ensures we use SigV4 signing, not any token-based auth
    kwargs = {
        "region_name": region,
        "credentials_profile_name": None,  # Disable profile lookup
        "aws_access_key_id": credentials["access_key"],
        "aws_secret_access_key": credentials["secret_key"],
    }

    if credentials.get("token"):
        kwargs["aws_session_token"] = credentials["token"]

    logger.info(
        "[BEDROCK_KWARGS] Using explicit credentials - access_key_prefix: %s, has_token: %s, region: %s",
        credentials["access_key"][:8] + "..."
        if credentials.get("access_key")
        else "(none)",
        bool(credentials.get("token")),
        region,
    )

    return kwargs
