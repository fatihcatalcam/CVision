"""The OpenAI client is built once, not once per call.

Render killed the web service for exceeding its memory limit on 2026-09-19.
`_get_client()` was constructing a brand-new client on every call, and a single
analysis makes several of them (enhance, normalise skills, normalise keywords,
rewrite). Measured locally: 1.3 MB per client, 65 MB for 50 live ones, each
carrying its own connection pool and TLS context that nothing reused.

Repeated create-and-drop cycles do settle, so this was a high-water mark under
concurrency rather than an unbounded leak - but the whole service only has
512 MB, and roughly 150 MB of that is gone before a single request arrives.
"""

import pytest

from app.services import ai_service


class FakeOpenAI:
    """Stands in for the SDK client; records every construction."""

    instances: list[str] = []

    def __init__(self, api_key):
        FakeOpenAI.instances.append(api_key)


@pytest.fixture(autouse=True)
def fake_sdk(monkeypatch):
    FakeOpenAI.instances = []
    # `_build_client` does `from openai import OpenAI` at call time, so patching
    # the attribute on the module is what it will pick up.
    monkeypatch.setattr("openai.OpenAI", FakeOpenAI)
    ai_service._build_client.cache_clear()
    yield
    ai_service._build_client.cache_clear()


def test_the_client_is_built_once_and_reused():
    first = ai_service._build_client("sk-test")
    second = ai_service._build_client("sk-test")
    third = ai_service._build_client("sk-test")

    assert first is second is third
    assert FakeOpenAI.instances == ["sk-test"], "one construction, not three"


def test_a_changed_key_builds_a_new_client():
    """Serving a client authenticated with a retired key would be worse than
    the memory it saves."""
    first = ai_service._build_client("sk-old")
    second = ai_service._build_client("sk-new")

    assert first is not second
    assert FakeOpenAI.instances == ["sk-old", "sk-new"]


def test_building_many_times_costs_one_construction():
    """The shape of the original bug: several calls inside one analysis."""
    for _ in range(20):
        ai_service._build_client("sk-test")

    assert len(FakeOpenAI.instances) == 1


# Not covered here: that `_get_client` itself routes through `_build_client`.
# conftest replaces `_get_client` for every test as a safety net against real
# API calls, so there is nothing left to assert against - it is a single
# delegating line, and the cache above is what the fix turns on.
