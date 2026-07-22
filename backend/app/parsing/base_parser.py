"""
Abstract base parser - defines the contract all CV parsers must follow.
Concrete implementations: PdfParser, TxtParser.
"""

from abc import ABC, abstractmethod
from pathlib import Path


class EmptyTextError(ValueError):
    """No usable text could be extracted from a CV file.

    Raised when a PDF is image-based (designed in Canva/Photoshop and exported
    as a flattened image, or scanned) so it carries no text layer, or is empty.
    A ValueError subclass so existing broad handlers still catch it, but distinct
    enough that the pipeline can map it to a specific, actionable user message
    ("your CV is an image, no ATS can read it") instead of a generic failure.
    """


class BaseParser(ABC):
    """
    Abstract base class for CV file parsers.
    Each parser extracts raw text from a specific file format.
    """

    # Minimum characters of extracted text to consider it valid.
    # Below this threshold, the file is likely scanned/image-based or empty.
    MIN_TEXT_LENGTH = 50

    @abstractmethod
    def extract_text(self, file_path: Path) -> str:
        """
        Extract raw text from the given file.

        Args:
            file_path: Absolute path to the uploaded file.

        Returns:
            Extracted text as a string.

        Raises:
            ValueError: If the file cannot be parsed or has no extractable text.
            FileNotFoundError: If the file does not exist.
        """
        ...

    def validate_extraction(self, text: str, original_filename: str) -> str:
        """
        Validate extracted text meets minimum quality requirements.
        Returns cleaned text or raises ValueError.
        """
        cleaned = text.strip()

        if not cleaned:
            raise EmptyTextError(
                f"No text could be extracted from '{original_filename}'. "
                "The file may be empty or contain only images."
            )

        if len(cleaned) < self.MIN_TEXT_LENGTH:
            raise EmptyTextError(
                f"Extracted text from '{original_filename}' is too short "
                f"({len(cleaned)} chars). The file may be a scanned image "
                "or contain very little text content."
            )

        return cleaned
