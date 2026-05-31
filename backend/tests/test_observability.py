"""init_sentry is a no-op without a DSN and initializes when one is set."""
import app.observability as obs


def test_no_dsn_is_noop(monkeypatch):
    monkeypatch.setattr(obs.settings, "SENTRY_DSN", "")
    called = []
    monkeypatch.setattr(obs, "_sentry_init", lambda **kw: called.append(kw))
    assert obs.init_sentry() is False
    assert called == []


def test_dsn_initializes(monkeypatch):
    monkeypatch.setattr(obs.settings, "SENTRY_DSN", "https://x@example.test/1")
    monkeypatch.setattr(obs.settings, "SENTRY_TRACES_SAMPLE_RATE", 0.25)
    called = []
    monkeypatch.setattr(obs, "_sentry_init", lambda **kw: called.append(kw))
    assert obs.init_sentry() is True
    assert called and called[0]["dsn"] == "https://x@example.test/1"
    assert called[0]["traces_sample_rate"] == 0.25
