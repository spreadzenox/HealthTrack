"""Exceptions métier pour les providers."""


class NotFoodError(Exception):
    """L'image ne représente pas un plat / quelque chose de comestible."""

    def __init__(self, reason: str = "Cette image ne semble pas représenter un plat ou des aliments."):
        self.reason = reason
        super().__init__(reason)
