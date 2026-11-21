from __future__ import annotations

import asyncio
import json
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database.connection import (
    DatabaseConfigurationError,
    engine,
    require_database_configured,
)

REQUIRED_TABLES = (
    "users",
    "roles",
    "user_roles",
    "refresh_tokens",
    "email_verification_tokens",
    "password_reset_tokens",
    "products",
    "product_categories",
    "product_images",
    "product_features",
    "carts",
    "cart_items",
    "orders",
    "order_items",
    "order_status_history",
    "payments",
    "order_notes",
    "customer_profiles",
    "customer_messages",
    "contact_messages",
    "project_inquiries",
    "admin_activity_logs",
    "site_settings",
)

REQUIRED_USER_COLUMNS = (
    "id",
    "full_name",
    "email",
    "phone",
    "password_hash",
    "accepted_terms",
    "is_active",
    "is_verified",
    "created_at",
    "updated_at",
)

CONFIGURATION_ISSUE = "DATABASE_URL is missing or contains a placeholder. No connection was attempted."

_IDENTITY_QUERY = text(
    """
    SELECT current_database(), current_user, current_schema(), version()
    """
)

_SSL_QUERY = text(
    """
    SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()
    """
)

_TABLES_QUERY = text(
    """
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = current_schema() AND table_type = 'BASE TABLE'
    """
)

_USER_COLUMNS_QUERY = text(
    """
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'users'
    """
)

_UNIQUE_CONSTRAINT_QUERY = text(
    """
    SELECT tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
     AND tc.table_name = kcu.table_name
    WHERE tc.table_schema = current_schema()
      AND tc.table_name = 'users'
      AND tc.constraint_type = 'UNIQUE'
      AND kcu.column_name = 'email'
    ORDER BY tc.constraint_name
    LIMIT 1
    """
)

_UNIQUE_INDEX_QUERY = text(
    """
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND tablename = 'users'
      AND lower(indexdef) LIKE '%unique%'
      AND lower(indexdef) LIKE '%email%'
    ORDER BY indexname
    LIMIT 1
    """
)

_INSERT_QUERY = text(
    """
    INSERT INTO users (
        id, full_name, email, phone, password_hash,
        accepted_terms, is_active, is_verified, status,
        created_at, updated_at
    ) VALUES (
        :id, :full_name, :email, :phone, :password_hash,
        :accepted_terms, :is_active, :is_verified, :status,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    """
)

_FIND_USER_QUERY = text("SELECT 1 FROM users WHERE email = :email")
_COUNT_USER_QUERY = text("SELECT COUNT(*) FROM users WHERE email = :email")


def _emit(payload: dict[str, object]) -> None:
    print(json.dumps(payload, indent=2, sort_keys=True))


async def _check_insert_permission(connection: object) -> dict[str, object]:
    email = f"audit-rollback-{uuid4().hex}@invalid.test"
    params: dict[str, object] = {
        "id": str(uuid4()),
        "full_name": "Temporary Audit User",
        "email": email,
        "phone": "0000000000",
        "password_hash": "AUDIT_ROLLBACK_ONLY_NOT_A_REAL_HASH",
        "accepted_terms": True,
        "is_active": False,
        "is_verified": False,
        "status": "active",
    }
    transaction = await connection.begin_nested()
    try:
        await connection.execute(_INSERT_QUERY, params)
        inserted = (await connection.execute(_FIND_USER_QUERY, {"email": email})).first() is not None
        await transaction.rollback()
        remaining = int((await connection.execute(_COUNT_USER_QUERY, {"email": email})).scalar_one())
        return {
            "succeeded": inserted and remaining == 0,
            "rolled_back": True,
            "rows_remaining": remaining,
        }
    except (SQLAlchemyError, OSError) as exc:
        if transaction.is_active:
            await transaction.rollback()
        return {
            "succeeded": False,
            "rolled_back": True,
            "exception_type": type(exc).__name__,
        }


async def run_audit() -> int:
    try:
        require_database_configured()
    except DatabaseConfigurationError:
        _emit(
            {
                "status": "configuration_required",
                "details": {"connection": {"attempted": False}},
                "issues": [CONFIGURATION_ISSUE],
            }
        )
        return 2

    issues: list[str] = []
    details: dict[str, object] = {"connection": {"attempted": True, "succeeded": False}}

    try:
        async with engine.connect() as connection:
            details["connection"]["succeeded"] = True

            identity = (await connection.execute(_IDENTITY_QUERY)).one()
            ssl_enabled = (await connection.execute(_SSL_QUERY)).scalar()
            details["database"] = {
                "name": identity[0],
                "role": identity[1],
                "schema": identity[2],
                "version": identity[3],
                "ssl_reported_by_session": bool(ssl_enabled),
            }

            table_rows = (await connection.execute(_TABLES_QUERY)).fetchall()
            table_names = {row[0] for row in table_rows}
            missing_tables = [name for name in REQUIRED_TABLES if name not in table_names]
            details["tables"] = {
                "required": len(REQUIRED_TABLES),
                "present": len(REQUIRED_TABLES) - len(missing_tables),
                "missing": missing_tables,
            }
            if missing_tables:
                issues.append("Required tables are missing.")

            if "users" in table_names:
                column_rows = (await connection.execute(_USER_COLUMNS_QUERY)).fetchall()
                user_columns = {row[0] for row in column_rows}
                missing_columns = [name for name in REQUIRED_USER_COLUMNS if name not in user_columns]
                details["users_columns"] = {
                    "required": len(REQUIRED_USER_COLUMNS),
                    "present": len(REQUIRED_USER_COLUMNS) - len(missing_columns),
                    "missing": missing_columns,
                }
                if missing_columns:
                    issues.append("Required users columns are missing.")

                unique_constraint = (await connection.execute(_UNIQUE_CONSTRAINT_QUERY)).scalar()
                unique_index = (await connection.execute(_UNIQUE_INDEX_QUERY)).scalar()
                details["users_email_unique"] = {
                    "present": bool(unique_constraint or unique_index),
                    "constraint": unique_constraint,
                    "index": unique_index,
                }
                if not (unique_constraint or unique_index):
                    issues.append("No unique constraint or index exists on users.email.")

                if not missing_columns:
                    insert_result = await _check_insert_permission(connection)
                    details["insert_rollback"] = insert_result
                    if not insert_result["succeeded"]:
                        issues.append("Temporary insert-and-rollback check did not succeed.")
            else:
                issues.append("The users table is missing; column and insert checks were skipped.")
    except (SQLAlchemyError, OSError) as exc:
        issues.append("Database connection or query failed.")
        details["connection"]["exception_type"] = type(exc).__name__
    finally:
        await engine.dispose()

    status = "ok" if not issues else "failed"
    _emit({"status": status, "details": details, "issues": issues})
    return 0 if status == "ok" else 1


def main() -> int:
    return asyncio.run(run_audit())


if __name__ == "__main__":
    raise SystemExit(main())
