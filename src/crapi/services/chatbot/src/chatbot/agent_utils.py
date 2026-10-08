import json

from langchain.agents import AgentState
from langchain.agents.middleware.types import before_model
from langchain_core.messages import ToolMessage
from langgraph.runtime import Runtime

from .config import Config

INDIVIDUAL_MIN_LENGTH = 100


def collect_long_strings(obj):
    field_info = []

    def _collect(obj):
        if isinstance(obj, dict):
            for key, value in obj.items():
                if isinstance(value, str) and len(value) > INDIVIDUAL_MIN_LENGTH:
                    field_info.append(
                        {
                            "length": len(value),
                            "dict": obj,
                            "key": key,
                        }
                    )
                elif isinstance(value, (dict, list)):
                    _collect(value)
        elif isinstance(obj, list):
            for item in obj:
                if isinstance(item, (dict, list)):
                    _collect(item)

    _collect(obj)
    return field_info


def truncate_by_length(content, max_length):
    """
    Truncate JSON content by recursively truncating the longest fields until content is under limit.
    Preserves structure and smaller fields with minimum loss of information.
    """
    try:
        data = json.loads(content)
        field_info = sorted(collect_long_strings(data), key=lambda x: x["length"])

        cur_length = len(json.dumps(data))
        while field_info and cur_length - max_length > 0:
            longest = field_info.pop()
            excess = cur_length - max_length
            new_length = max(INDIVIDUAL_MIN_LENGTH, longest["length"] - excess)
            cur_length -= longest["length"] - new_length
            longest["dict"][longest["key"]] = (
                longest["dict"][longest["key"]][:new_length]
                + f"... [TRUNCATED: {longest['length'] - new_length} chars removed]"
            )

        if cur_length <= max_length:
            return json.dumps(data)
    except (json.JSONDecodeError, Exception):
        pass

    return content[:max_length] + "\n... [TRUNCATED]"


@before_model(state_schema=AgentState)
def truncate_tool_messages(state: AgentState, runtime: Runtime) -> AgentState:
    """
    Modify large tool messages to prevent exceeding model's token limits.
    Truncate to a length such that it keeps messages within your token limit.
    """
    messages = state.get("messages", [])
    modified_messages = []

    for i, msg in enumerate(messages):
        if (
            isinstance(msg, ToolMessage)
            and len(msg.content) > Config.MAX_CONTENT_LENGTH
        ):
            truncated_msg = msg.model_copy(
                update={
                    "content": truncate_by_length(
                        msg.content, Config.MAX_CONTENT_LENGTH
                    )
                }
            )
            modified_messages.append(truncated_msg)
        else:
            modified_messages.append(msg)
    return {"messages": modified_messages}
