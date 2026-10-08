import base64
import logging

import httpx
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


class MCPAuthMiddleware:
    """
    ASGI middleware for MCP server authentication.

    Supports:
    - JWT: Authorization: Bearer <token>
    - Basic Auth: Authorization: Basic <base64(email:password)>

    Validates credentials against the identity service.
    """

    def __init__(self, app, identity_service_url: str):
        self.app = app
        self.identity_service_url = identity_service_url
        logger.info(f"MCP Auth Middleware initialized (identity_service={identity_service_url})")

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope)

        # Skip auth for health check endpoints
        if request.url.path in ["/health", "/healthz", "/ready"]:
            await self.app(scope, receive, send)
            return

        # Get Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            await self.app(scope, receive, send)
            return

        try:
            auth_type, credentials = self._parse_auth_header(auth_header)

            if auth_type == "bearer":
                await self._validate_jwt(credentials)
            elif auth_type == "basic":
                await self._validate_basic_auth(credentials)
            else:
                raise AuthenticationError(f"Unsupported authentication type: {auth_type}")

            # Authentication successful, proceed with request
            await self.app(scope, receive, send)

        except AuthenticationError as e:
            logger.warning(f"Authentication failed: {e.message}")
            response = JSONResponse({"error": e.message}, status_code=e.status_code)
            await response(scope, receive, send)

    def _parse_auth_header(self, auth_header: str) -> tuple[str, str]:
        """Parse Authorization header into type and credentials."""
        parts = auth_header.split(" ", 1)
        if len(parts) != 2:
            raise AuthenticationError("Invalid Authorization header format")
        return parts[0].lower(), parts[1]

    async def _validate_jwt(self, token: str) -> None:
        """Validate JWT token against identity service."""
        verify_url = f"{self.identity_service_url}/identity/api/auth/verify"

        async with httpx.AsyncClient(verify=False) as client:
            try:
                response = await client.post(
                    verify_url,
                    json={"token": token},
                    headers={"Content-Type": "application/json"},
                    timeout=10.0,
                )

                if response.status_code == 200:
                    logger.debug("JWT validation successful")
                    return
                else:
                    logger.warning(f"JWT validation failed: {response.status_code}")
                    raise AuthenticationError("Invalid token")

            except httpx.RequestError as e:
                logger.error(f"Identity service request failed: {e}")
                raise AuthenticationError("Authentication service unavailable", 503)

    async def _validate_basic_auth(self, credentials: str) -> None:
        """Validate Basic Auth credentials against identity service."""
        # Decode credentials
        try:
            decoded = base64.b64decode(credentials).decode("utf-8")
            if ":" not in decoded:
                raise AuthenticationError("Invalid Basic Auth format")
            email, password = decoded.split(":", 1)
        except Exception:
            raise AuthenticationError("Invalid Basic Auth credentials")

        login_url = f"{self.identity_service_url}/identity/api/auth/login"

        async with httpx.AsyncClient(verify=False) as client:
            try:
                response = await client.post(
                    login_url,
                    json={"email": email, "password": password},
                    headers={"Content-Type": "application/json"},
                    timeout=10.0,
                )

                if response.status_code == 200:
                    logger.debug(f"Basic auth successful for user: {email}")
                    return
                else:
                    logger.warning(f"Basic auth failed for {email}: {response.status_code}")
                    raise AuthenticationError("Invalid credentials")

            except httpx.RequestError as e:
                logger.error(f"Identity service request failed: {e}")
                raise AuthenticationError("Authentication service unavailable", 503)


class AuthenticationError(Exception):
    """Raised when authentication fails."""

    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code
        super().__init__(message)
