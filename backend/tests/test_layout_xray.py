# -*- coding: utf-8 -*-
"""ATS X-Ray layout analysis tests.

Synthetic PDFs are built in-test with PyMuPDF. The most important guard:
a clean single-column CV must produce ZERO findings — a false "your CV is
broken" kills user trust.
"""
import fitz
import pytest

from app.analysis.layout_xray import analyze_layout

A4_W, A4_H = 595, 842


def _save(doc, tmp_path, name):
    path = tmp_path / name
    doc.save(str(path))
    doc.close()
    return path


def _pdf_single_column(tmp_path):
    doc = fitz.open()
    page = doc.new_page(width=A4_W, height=A4_H)
    y = 90
    lines = [
        "John Smith",
        "john.smith@example.com | +1 555 123 4567",
        "PROFESSIONAL SUMMARY",
        "Senior software engineer with 6 years of experience building backend systems.",
        "WORK EXPERIENCE",
        "Senior Backend Developer | Acme Corp | Jan 2021 - Present",
        "Developed and maintained REST API microservices in Python and Node.js",
        "Software Engineer | Beta Ltd | 2019 - 2021",
        "Built frontend features with React and TypeScript",
        "EDUCATION",
        "BSc Computer Science, Bogazici University, 2015 - 2019",
        "SKILLS",
        "Python, JavaScript, TypeScript, SQL, React, Node.js, Docker, Git",
    ]
    for line in lines:
        page.insert_text((50, y), line, fontsize=11)
        y += 26
    return _save(doc, tmp_path, "single.pdf")


def _pdf_two_column(tmp_path):
    doc = fitz.open()
    page = doc.new_page(width=A4_W, height=A4_H)
    left = ["SKILLS", "Python", "React", "SQL", "Docker", "Git", "AWS",
            "Linux", "Jira", "Figma", "Excel", "Agile", "Scrum", "REST",
            "Node.js", "Django", "Flask", "Pytest", "GitHub", "CI/CD"]
    right = ["EXPERIENCE", "Acme Corp 2021 - Present", "Led backend team",
             "Built microservices", "Beta Ltd 2019 - 2021", "Frontend work",
             "React and TypeScript", "EDUCATION", "BSc Computer Science",
             "Bogazici University", "2015 - 2019", "PROJECTS",
             "Task queue library", "Open source work", "LANGUAGES",
             "English fluent", "Turkish native", "CONTACT",
             "left right test", "filler line"]
    y = 90
    for line in left:
        page.insert_text((45, y), line, fontsize=11)
        y += 30
    y = 90
    for line in right:
        page.insert_text((330, y), line, fontsize=11)
        y += 30
    return _save(doc, tmp_path, "two_col.pdf")


def _pdf_with_image(tmp_path):
    doc = fitz.open()
    page = doc.new_page(width=A4_W, height=A4_H)
    y = 90
    for line in ["John Smith", "EXPERIENCE", "Acme Corp 2021 - Present",
                 "EDUCATION", "BSc Computer Science", "SKILLS", "Python, SQL"]:
        page.insert_text((50, y), line, fontsize=11)
        y += 26
    pm = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 100, 100))
    page.insert_image(fitz.Rect(60, 400, 420, 780), pixmap=pm)  # ~27% of page
    return _save(doc, tmp_path, "image.pdf")


def _pdf_header_contact(tmp_path):
    doc = fitz.open()
    page = doc.new_page(width=A4_W, height=A4_H)
    page.insert_text((50, 30), "john.smith@example.com | +1 555 123 4567", fontsize=9)
    y = 120
    for line in ["John Smith", "EXPERIENCE", "Acme Corp 2021 - Present",
                 "EDUCATION", "BSc", "SKILLS", "Python"]:
        page.insert_text((50, y), line, fontsize=11)
        y += 26
    return _save(doc, tmp_path, "header.pdf")


def _types(result):
    return {f["type"] for f in result["findings"]}


# ── the trust guard ─────────────────────────────────────────────────────────

def test_single_column_cv_has_zero_findings(tmp_path):
    result = analyze_layout(_pdf_single_column(tmp_path))
    assert result["available"] is True
    assert result["findings"] == []


def test_single_column_robot_lines_are_not_mixed(tmp_path):
    result = analyze_layout(_pdf_single_column(tmp_path))
    assert result["robot_lines"], "robot view must not be empty"
    assert all(line["m"] is False for line in result["robot_lines"])


# ── detectors ───────────────────────────────────────────────────────────────

def test_two_column_cv_flags_column_interleave(tmp_path):
    result = analyze_layout(_pdf_two_column(tmp_path))
    assert "column_interleave" in _types(result)
    f = next(f for f in result["findings"] if f["type"] == "column_interleave")
    assert f["severity"] == "high"
    assert f["page"] == 1


def test_two_column_robot_lines_actually_interleave(tmp_path):
    result = analyze_layout(_pdf_two_column(tmp_path))
    mixed = [l for l in result["robot_lines"] if l["m"]]
    assert mixed, "two-column page must produce mixed lines"
    # a mixed line contains words from both columns at the same height
    assert any("SKILLS" in l["t"] and "EXPERIENCE" in l["t"] for l in mixed)


def test_large_image_flags_image_text_loss(tmp_path):
    result = analyze_layout(_pdf_with_image(tmp_path))
    assert "image_text_loss" in _types(result)


def test_header_contact_flags_info_finding(tmp_path):
    result = analyze_layout(_pdf_header_contact(tmp_path))
    f = next(f for f in result["findings"] if f["type"] == "header_footer_content")
    assert f["severity"] == "info"


# ── failure isolation ───────────────────────────────────────────────────────

def test_corrupt_pdf_returns_unavailable_not_exception(tmp_path):
    bad = tmp_path / "corrupt.pdf"
    bad.write_bytes(b"this is not a pdf at all")
    result = analyze_layout(bad)
    assert result == {"available": False, "reason": "error"}


def test_missing_file_returns_unavailable(tmp_path):
    result = analyze_layout(tmp_path / "nope.pdf")
    assert result == {"available": False, "reason": "error"}
