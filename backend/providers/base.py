from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List


@dataclass
class IngredientResult:
    ingredient: str
    quantity: str


class BaseProvider(ABC):
    """Base class for image → ingredients+quantities providers."""

    @abstractmethod
    def predict(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> List[IngredientResult]:
        """Return list of (ingredient, quantity) from image bytes."""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass
