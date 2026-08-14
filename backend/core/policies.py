"""Strategy pattern: subscription entitlements without scattering if/else."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class SubscriptionEntitlements:
    daily_streams: float
    playlists: float
    avatar: bool
    download: bool
    early_access: bool
    stats: bool


class SubscriptionPolicy(Protocol):
    tier: str

    def entitlements(self) -> SubscriptionEntitlements: ...


class BasicPolicy:
    tier = "basic"

    def entitlements(self) -> SubscriptionEntitlements:
        return SubscriptionEntitlements(60, 6, False, False, False, False)


class SilverPolicy:
    tier = "silver"

    def entitlements(self) -> SubscriptionEntitlements:
        return SubscriptionEntitlements(float("inf"), 100, True, True, False, False)


class GoldPolicy:
    tier = "gold"

    def entitlements(self) -> SubscriptionEntitlements:
        return SubscriptionEntitlements(
            float("inf"), float("inf"), True, True, True, True
        )


_POLICIES: dict[str, SubscriptionPolicy] = {
    "basic": BasicPolicy(),
    "silver": SilverPolicy(),
    "gold": GoldPolicy(),
}


class SubscriptionPolicyFactory:
    @staticmethod
    def for_tier(tier: str) -> SubscriptionPolicy:
        return _POLICIES.get(tier, _POLICIES["basic"])


def entitlements_for(tier: str) -> SubscriptionEntitlements:
    return SubscriptionPolicyFactory.for_tier(tier).entitlements()
