"""
PDF parser — extracts text from digital PDF files using PyMuPDF (fitz).
Gracefully handles scanned/image-only PDFs with a clear error message.
"""

import logging
from pathlib import Path

import fitz  # PyMuPDF

from app.parsing.base_parser import BaseParser

logger = logging.getLogger("cvision.parsing.pdf")


class PdfParser(BaseParser):
    """Extracts text from PDF files using PyMuPDF."""

    def extract_text(self, file_path: Path) -> str:
        """
        Extract text from all pages of a PDF file.

        Args:
            file_path: Path to the PDF file.

        Returns:
            Concatenated text from all pages.

        Raises:
            FileNotFoundError: If the file does not exist.
            ValueError: If no text can be extracted (scanned PDF, etc.).
        """
        if not file_path.exists():
            raise FileNotFoundError(f"PDF file not found: {file_path}")

        logger.info(f"Extracting text from PDF: {file_path.name}")

        try:
            doc = fitz.open(str(file_path))
        except Exception as e:
            raise ValueError(
                f"Failed to open PDF file '{file_path.name}': {e}"
            )

        text_parts: list[str] = []

        try:
            for page_num, page in enumerate(doc, start=1):
                page_text = page.get_text("text")
                if page_text:
                    text_parts.append(page_text)
                    logger.debug(
                        f"Page {page_num}: extracted {len(page_text)} chars"
                    )
        finally:
            doc.close()

        full_text = "\n".join(text_parts)
        logger.info(
            f"Total extracted: {len(full_text)} chars from {len(text_parts)} pages"
        )

        return self.validate_extraction(full_text, file_path.name)
