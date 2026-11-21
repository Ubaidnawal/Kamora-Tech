from datetime import datetime, timezone
from secrets import randbelow

_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"


def _random_part(length: int) -> str:
    return "".join(_ALPHABET[randbelow(len(_ALPHABET))] for _ in range(length))


def _date_part(value: datetime) -> str:
    return value.astimezone(timezone.utc).strftime("%Y%m%d")


def generate_order_number() -> str:
    return f"ORD-{_date_part(datetime.now(timezone.utc))}-{_random_part(6)}"


def generate_tracking_id() -> str:
    return f"TRK-{_random_part(8)}-{_random_part(6)}"
