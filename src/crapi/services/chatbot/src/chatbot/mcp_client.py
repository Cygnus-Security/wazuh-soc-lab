from langchain_mcp_adapters.client import MultiServerMCPClient


def get_mcp_client(user_jwt: str | None) -> MultiServerMCPClient:
    headers = {}
    if user_jwt:
        headers["Authorization"] = f"Bearer {user_jwt}"

    return MultiServerMCPClient(
        {
            "crapi": {
                "transport": "streamable_http",
                "url": "http://localhost:5500/mcp/",
                "headers": headers,
            }
        }
    )
