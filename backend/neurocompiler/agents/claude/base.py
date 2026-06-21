"""Base class for Claude-powered agents with retry logic and error handling."""

import json
import time
from abc import ABC, abstractmethod
from typing import Any, Callable, Dict, List, Optional, TypeVar

from anthropic import Anthropic, APIError, RateLimitError

from .config import ClaudeConfig, get_config

T = TypeVar("T")


class ClaudeAgentBase(ABC):
    """Base class for Claude-powered tool-using agents.

    Provides:
    - API client management
    - Retry logic with exponential backoff
    - Error handling with fallback support
    - Tool execution framework
    """

    def __init__(self, config: Optional[ClaudeConfig] = None):
        self.config = config or get_config()
        self._client: Optional[Anthropic] = None

    @property
    def client(self) -> Anthropic:
        """Lazy-initialize the Anthropic client."""
        if self._client is None:
            if not self.config.is_available:
                raise RuntimeError("ANTHROPIC_API_KEY not set")
            self._client = Anthropic(api_key=self.config.api_key)
        return self._client

    @property
    def is_available(self) -> bool:
        """Check if Claude API is available."""
        return self.config.is_available

    @abstractmethod
    def get_tools(self) -> List[Dict[str, Any]]:
        """Return the list of tool definitions for this agent."""
        pass

    @abstractmethod
    def get_system_prompt(self) -> str:
        """Return the system prompt for this agent."""
        pass

    @abstractmethod
    def handle_tool_call(
        self, tool_name: str, tool_input: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle a tool call and return the result.

        Args:
            tool_name: Name of the tool to execute
            tool_input: Input parameters for the tool
            context: Shared context (e.g., lesson data, collected diagnoses)

        Returns:
            Tool result as a dictionary
        """
        pass

    def run_agentic_loop(
        self,
        user_message: str,
        context: Dict[str, Any],
        max_turns: int = 10,
    ) -> Dict[str, Any]:
        """Run the agentic loop until completion or max turns.

        Args:
            user_message: Initial user message
            context: Shared context passed to tool handlers
            max_turns: Maximum number of API calls

        Returns:
            Final context with collected results
        """
        messages = [{"role": "user", "content": user_message}]
        tools = self.get_tools()
        system_prompt = self.get_system_prompt()

        for turn in range(max_turns):
            response = self._call_with_retry(messages, tools, system_prompt)

            # Check for stop reason
            if response.stop_reason == "end_turn":
                # Agent finished without tool calls
                break

            if response.stop_reason == "tool_use":
                # Process tool calls
                assistant_content = response.content
                messages.append({"role": "assistant", "content": assistant_content})

                tool_results = []
                for block in assistant_content:
                    if block.type == "tool_use":
                        result = self._execute_tool(
                            block.name, block.input, context
                        )
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(result),
                        })

                        # Check if this is a terminal tool
                        if result.get("_terminal", False):
                            return context

                messages.append({"role": "user", "content": tool_results})
            else:
                # Unexpected stop reason
                break

        return context

    def _call_with_retry(
        self,
        messages: List[Dict],
        tools: List[Dict],
        system_prompt: str,
    ) -> Any:
        """Call the Claude API with retry logic."""
        last_error = None

        for attempt in range(self.config.max_retries):
            try:
                return self.client.messages.create(
                    model=self.config.model,
                    max_tokens=self.config.max_tokens,
                    temperature=self.config.temperature,
                    system=system_prompt,
                    tools=tools,
                    messages=messages,
                )
            except RateLimitError as e:
                last_error = e
                delay = self.config.retry_base_delay * (2 ** attempt)
                print(f"Rate limited, retrying in {delay}s...")
                time.sleep(delay)
            except APIError as e:
                last_error = e
                if e.status_code and e.status_code >= 500:
                    # Server error, retry
                    delay = self.config.retry_base_delay * (2 ** attempt)
                    print(f"API error {e.status_code}, retrying in {delay}s...")
                    time.sleep(delay)
                else:
                    # Client error, don't retry
                    raise

        raise last_error or RuntimeError("Max retries exceeded")

    def _execute_tool(
        self, tool_name: str, tool_input: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a tool and handle errors."""
        try:
            return self.handle_tool_call(tool_name, tool_input, context)
        except Exception as e:
            return {
                "error": str(e),
                "error_type": type(e).__name__,
            }
