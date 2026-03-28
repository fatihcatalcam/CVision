"""
Parser factory — returns the correct parser based on file extension.
Implements the Factory pattern (Open/Closed principle).
"""

from app.parsing.base_parser import BaseParser
from app.parsing.pdf_parser import PdfParser
from app.parsing.txt_parser import TxtParser

# Supported file extensions mapped to their parser classes
_PARSERS: dict[str, type[BaseParser]] = {
    "pdf": PdfParser,
    "txt": TxtParser,
}

# Allowed file extensions for upload validation
ALLOWED_EXTENSIONS: set[str] = set(_PARSERS.keys())

# MIME types accepted during file upload
ALLOWED_MIME_TYPES: dict[str, str] = {
    "application/pdf": "pdf",
    "text/plain": "txt",
}


def get_parser(file_extension: str) -> BaseParser:
    """
    Return the appropriate parser for the given file extension.

    Args:
        file_extension: Lowercase file extension without dot (e.g., "pdf", "txt").

    Returns:
        An instance of the matching parser.

    Raises:
        ValueError: If the file type is not supported.
    """
    ext = file_extension.lower().lstrip(".")

    parser_cls = _PARSERS.get(ext)
    if parser_cls is None:
        raise ValueError(
            f"Unsupported file type: '.{ext}'. "
            f"Supported types: {', '.join(f'.{e}' for e in ALLOWED_EXTENSIONS)}"
        )

    return parser_cls()


def get_extension_from_filename(filename: str) -> str:
    """
    Extract and validate the file extension from a filename.

    Args:
        filename: Original filename (e.g., "resume.pdf").

    Returns:
        Lowercase extension without dot (e.g., "pdf").

    Raises:
        ValueError: If the extension is missing or not supported.
    """
    if "." not in filename:
        raise ValueError(
            f"File '{filename}' has no extension. "
            f"Supported types: {', '.join(f'.{e}' for e in ALLOWED_EXTENSIONS)}"
        )

    ext = filename.rsplit(".", 1)[-1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"File type '.{ext}' is not supported. "
            f"Supported types: {', '.join(f'.{e}' for e in ALLOWED_EXTENSIONS)}"
        )

    return ext
