"""Adapter pattern: swap payment providers via PAYMENT_GATEWAY without changing views."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from uuid import uuid4

import requests
from django.conf import settings


@dataclass
class PaymentRequestResult:
    ok: bool
    authority: str = ""
    redirect_url: str = ""
    error: str = ""


@dataclass
class PaymentVerifyResult:
    ok: bool
    ref_id: str = ""
    error: str = ""


class PaymentGateway(ABC):
    name = "base"

    @abstractmethod
    def request_payment(self, amount: int, callback_url: str, description: str) -> PaymentRequestResult:
        ...

    @abstractmethod
    def verify(self, authority: str, amount: int) -> PaymentVerifyResult:
        ...


class MockGateway(PaymentGateway):
    """Local sandbox used when Iranian PSPs are unreachable."""

    name = "mock"

    def request_payment(self, amount: int, callback_url: str, description: str) -> PaymentRequestResult:
        authority = f"MOCK-{uuid4().hex[:16].upper()}"
        sep = "&" if "?" in callback_url else "?"
        redirect = f"{callback_url}{sep}Authority={authority}&Status=OK"
        return PaymentRequestResult(True, authority, redirect)

    def verify(self, authority: str, amount: int) -> PaymentVerifyResult:
        if not authority.startswith("MOCK-"):
            return PaymentVerifyResult(False, error="شناسه تراکنش نامعتبر است.")
        return PaymentVerifyResult(True, ref_id=authority.replace("MOCK-", "REF-"))


class ZarinpalGateway(PaymentGateway):
    name = "zarinpal"

    def __init__(self):
        sandbox = settings.ZARINPAL_SANDBOX
        self.merchant = settings.ZARINPAL_MERCHANT_ID
        self.request_url = (
            "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
            if sandbox
            else "https://api.zarinpal.com/pg/v4/payment/request.json"
        )
        self.verify_url = (
            "https://sandbox.zarinpal.com/pg/v4/payment/verify.json"
            if sandbox
            else "https://api.zarinpal.com/pg/v4/payment/verify.json"
        )
        self.start_pay = (
            "https://sandbox.zarinpal.com/pg/StartPay/"
            if sandbox
            else "https://www.zarinpal.com/pg/StartPay/"
        )

    def request_payment(self, amount: int, callback_url: str, description: str) -> PaymentRequestResult:
        try:
            response = requests.post(
                self.request_url,
                json={
                    "merchant_id": self.merchant,
                    "amount": amount,
                    "callback_url": callback_url,
                    "description": description,
                },
                timeout=12,
            )
            payload = response.json()
        except (requests.RequestException, ValueError) as exc:
            return PaymentRequestResult(False, error=f"خطا در اتصال به زرین‌پال: {exc}")

        data = payload.get("data") or {}
        errors = payload.get("errors")
        if data.get("code") == 100 and data.get("authority"):
            authority = data["authority"]
            return PaymentRequestResult(True, authority, f"{self.start_pay}{authority}")
        message = ""
        if isinstance(errors, dict):
            message = str(errors.get("message") or errors)
        return PaymentRequestResult(False, error=message or "درخواست پرداخت زرین‌پال ناموفق بود.")

    def verify(self, authority: str, amount: int) -> PaymentVerifyResult:
        try:
            response = requests.post(
                self.verify_url,
                json={
                    "merchant_id": self.merchant,
                    "amount": amount,
                    "authority": authority,
                },
                timeout=12,
            )
            payload = response.json()
        except (requests.RequestException, ValueError) as exc:
            return PaymentVerifyResult(False, error=f"خطا در تأیید زرین‌پال: {exc}")

        data = payload.get("data") or {}
        if data.get("code") in (100, 101):
            return PaymentVerifyResult(True, ref_id=str(data.get("ref_id", "")))
        return PaymentVerifyResult(False, error="تراکنش تأیید نشد.")


def get_gateway() -> PaymentGateway:
    name = (settings.PAYMENT_GATEWAY or "mock").lower()
    if name == "zarinpal":
        return ZarinpalGateway()
    return MockGateway()
