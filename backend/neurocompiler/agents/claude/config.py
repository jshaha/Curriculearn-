"""Configuration for Claude-powered agents."""

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class ClaudeConfig:
    """Configuration for Claude API interactions."""

    api_key: Optional[str] = None
    model: str = "claude-sonnet-4-6"
    temperature: float = 0.3
    max_tokens: int = 4096
    fallback_enabled: bool = True
    max_retries: int = 3
    retry_base_delay: float = 1.0  # seconds

    @classmethod
    def from_env(cls) -> "ClaudeConfig":
        """Load configuration from environment variables."""
        return cls(
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
            temperature=float(os.getenv("CLAUDE_TEMPERATURE", "0.3")),
            max_tokens=int(os.getenv("CLAUDE_MAX_TOKENS", "4096")),
            fallback_enabled=os.getenv("CLAUDE_FALLBACK_ENABLED", "true").lower() == "true",
            max_retries=int(os.getenv("CLAUDE_MAX_RETRIES", "3")),
            retry_base_delay=float(os.getenv("CLAUDE_RETRY_BASE_DELAY", "1.0")),
        )

    @property
    def is_available(self) -> bool:
        """Check if Claude API is available (API key is set)."""
        return self.api_key is not None and len(self.api_key) > 0


# Global config instance
_config: Optional[ClaudeConfig] = None


def get_config() -> ClaudeConfig:
    """Get or create the global configuration instance."""
    global _config
    if _config is None:
        _config = ClaudeConfig.from_env()
    return _config
