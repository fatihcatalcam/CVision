"""run_migrations() chooses the right Alembic action for each DB state."""
from unittest.mock import MagicMock
import app.db_migrations as dbm


def _patch(monkeypatch, *, current_rev, has_users):
    """Wire up fakes for alembic command + revision/table inspection."""
    calls = {"stamp": [], "upgrade": []}

    fake_command = MagicMock()
    fake_command.stamp.side_effect = lambda cfg, rev: calls["stamp"].append(rev)
    fake_command.upgrade.side_effect = lambda cfg, rev: calls["upgrade"].append(rev)
    monkeypatch.setattr(dbm, "command", fake_command)
    monkeypatch.setattr(dbm, "_make_config", lambda: MagicMock(name="cfg"))
    monkeypatch.setattr(dbm, "_current_revision", lambda engine: current_rev)
    monkeypatch.setattr(dbm, "_has_table", lambda engine, name: has_users)
    return calls


def test_fresh_db_upgrades_from_base(monkeypatch):
    calls = _patch(monkeypatch, current_rev=None, has_users=False)
    result = dbm.run_migrations(MagicMock(name="engine"))
    assert result == "fresh"
    assert calls["stamp"] == []
    assert calls["upgrade"] == ["head"]


def test_legacy_db_is_stamped_then_upgraded(monkeypatch):
    calls = _patch(monkeypatch, current_rev=None, has_users=True)
    result = dbm.run_migrations(MagicMock(name="engine"))
    assert result == "baselined"
    assert calls["stamp"] == [dbm.CATCHUP_BASELINE_REVISION]
    assert calls["upgrade"] == ["head"]


def test_already_migrated_db_just_upgrades(monkeypatch):
    calls = _patch(monkeypatch, current_rev="d1e2f3a4b5c6", has_users=True)
    result = dbm.run_migrations(MagicMock(name="engine"))
    assert result == "upgraded"
    assert calls["stamp"] == []
    assert calls["upgrade"] == ["head"]
