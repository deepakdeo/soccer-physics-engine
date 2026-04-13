"""Minimal MLflow-style model registry interface."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class RegisteredModelInfo:
    """Metadata for one registered model entry."""

    name: str
    version: int
    model_type: str
    metadata: dict[str, Any] = field(default_factory=dict)


class MLflowModelRegistryInterface:
    """In-memory registry facade shaped like a lightweight MLflow adapter."""

    def __init__(self, registry_uri: str = "file:./mlruns") -> None:
        """Initialize the registry facade with a tracking URI placeholder."""
        self.registry_uri = registry_uri
        self._entries: dict[str, RegisteredModelInfo] = {}

    def register_model(
        self,
        name: str,
        model_type: str,
        metadata: dict[str, Any] | None = None,
    ) -> RegisteredModelInfo:
        """Register a model and return its registry metadata."""
        previous_version = self._entries[name].version if name in self._entries else 0
        info = RegisteredModelInfo(
            name=name,
            version=previous_version + 1,
            model_type=model_type,
            metadata=metadata or {},
        )
        self._entries[name] = info
        return info

    def get_model_info(self, name: str) -> RegisteredModelInfo:
        """Return metadata for a registered model."""
        if name not in self._entries:
            raise KeyError(f"Model '{name}' is not registered.")
        return self._entries[name]
