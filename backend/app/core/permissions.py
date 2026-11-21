from __future__ import annotations

from enum import Enum

from app.models import RoleName


class Permission(str, Enum):
    product_read = "product:read"
    product_write = "product:write"
    order_read = "order:read"
    order_write = "order:write"
    user_read = "user:read"
    user_write = "user:write"
    report_read = "report:read"
    message_read = "message:read"
    message_write = "message:write"
    setting_write = "setting:write"


ROLE_PERMISSIONS: dict[RoleName, frozenset[Permission]] = {
    RoleName.admin: frozenset(Permission),
    RoleName.manager: frozenset(
        {
            Permission.product_read,
            Permission.product_write,
            Permission.order_read,
            Permission.order_write,
            Permission.report_read,
            Permission.message_read,
            Permission.message_write,
        }
    ),
    RoleName.customer: frozenset({Permission.product_read, Permission.order_read, Permission.order_write}),
}


def role_has_permission(role: RoleName, permission: Permission) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, frozenset())
