"""Shared pytest fixtures."""

from __future__ import annotations

import numpy as np
import pytest


@pytest.fixture
def linear_xy_positions() -> tuple[np.ndarray, np.ndarray]:
    """Create a simple linear trajectory in two dimensions."""
    x = np.array([0.0, 1.0, 2.0, 3.0, 4.0])
    y = np.array([0.0, 0.5, 1.0, 1.5, 2.0])
    return x, y
