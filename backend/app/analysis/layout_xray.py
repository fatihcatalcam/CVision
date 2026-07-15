"""
ATS X-Ray - layout-level analysis of PDF CVs.

Simulates what a naive ATS parser sees (strict top-to-bottom, left-to-right
reading across the full page width) and detects layout patterns that damage
machine parsing. Pure function, engine-independent, PDF-only.

Output contract (persisted as analysis_results.layout_xray JSON):
    {"available": True, "page_count": int,
     "robot_lines": [{"t": str, "m": bool}],     # m = interleaved/mixed line
     "findings": [{"type": str, "severity": "high"|"info",
                   "page": int, "bbox": [x0, y0, x1, y1]}]}   # bbox normalized 0..1
    {"available": False, "reason": "plain_text" | "error"}

This function NEVER raises - any failure returns {"available": False}.
"""

import logging
import re
from pathlib import Path

import fitz  # PyMuPDF

logger = logging.getLogger("cvision.analysis.layout_xray")

# A text block is a column candidate when narrower than this fraction of the
# page; full-width paragraphs never count toward column detection.
_COLUMN_MAX_WIDTH = 0.55
# Both sides must stack at least this fraction of page height in narrow
# blocks before we call the page multi-column.
_COLUMN_MIN_COVERAGE = 0.20
# Images smaller than this fraction of the page area (icons, logos) are ignored.
_IMAGE_MIN_AREA = 0.03
# Top/bottom bands treated as header/footer.
_EDGE_BAND = 0.07
# Words whose vertical positions differ less than this many points share a line.
_Y_TOLERANCE = 3.0

_CONTACT_RE = re.compile(
    r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"   # email
    r"|\+?\d[\d\s\-\(\)]{6,}\d"                          # phone
)


def analyze_layout(pdf_path: Path) -> dict:
    """Analyze a PDF's layout for ATS-parsing risk. Never raises."""
    try:
        doc = fitz.open(str(pdf_path))
        if doc.needs_pass:
            doc.close()
            return {"available": False, "reason": "error"}
    except Exception:
        logger.warning(f"X-Ray could not open PDF: {pdf_path}", exc_info=True)
        return {"available": False, "reason": "error"}

    try:
        findings: list[dict] = []
        robot_lines: list[dict] = []

        for page_num, page in enumerate(doc, start=1):
            w, h = page.rect.width, page.rect.height
            if w <= 0 or h <= 0:
                continue
            blocks = page.get_text("blocks")
            text_blocks = [b for b in blocks if b[6] == 0 and b[4].strip()]

            split_x = _column_split(text_blocks, w, h)
            if split_x is not None:
                findings.append(_finding(
                    "column_interleave", "high", page_num,
                    _cluster_bbox(text_blocks, split_x, w, h), w, h,
                ))

            for rect in _image_rects(page):
                area = max(rect.width, 0) * max(rect.height, 0)
                if area >= _IMAGE_MIN_AREA * (w * h):
                    findings.append(_finding(
                        "image_text_loss", "high", page_num,
                        (rect.x0, rect.y0, rect.x1, rect.y1), w, h,
                    ))

            edge_hit = _edge_contact_bbox(text_blocks, w, h)
            if edge_hit is not None:
                findings.append(_finding(
                    "header_footer_content", "info", page_num, edge_hit, w, h,
                ))

            robot_lines.extend(_naive_lines(page, split_x))

        return {
            "available": True,
            "page_count": doc.page_count,
            "robot_lines": robot_lines,
            "findings": findings,
        }
    except Exception:
        logger.warning(f"X-Ray analysis failed for {pdf_path}", exc_info=True)
        return {"available": False, "reason": "error"}
    finally:
        try:
            doc.close()
        except Exception:
            pass


def _image_rects(page) -> list:
    """Displayed rectangles of the page's images. get_text('blocks') omits
    image blocks under default flags, so we go through get_images +
    get_image_rects instead."""
    rects = []
    try:
        for img in page.get_images(full=True):
            for rect in page.get_image_rects(img):
                rects.append(rect)
    except Exception:
        logger.debug("image rect extraction failed", exc_info=True)
    return rects


def _finding(ftype: str, severity: str, page: int, bbox, w: float, h: float) -> dict:
    x0, y0, x1, y1 = bbox
    return {
        "type": ftype,
        "severity": severity,
        "page": page,
        "bbox": [round(x0 / w, 4), round(y0 / h, 4),
                 round(x1 / w, 4), round(y1 / h, 4)],
    }


def _column_split(text_blocks: list, w: float, h: float) -> float | None:
    """Return the x that splits two side-by-side columns, or None.

    A block belongs to the left cluster when it lies entirely in the left
    ~55% of the page (and is narrow), mirrored for the right cluster. The
    page is multi-column when BOTH clusters stack enough height.
    """
    mid_band = [b for b in text_blocks
                if b[1] > _EDGE_BAND * h and b[3] < (1 - _EDGE_BAND) * h]
    left_h = right_h = 0.0
    left_max_x1 = 0.0
    right_min_x0 = w
    for b in mid_band:
        bw = b[2] - b[0]
        if bw <= 0 or bw > _COLUMN_MAX_WIDTH * w:
            continue
        center = (b[0] + b[2]) / 2
        if center < w / 2 and b[2] <= 0.55 * w:
            left_h += b[3] - b[1]
            left_max_x1 = max(left_max_x1, b[2])
        elif center >= w / 2 and b[0] >= 0.45 * w:
            right_h += b[3] - b[1]
            right_min_x0 = min(right_min_x0, b[0])
    if (left_h >= _COLUMN_MIN_COVERAGE * h
            and right_h >= _COLUMN_MIN_COVERAGE * h
            and left_max_x1 < right_min_x0):
        return (left_max_x1 + right_min_x0) / 2
    return None


def _cluster_bbox(text_blocks: list, split_x: float, w: float, h: float):
    """Bounding box of the left column cluster - v2 overlay data."""
    side = [b for b in text_blocks if (b[0] + b[2]) / 2 < split_x]
    if not side:
        return (0, 0, split_x, h)
    return (min(b[0] for b in side), min(b[1] for b in side),
            max(b[2] for b in side), max(b[3] for b in side))


def _edge_contact_bbox(text_blocks: list, w: float, h: float):
    """Bbox of the first header/footer block containing contact info, or None."""
    for b in text_blocks:
        in_header = b[3] <= _EDGE_BAND * h
        in_footer = b[1] >= (1 - _EDGE_BAND) * h
        if (in_header or in_footer) and _CONTACT_RE.search(b[4]):
            return (b[0], b[1], b[2], b[3])
    return None


def _naive_lines(page, split_x: float | None) -> list[dict]:
    """Simulate a dumb parser: read words strictly top-to-bottom then
    left-to-right across the FULL page width. On multi-column pages this
    interleaves the columns - which is exactly the damage we surface.

    A line is "mixed" (m=True) when the page is multi-column and the line
    pulls words from both sides of the split.
    """
    words = page.get_text("words")  # (x0, y0, x1, y1, word, ...)
    if not words:
        return []
    words = sorted(words, key=lambda t: (t[1], t[0]))
    lines: list[dict] = []
    band: list[tuple] = []
    band_y = words[0][1]

    def flush():
        if not band:
            return
        band.sort(key=lambda t: t[0])
        text = " ".join(t[4] for t in band)
        mixed = False
        if split_x is not None:
            has_left = any((t[0] + t[2]) / 2 < split_x for t in band)
            has_right = any((t[0] + t[2]) / 2 >= split_x for t in band)
            mixed = has_left and has_right
        lines.append({"t": text, "m": mixed})

    for t in words:
        if t[1] - band_y > _Y_TOLERANCE:
            flush()
            band = []
            band_y = t[1]
        band.append(t)
    flush()
    return lines
