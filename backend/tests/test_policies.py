from core.policies import entitlements_for
from reports.services import RoyaltyCalculator


def test_basic_policy_limits():
    e = entitlements_for("basic")
    assert e.daily_streams == 60
    assert e.playlists == 6
    assert e.avatar is False
    assert e.early_access is False


def test_gold_policy():
    e = entitlements_for("gold")
    assert e.daily_streams == float("inf")
    assert e.playlists == float("inf")
    assert e.stats is True


def test_royalty_formula():
    calc = RoyaltyCalculator(listener_rate=500, stream_rate=50)
    assert calc.compute(10, 100) == 10 * 500 + 100 * 50
