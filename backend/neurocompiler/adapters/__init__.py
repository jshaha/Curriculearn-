"""Simulator adapters. Production brain models implement SimulatorProtocol."""

from .mock_simulator import MockSimulator
from .simulator import SimulatorProtocol

__all__ = ["MockSimulator", "SimulatorProtocol"]
