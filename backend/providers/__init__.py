from .base import IngredientResult, BaseProvider
from .openai_provider import OpenAIProvider
from .gemini_provider import GeminiProvider

__all__ = [
    "IngredientResult",
    "BaseProvider",
    "OpenAIProvider",
    "GeminiProvider",
    "get_provider",
]


def get_provider(name: str, **kwargs) -> BaseProvider:
    if name == "openai":
        return OpenAIProvider(**kwargs)
    if name == "gemini":
        return GeminiProvider(**kwargs)
    if name == "local":
        from .local_provider import LocalProvider
        return LocalProvider(**kwargs)
    raise ValueError(f"Unknown provider: {name}. Use openai, gemini, or local.")
