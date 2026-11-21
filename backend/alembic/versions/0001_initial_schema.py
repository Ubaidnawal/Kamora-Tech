from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _enum(*values: str, name: str) -> sa.Enum:
    return sa.Enum(*values, name=name, native_enum=False)


def _base_columns() -> list[sa.Column]:
    return [
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def _soft_delete_columns() -> list[sa.Column]:
    return [
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    ]


def _create_base_indexes(table_name: str) -> None:
    op.create_index(f"ix_{table_name}_id", table_name, ["id"])
    op.create_index(f"ix_{table_name}_created_at", table_name, ["created_at"])


def _create_soft_delete_index(table_name: str) -> None:
    op.create_index(f"ix_{table_name}_is_deleted", table_name, ["is_deleted"])


def _drop_base_indexes(table_name: str) -> None:
    op.drop_index(f"ix_{table_name}_created_at", table_name=table_name)
    op.drop_index(f"ix_{table_name}_id", table_name=table_name)


def _drop_soft_delete_index(table_name: str) -> None:
    op.drop_index(f"ix_{table_name}_is_deleted", table_name=table_name)


def upgrade() -> None:
    op.create_table(
        "users",
        *_base_columns(),
        sa.Column("full_name", sa.String(length=160), nullable=False),
        sa.Column("email", sa.String(length=255), unique=True, nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_verified", sa.Boolean(), nullable=False),
        sa.Column("status", _enum("active", "suspended", name="userstatus"), nullable=False),
    )
    _create_base_indexes("users")
    op.create_index("ix_users_email_lower", "users", ["email"])
    op.create_index("ix_users_status_created", "users", ["status", "created_at"])

    op.create_table(
        "roles",
        *_base_columns(),
        sa.Column("name", _enum("admin", "customer", "manager", name="rolename"), unique=True, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
    )
    _create_base_indexes("roles")

    op.create_table(
        "user_roles",
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("role_id", sa.String(length=36), sa.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "refresh_tokens",
        *_base_columns(),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(length=255), unique=True, nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.Column("replaced_by", sa.String(length=255), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
    )
    _create_base_indexes("refresh_tokens")
    op.create_index("ix_refresh_tokens_user_revoked", "refresh_tokens", ["user_id", "revoked_at"])

    op.create_table(
        "email_verification_tokens",
        *_base_columns(),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(length=255), unique=True, nullable=False),
        sa.Column("new_email", sa.String(length=255), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used_at", sa.DateTime(), nullable=True),
    )
    _create_base_indexes("email_verification_tokens")

    op.create_table(
        "password_reset_tokens",
        *_base_columns(),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(length=255), unique=True, nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used_at", sa.DateTime(), nullable=True),
    )
    _create_base_indexes("password_reset_tokens")

    op.create_table(
        "product_categories",
        *_base_columns(),
        *_soft_delete_columns(),
        sa.Column("name", sa.String(length=160), unique=True, nullable=False),
        sa.Column("slug", sa.String(length=160), unique=True, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
    )
    _create_base_indexes("product_categories")
    _create_soft_delete_index("product_categories")

    op.create_table(
        "products",
        *_base_columns(),
        *_soft_delete_columns(),
        sa.Column(
            "category_id",
            sa.String(length=36),
            sa.ForeignKey("product_categories.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=200), unique=True, nullable=False),
        sa.Column("short_description", sa.String(length=500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("features", sa.JSON(), nullable=False),
        sa.Column("specifications", sa.JSON(), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("status", _enum("draft", "active", "archived", name="productstatus"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_featured", sa.Boolean(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.CheckConstraint("price IS NULL OR price >= 0", name="ck_products_price_nonnegative"),
    )
    _create_base_indexes("products")
    _create_soft_delete_index("products")
    op.create_index("ix_products_active_featured", "products", ["is_active", "is_featured"])
    op.create_index("ix_products_category_slug", "products", ["category_id", "slug"])

    op.create_table(
        "product_images",
        *_base_columns(),
        sa.Column("product_id", sa.String(length=36), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("alt_text", sa.String(length=255), nullable=True),
        sa.Column("is_primary", sa.Boolean(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
    )
    _create_base_indexes("product_images")

    op.create_table(
        "carts",
        *_base_columns(),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("status", _enum("active", "converted", "abandoned", name="cartstatus"), nullable=False),
    )
    _create_base_indexes("carts")

    op.create_table(
        "cart_items",
        *_base_columns(),
        sa.Column("cart_id", sa.String(length=36), sa.ForeignKey("carts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", sa.String(length=36), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.CheckConstraint("quantity > 0", name="ck_cart_items_quantity_positive"),
    )
    _create_base_indexes("cart_items")
    op.create_index("ix_cart_items_cart_product", "cart_items", ["cart_id", "product_id"], unique=True)

    op.create_table(
        "orders",
        *_base_columns(),
        sa.Column("order_number", sa.String(length=32), unique=True, nullable=False),
        sa.Column("tracking_id", sa.String(length=32), unique=True, nullable=False),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("product_id", sa.String(length=36), sa.ForeignKey("products.id", ondelete="SET NULL"), nullable=True),
        sa.Column("product_name_snapshot", sa.String(length=200), nullable=False),
        sa.Column("customer_name", sa.String(length=160), nullable=False),
        sa.Column("customer_email", sa.String(length=255), nullable=False),
        sa.Column("customer_phone", sa.String(length=32), nullable=False),
        sa.Column("business_name", sa.String(length=160), nullable=True),
        sa.Column("project_requirements", sa.Text(), nullable=True),
        sa.Column("additional_instructions", sa.Text(), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column(
            "payment_status",
            _enum(
                "pending",
                "awaiting_payment",
                "partially_paid",
                "paid",
                "refunded",
                name="paymentstatus",
            ),
            nullable=False,
        ),
        sa.Column(
            "order_status",
            _enum(
                "pending",
                "confirmed",
                "in_progress",
                "under_review",
                "completed",
                "cancelled",
                name="orderstatus",
            ),
            nullable=False,
        ),
        sa.Column("admin_notes", sa.Text(), nullable=True),
    )
    _create_base_indexes("orders")
    op.create_index("ix_orders_user_created", "orders", ["user_id", "created_at"])
    op.create_index("ix_orders_status", "orders", ["order_status"])
    op.create_index("ix_orders_tracking", "orders", ["tracking_id"], unique=True)

    op.create_table(
        "order_items",
        *_base_columns(),
        sa.Column("order_id", sa.String(length=36), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", sa.String(length=36), sa.ForeignKey("products.id", ondelete="SET NULL"), nullable=True),
        sa.Column("product_name_snapshot", sa.String(length=200), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("line_total", sa.Numeric(12, 2), nullable=True),
    )
    _create_base_indexes("order_items")

    op.create_table(
        "order_status_history",
        *_base_columns(),
        sa.Column("order_id", sa.String(length=36), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "from_status",
            _enum(
                "pending",
                "confirmed",
                "in_progress",
                "under_review",
                "completed",
                "cancelled",
                name="orderstatus",
            ),
            nullable=True,
        ),
        sa.Column(
            "to_status",
            _enum(
                "pending",
                "confirmed",
                "in_progress",
                "under_review",
                "completed",
                "cancelled",
                name="orderstatus",
            ),
            nullable=False,
        ),
        sa.Column("changed_by_admin_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
    )
    _create_base_indexes("order_status_history")
    op.create_index("ix_order_history_order_created", "order_status_history", ["order_id", "created_at"])

    op.create_table(
        "payments",
        *_base_columns(),
        sa.Column("order_id", sa.String(length=36), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column(
            "status",
            _enum(
                "pending",
                "awaiting_payment",
                "partially_paid",
                "paid",
                "refunded",
                name="paymentstatus",
            ),
            nullable=False,
        ),
        sa.Column("provider", sa.String(length=80), nullable=True),
        sa.Column("provider_reference", sa.String(length=160), nullable=True),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
    )
    _create_base_indexes("payments")
    op.create_index("ix_payments_order_status", "payments", ["order_id", "status"])

    op.create_table(
        "order_notes",
        *_base_columns(),
        sa.Column("order_id", sa.String(length=36), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("author_role", sa.String(length=40), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("is_internal", sa.Boolean(), nullable=False),
    )
    _create_base_indexes("order_notes")

    op.create_table(
        "customer_profiles",
        *_base_columns(),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("company_name", sa.String(length=160), nullable=True),
        sa.Column("address_line1", sa.String(length=255), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("country", sa.String(length=120), nullable=True),
        sa.Column("timezone", sa.String(length=80), nullable=True),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
    )
    _create_base_indexes("customer_profiles")

    op.create_table(
        "customer_messages",
        *_base_columns(),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_id", sa.String(length=36), sa.ForeignKey("orders.id", ondelete="SET NULL"), nullable=True),
        sa.Column("subject", sa.String(length=200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column(
            "status",
            _enum("open", "answered", "closed", name="messagestatus"),
            nullable=False,
        ),
        sa.Column("admin_reply", sa.Text(), nullable=True),
    )
    _create_base_indexes("customer_messages")
    op.create_index("ix_customer_messages_user_status", "customer_messages", ["user_id", "status"])

    op.create_table(
        "admin_activity_logs",
        *_base_columns(),
        sa.Column("admin_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(length=120), nullable=False),
        sa.Column("target_type", sa.String(length=80), nullable=True),
        sa.Column("target_id", sa.String(length=36), nullable=True),
        sa.Column("details", sa.JSON(), nullable=False),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
    )
    _create_base_indexes("admin_activity_logs")
    op.create_index("ix_admin_logs_admin_created", "admin_activity_logs", ["admin_id", "created_at"])

    op.create_table(
        "site_settings",
        *_base_columns(),
        sa.Column("key", sa.String(length=120), unique=True, nullable=False),
        sa.Column("value", sa.JSON(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
    )
    _create_base_indexes("site_settings")


def downgrade() -> None:
    op.drop_index("ix_site_settings_created_at", table_name="site_settings")
    op.drop_index("ix_site_settings_id", table_name="site_settings")
    op.drop_table("site_settings")

    op.drop_index("ix_admin_logs_admin_created", table_name="admin_activity_logs")
    _drop_base_indexes("admin_activity_logs")
    op.drop_table("admin_activity_logs")

    op.drop_index("ix_customer_messages_user_status", table_name="customer_messages")
    _drop_base_indexes("customer_messages")
    op.drop_table("customer_messages")

    _drop_base_indexes("customer_profiles")
    op.drop_table("customer_profiles")

    _drop_base_indexes("order_notes")
    op.drop_table("order_notes")

    op.drop_index("ix_payments_order_status", table_name="payments")
    _drop_base_indexes("payments")
    op.drop_table("payments")

    op.drop_index("ix_order_history_order_created", table_name="order_status_history")
    _drop_base_indexes("order_status_history")
    op.drop_table("order_status_history")

    _drop_base_indexes("order_items")
    op.drop_table("order_items")

    op.drop_index("ix_orders_tracking", table_name="orders")
    op.drop_index("ix_orders_status", table_name="orders")
    op.drop_index("ix_orders_user_created", table_name="orders")
    _drop_base_indexes("orders")
    op.drop_table("orders")

    op.drop_index("ix_cart_items_cart_product", table_name="cart_items")
    _drop_base_indexes("cart_items")
    op.drop_table("cart_items")

    _drop_base_indexes("carts")
    op.drop_table("carts")

    _drop_base_indexes("product_images")
    op.drop_table("product_images")

    op.drop_index("ix_products_category_slug", table_name="products")
    op.drop_index("ix_products_active_featured", table_name="products")
    _drop_soft_delete_index("products")
    _drop_base_indexes("products")
    op.drop_table("products")

    _drop_soft_delete_index("product_categories")
    _drop_base_indexes("product_categories")
    op.drop_table("product_categories")

    _drop_base_indexes("password_reset_tokens")
    op.drop_table("password_reset_tokens")

    _drop_base_indexes("email_verification_tokens")
    op.drop_table("email_verification_tokens")

    op.drop_index("ix_refresh_tokens_user_revoked", table_name="refresh_tokens")
    _drop_base_indexes("refresh_tokens")
    op.drop_table("refresh_tokens")

    op.drop_table("user_roles")

    _drop_base_indexes("roles")
    op.drop_table("roles")

    op.drop_index("ix_users_status_created", table_name="users")
    op.drop_index("ix_users_email_lower", table_name="users")
    _drop_base_indexes("users")
    op.drop_table("users")
