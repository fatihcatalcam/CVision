"""
Abstract base analyzer — defines the contract all analysis components follow.
Each analyzer receives extracted CV text and produces a partial result dict.
Implements the Strategy pattern for pluggable analysis strategies.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AnalysisContext:
    """
    Shared context passed through the analysis pipeline.
    Analyzers read from and write to this context.
    """
    # Input
    extracted_text: str = ""
    text_lower: str = ""  # Pre-computed lowercase version

    # Section detection results
    detected_sections: dict[str, bool] = field(default_factory=dict)

    # Skill extraction results
    extracted_skills: list[dict[str, Any]] = field(default_factory=list)

    # ATS check results
    ats_issues: list[str] = field(default_factory=list)
    ats_passes: list[str] = field(default_factory=list)

    # Keyword scoring
    keyword_matches: dict[str, list[str]] = field(default_factory=dict)

    # Experience evaluation
    total_years_experience: float = 0.0
    experience_entries: list[str] = field(default_factory=list)

    # Scores (0.0 to 100.0)
    completeness_score: float = 0.0
    ats_score: float = 0.0
    keyword_score: float = 0.0
    experience_score: float = 0.0
    overall_score: float = 0.0

    # Strengths and weaknesses
    strengths: list[str] = field(default_factory=list)
    weaknesses: list[str] = field(default_factory=list)

    # Suggestions
    suggestions: list[dict[str, str]] = field(default_factory=list)

    # Summary
    summary: str = ""

    def __post_init__(self):
        if self.extracted_text and not self.text_lower:
            self.text_lower = self.extracted_text.lower()


class BaseAnalyzer(ABC):
    """
    Abstract base class for all CV analyzers.
    Each analyzer processes one aspect of the CV and updates the shared context.
    """

    @abstractmethod
    def analyze(self, context: AnalysisContext) -> None:
        """
        Analyze the CV text and update the context with results.

        Args:
            context: The shared analysis context to read from and write to.
        """
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name of this analyzer."""
        ...
