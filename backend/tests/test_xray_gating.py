# -*- coding: utf-8 -*-
"""Anonymous/free gating of the X-Ray payload: the full robot view must
never leave the server for locked results (same philosophy as suggestion
teasers - DOM inspection reveals nothing)."""
from app.routers.analysis import _build_xray_response

XRAY = {
    "available": True,
    "page_count": 1,
    "robot_lines": [{"t": f"line {i} with some words here", "m": i % 2 == 0}
                    for i in range(40)],
    "findings": [
        {"type": "column_interleave", "severity": "high", "page": 1, "bbox": [0, 0, .5, 1]},
        {"type": "image_text_loss", "severity": "high", "page": 1, "bbox": [0, 0, .5, .5]},
        {"type": "header_footer_content", "severity": "info", "page": 1, "bbox": [0, 0, 1, .05]},
    ],
}


def test_none_input_gives_none():
    assert _build_xray_response(None, is_free=False) is None


def test_unavailable_passes_through():
    resp = _build_xray_response({"available": False, "reason": "plain_text"}, is_free=True)
    assert resp.available is False and resp.reason == "plain_text"


def test_unlocked_returns_everything():
    resp = _build_xray_response(XRAY, is_free=False)
    assert resp.is_locked is False
    assert len(resp.robot_lines) == 40
    assert len(resp.findings) == 3
    assert resp.findings_total == 3


def test_locked_truncates_robot_view_to_200_chars():
    resp = _build_xray_response(XRAY, is_free=True)
    assert resp.is_locked is True
    total = sum(len(l["t"]) for l in resp.robot_lines)
    assert 0 < total <= 200


def test_locked_sends_only_first_finding_plus_count():
    resp = _build_xray_response(XRAY, is_free=True)
    assert len(resp.findings) == 1
    assert resp.findings[0].type == "column_interleave"
    assert resp.findings_total == 3
