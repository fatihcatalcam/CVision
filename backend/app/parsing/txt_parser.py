"""
Plain text parser — reads text directly from .txt files.
Supports UTF-8 encoding with fallback to latin-1.
"""

import logging
from pathlib import Path

from app.parsing.base_parser import BaseParser

logger = logging.getLogger("cvision.parsing.txt")


class TxtParser(BaseParser):
    """Extracts text from plain text (.txt) files."""

    ENCODINGS = ["utf-8", "utf-8-sig", "latin-1"]

    def extract_text(self, file_path: Path) -> str:
        """
        Read text content from a plain text file.

        Args:
            file_path: Path to the text file.

        Returns:
            File content as a string.

        Raises:
            FileNotFoundError: If the file does not exist.
            ValueError: If the file cannot be decoded or is empty.
        """
        if not file_path.exists():
            raise FileNotFoundError(f"Text file not found: {file_path}")

        logger.info(f"Reading text file: {file_path.name}")

        text = None
        last_error = None

        for encoding in self.ENCODINGS:
            try:
                text = file_path.read_text(encoding=encoding)
                logger.debug(f"Successfully decoded with {encoding}")
                break
            except (UnicodeDecodeError, UnicodeError) as e:
                last_error = e
                logger.debug(f"Failed to decode with {encoding}: {e}")
                continue

        if text is None:
            raise ValueError(
                f"Could not decode text file '{file_path.name}'. "
                f"Tried encodings: {', '.join(self.ENCODINGS)}. "
                f"Last error: {last_error}"
            )

        logger.info(f"Read {len(text)} chars from {file_path.name}")

        return self.validate_extraction(text, file_path.name)
