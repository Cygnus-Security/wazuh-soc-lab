import logging

import chromadb
from langchain_aws import BedrockEmbeddings
from langchain_chroma import Chroma as ChromaClient
from langchain_cohere import CohereEmbeddings
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_core.tools import tool
from langchain_google_vertexai import VertexAIEmbeddings
from langchain_mistralai import MistralAIEmbeddings
from langchain_openai import AzureOpenAIEmbeddings, OpenAIEmbeddings

from .aws_credentials import get_bedrock_credentials_kwargs
from .config import Config

logger = logging.getLogger(__name__)


class ZeroEmbeddings(Embeddings):
    def __init__(self, size: int) -> None:
        self.size = size

    def embed_documents(self, texts):
        return [[0.0] * self.size for _ in texts]

    def embed_query(self, text):
        return [0.0] * self.size


def get_chroma_client():
    chroma_client = chromadb.HttpClient(
        host=Config.CHROMA_HOST,
        port=Config.CHROMA_PORT,
        ssl=False,
        headers=None,
    )
    return chroma_client


def _resolve_embeddings_provider(provider: str) -> str:
    if provider in {"openai", "azure_openai", "bedrock", "vertex", "mistral", "cohere"}:
        return provider
    return "none"


def _zero_embeddings() -> ZeroEmbeddings:
    return ZeroEmbeddings(Config.EMBEDDINGS_DIMENSIONS)


def _default_embeddings_model(provider: str, llm_model: str | None) -> str:
    if provider == "openai":
        return "text-embedding-3-large"
    if provider == "bedrock":
        return "amazon.titan-embed-text-v2:0"
    if provider == "vertex":
        return "text-embedding-004"
    if provider == "cohere":
        return "embed-english-v3.0"
    if provider == "mistral":
        return "mistral-embed"
    if provider == "azure_openai":
        return llm_model or ""
    return llm_model or ""


def get_embedding_function(api_key, provider: str, llm_model: str | None):
    embeddings_provider = _resolve_embeddings_provider(provider)
    logger.info(
        "=== EMBEDDINGS CONFIG DERIVATION === provider: %s, resolved_embeddings_provider: %s, llm_model: %s",
        provider,
        embeddings_provider,
        llm_model or "(not specified)",
    )
    if embeddings_provider == "openai":
        if not api_key:
            logger.warning(
                "OpenAI embeddings requested without API key, using zero embeddings"
            )
            return _zero_embeddings()
        model = Config.EMBEDDINGS_MODEL or _default_embeddings_model(
            embeddings_provider, llm_model
        )
        kwargs = {
            "openai_api_key": api_key,
            "model": model,
        }
        if Config.OPENAI_BASE_URL:
            kwargs["base_url"] = Config.OPENAI_BASE_URL
        logger.info(
            "OpenAI Embeddings Config - model: %s, base_url: %s, model_source: %s",
            model,
            Config.OPENAI_BASE_URL or "(default)",
            "env" if Config.EMBEDDINGS_MODEL else "default",
        )
        return OpenAIEmbeddings(**kwargs)
    if embeddings_provider == "azure_openai":
        if (
            not Config.AZURE_OPENAI_API_KEY and not Config.AZURE_AD_TOKEN
        ) or not Config.AZURE_OPENAI_ENDPOINT:
            logger.warning(
                "Azure OpenAI embeddings misconfigured - missing API key/token or endpoint, using zero embeddings"
            )
            return _zero_embeddings()
        default_deployment = _default_embeddings_model(embeddings_provider, llm_model)
        deployment = (
            Config.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT
            or Config.EMBEDDINGS_MODEL
            or Config.AZURE_OPENAI_CHAT_DEPLOYMENT
            or default_deployment
        )
        kwargs = {
            "azure_endpoint": Config.AZURE_OPENAI_ENDPOINT,
            "api_version": Config.AZURE_OPENAI_API_VERSION,
            "azure_deployment": deployment,
        }
        if Config.AZURE_AD_TOKEN:
            kwargs["azure_ad_token"] = Config.AZURE_AD_TOKEN
            auth_method = "azure_ad_token"
        else:
            kwargs["api_key"] = Config.AZURE_OPENAI_API_KEY
            auth_method = "api_key"
        logger.info(
            "Azure OpenAI Embeddings Config - deployment: %s, endpoint: %s, api_version: %s, auth_method: %s",
            deployment,
            Config.AZURE_OPENAI_ENDPOINT,
            Config.AZURE_OPENAI_API_VERSION,
            auth_method,
        )
        return AzureOpenAIEmbeddings(**kwargs)
    if embeddings_provider == "bedrock":
        model_id = Config.EMBEDDINGS_MODEL or _default_embeddings_model(
            embeddings_provider, llm_model
        )
        if not model_id:
            logger.warning(
                "Bedrock embedding model not configured, using zero embeddings"
            )
            return _zero_embeddings()
        logger.info(
            "Bedrock Embeddings Config - model_id: %s, model_source: %s",
            model_id,
            "env" if Config.EMBEDDINGS_MODEL else "default",
        )
        bedrock_kwargs = get_bedrock_credentials_kwargs()
        logger.info(
            "Bedrock Embeddings Credentials - region: %s, has_explicit_credentials: %s",
            bedrock_kwargs.get("region_name", "(not set)"),
            bool(bedrock_kwargs.get("aws_access_key_id")),
        )
        return BedrockEmbeddings(model_id=model_id, **bedrock_kwargs)
    if embeddings_provider == "vertex":
        vertex_model = Config.EMBEDDINGS_MODEL or _default_embeddings_model(
            embeddings_provider, llm_model
        )
        logger.info(
            "Vertex AI Embeddings Config - model: %s, project: %s, location: %s, model_source: %s",
            vertex_model,
            Config.VERTEX_PROJECT or "(not set)",
            Config.VERTEX_LOCATION or "(not set)",
            "env" if Config.EMBEDDINGS_MODEL else "default",
        )
        return VertexAIEmbeddings(
            model_name=vertex_model,
            project=Config.VERTEX_PROJECT or None,
            location=Config.VERTEX_LOCATION or None,
        )
    if embeddings_provider == "cohere":
        if not Config.COHERE_API_KEY:
            logger.warning(
                "Cohere embeddings requested without API key, using zero embeddings"
            )
            return _zero_embeddings()
        model = Config.EMBEDDINGS_MODEL or _default_embeddings_model(
            embeddings_provider, llm_model
        )
        logger.info(
            "Cohere Embeddings Config - model: %s, model_source: %s",
            model,
            "env" if Config.EMBEDDINGS_MODEL else "default",
        )
        return CohereEmbeddings(
            cohere_api_key=Config.COHERE_API_KEY,
            model=model,
        )
    if embeddings_provider == "mistral":
        if not Config.MISTRAL_API_KEY:
            logger.warning(
                "Mistral embeddings requested without API key, using zero embeddings"
            )
            return _zero_embeddings()
        model = Config.EMBEDDINGS_MODEL or _default_embeddings_model(
            embeddings_provider, llm_model
        )
        logger.info(
            "Mistral Embeddings Config - model: %s, model_source: %s",
            model,
            "env" if Config.EMBEDDINGS_MODEL else "default",
        )
        return MistralAIEmbeddings(
            mistral_api_key=Config.MISTRAL_API_KEY,
            model=model,
        )
    logger.warning(
        "Embeddings disabled for provider %s, using zero embeddings", provider
    )
    return _zero_embeddings()


def get_chroma_vectorstore(api_key, provider: str, llm_model: str | None):
    chroma_client = get_chroma_client()
    vectorstore = ChromaClient(
        client=chroma_client,
        collection_name="chats",
        embedding_function=get_embedding_function(api_key, provider, llm_model),
        create_collection_if_not_exists=True,
    )
    return vectorstore


def add_to_chroma_collection(
    api_key,
    session_id,
    new_messages: list[dict[str, str]],
    provider: str,
    llm_model: str | None,
) -> list:
    logger.debug(
        "Adding to Chroma collection - session_id: %s, message_count: %d, provider: %s, model: %s",
        session_id,
        len(new_messages),
        provider,
        llm_model or "(not specified)",
    )
    vectorstore = get_chroma_vectorstore(api_key, provider, llm_model)
    documents = []
    for message in new_messages:
        for role, content in message.items():
            documents.append(
                Document(
                    page_content=content,
                    metadata={"session_id": session_id, "role": role},
                )
            )
    logger.debug("Adding %d documents to Chroma vectorstore", len(documents))
    res: list = vectorstore.add_documents(documents=documents)
    logger.debug("Successfully added documents to Chroma - document_ids: %d", len(res))
    return res


def get_retriever_tool(api_key, provider: str, llm_model: str | None):
    vectorstore = get_chroma_vectorstore(api_key, provider, llm_model)
    retriever = vectorstore.as_retriever()

    @tool
    def chat_rag(query: str) -> str:
        """Use this to answer questions based on user chat history (summarized and semantically indexed).
        Use this when the user asks about prior chats, what they asked earlier, or wants a summary of past conversations.

        Use this tool when the user refers to anything mentioned before, asks for a summary of previous messages or sessions,
        or references phrases like 'what I said earlier', 'things we discussed', 'my earlier question', 'until now', 'till date', 'all my conversations' or 'previously mentioned'.
        The chat history is semantically indexed and summarized using vector search.

        Args:
            query: The search query to find relevant chat history.
        """
        docs = retriever.invoke(query)
        return "\n\n".join(doc.page_content for doc in docs)

    return chat_rag
