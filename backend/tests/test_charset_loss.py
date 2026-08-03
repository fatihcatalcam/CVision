# -*- coding: utf-8 -*-
"""Detect Turkish letters destroyed by the PDF's own font encoding.

A real CV came through the pipeline reading "TIbbi Görüntüleme Teknikleri
ÖIrencisi" instead of "Tıbbi Görüntüleme Teknikleri Öğrencisi". The PDF declared
WinAnsiEncoding (CP1252) with a non-embedded Helvetica, and CP1252 has no code
point for ı, İ, ğ, Ğ, ş or Ş - so the generator dropped them when the file was
written. The characters are not recoverable: they were never in the file.

It matters because a real ATS reads exactly the same damaged text, so "Tıbbi
Görüntüleme" never matches. X-Ray told that user their CV was clean.

The signature is precise. CP1252 *can* encode ö, ü and ç, so those survive and
prove the document is Turkish; only the six letters CP1252 lacks disappear.
Requiring the survivors is what separates this from a user who simply typed
without Turkish characters at all - same missing letters, completely different
advice.
"""

import re

import pytest

from app.analysis.layout_xray import _charset_loss


HEALTHY = (
    "Tıbbi Görüntüleme Teknikleri Öğrencisi olarak hasta güvenliği ve "
    "görüntüleme kalitesine önem veren, öğrenmeye açık ve sorumluluk sahibi "
    "bir adayım. Farklı hastanelerde gerçekleştirdiğim stajlar sayesinde "
    "radyoloji departmanlarının işleyişi konusunda deneyim kazandım ve "
    "mesleki gelişimimi sürdürmeyi hedefliyorum. Günlük olarak hasta "
    "kabul süreçlerinde görev aldım, çekim protokollerini uyguladım ve "
    "raporlama aşamasında uzman hekimlere destek verdim."
)

# The same CV as it actually arrived: ı/ğ/ş replaced with a capital I, while
# ö, ü and ç came through untouched.
DAMAGED = (
    HEALTHY.replace("ı", "I").replace("İ", "I")
    .replace("ğ", "I").replace("Ğ", "I")
    .replace("ş", "I").replace("Ş", "I")
)


def test_the_reported_cv_is_flagged():
    assert _charset_loss(DAMAGED) is True


def test_healthy_turkish_is_not_flagged():
    assert _charset_loss(HEALTHY) is False


def test_turkish_typed_without_any_diacritics_is_not_flagged():
    """ı/ğ/ş are missing here too, but so are ö/ü/ç - nothing was destroyed,
    the writer just never typed Turkish characters. Different problem, and
    telling them to re-export their PDF would be wrong."""
    ascii_only = (
        DAMAGED.replace("ö", "o").replace("Ö", "O")
        .replace("ü", "u").replace("Ü", "U")
        .replace("ç", "c").replace("Ç", "C")
    )

    assert _charset_loss(ascii_only) is False


def test_english_cv_is_not_flagged():
    english = (
        "Experienced backend engineer with a focus on distributed systems and "
        "data pipelines. Built and operated services handling millions of daily "
        "requests, mentored junior engineers, and led the migration of a legacy "
        "monolith onto a service architecture. Comfortable across Python, Go and "
        "TypeScript, with a strong grounding in observability and incident "
        "response. Looking for a role where reliability work is valued and "
        "measured rather than assumed to happen by itself somehow."
    )

    assert _charset_loss(english) is False


def test_german_cv_with_umlauts_is_not_flagged():
    """ö and ü appear, and ı/ğ/ş legitimately do not - this is just German."""
    german = (
        "Erfahrener Softwareentwickler mit Schwerpunkt auf verteilten Systemen "
        "und Datenverarbeitung. Ich habe Dienste entwickelt und betrieben, die "
        "täglich Millionen von Anfragen verarbeiten, jüngere Kollegen betreut "
        "und die Migration eines Altsystems auf eine moderne Architektur "
        "geleitet. Vertraut mit Python, Go und TypeScript sowie mit "
        "Überwachung und Störungsbehebung im laufenden Betrieb heute."
    )

    assert _charset_loss(german) is False


def test_a_short_snippet_is_not_enough_evidence():
    """Zero ı/ğ/ş across a handful of words proves nothing; the claim only holds
    once there is enough Turkish text for their absence to be impossible."""
    assert _charset_loss("Görüntüleme ve bir olan üzere") is False


def test_camelcase_tech_terms_do_not_trigger_it():
    """An earlier idea keyed off capitals appearing inside lowercase words, which
    is exactly what JavaScript, PostgreSQL and eBay look like. This detector does
    not use that signal, and this pins that down."""
    tech = (
        "Senior engineer working across JavaScript, TypeScript, PostgreSQL and "
        "GraphQL. Built iOS and macOS clients, integrated PayPal and eBay APIs, "
        "and maintained CI/CD on GitHub Actions with Docker and Kubernetes. "
        "Comfortable with MongoDB, DynamoDB and Redis, plus RabbitMQ for async "
        "messaging between services and a shared observability layer today."
    )

    assert _charset_loss(tech) is False


def test_findings_surface_through_analyze_layout(tmp_path):
    """End to end: a PDF written in a base-14 font with no Turkish glyphs
    reproduces the reported failure, and X-Ray reports it."""
    fitz = pytest.importorskip("fitz")

    doc = fitz.open()
    page = doc.new_page()
    y = 60
    for line in re.findall(r".{1,70}(?:\s|$)", HEALTHY):
        page.insert_text((40, y), line.strip(), fontname="helv", fontsize=10)
        y += 16
    pdf = tmp_path / "winansi.pdf"
    doc.save(str(pdf))
    doc.close()

    from app.analysis.layout_xray import analyze_layout

    result = analyze_layout(pdf)

    assert result["available"] is True
    types = [f["type"] for f in result["findings"]]
    assert "charset_loss" in types

    finding = next(f for f in result["findings"] if f["type"] == "charset_loss")
    assert finding["severity"] == "high"
    assert finding["page"] == 1
    assert len(finding["bbox"]) == 4
    assert all(0.0 <= v <= 1.0 for v in finding["bbox"])


def test_a_healthy_pdf_reports_no_charset_finding(tmp_path):
    """Same text, but with a font that actually carries the glyphs."""
    fitz = pytest.importorskip("fitz")
    import os

    arial = "C:/Windows/Fonts/arial.ttf"
    if not os.path.exists(arial):
        pytest.skip("no Unicode TTF available on this machine")

    doc = fitz.open()
    page = doc.new_page()
    y = 60
    for line in re.findall(r".{1,70}(?:\s|$)", HEALTHY):
        page.insert_text((40, y), line.strip(), fontfile=arial, fontname="ari", fontsize=10)
        y += 16
    pdf = tmp_path / "embedded.pdf"
    doc.save(str(pdf))
    doc.close()

    from app.analysis.layout_xray import analyze_layout

    result = analyze_layout(pdf)

    assert result["available"] is True
    assert "charset_loss" not in [f["type"] for f in result["findings"]]
