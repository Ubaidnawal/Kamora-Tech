from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _message_status_enum() -> sa.Enum:
    return sa.Enum("open", "answered", "closed", name="messagestatus", native_enum=False)


def _create_base_indexes(table_name: str) -> None:
    op.create_index(f"ix_{table_name}_id", table_name, ["id"])
    op.create_index(f"ix_{table_name}_created_at", table_name, ["created_at"])


def _drop_base_indexes(table_name: str) -> None:
    op.drop_index(f"ix_{table_name}_created_at", table_name=table_name)
    op.drop_index(f"ix_{table_name}_id", table_name=table_name)


def upgrade() -> None:
    op.create_table(
        "product_features",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("product_id", sa.String(length=36), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("feature_name", sa.String(length=200), nullable=False),
        sa.Column("feature_description", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    _create_base_indexes("product_features")
    op.create_index("ix_product_features_product_sort", "product_features", ["product_id", "sort_order"])

    op.create_table(
        "contact_messages",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("full_name", sa.String(length=160), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone_number", sa.String(length=32), nullable=True),
        sa.Column("subject", sa.String(length=200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", _message_status_enum(), nullable=False),
    )
    _create_base_indexes("contact_messages")
    op.create_index("ix_contact_messages_status", "contact_messages", ["status"])

    op.create_table(
        "project_inquiries",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("customer_name", sa.String(length=160), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone_number", sa.String(length=32), nullable=True),
        sa.Column("project_type", sa.String(length=120), nullable=False),
        sa.Column("project_budget", sa.String(length=120), nullable=True),
        sa.Column("project_description", sa.Text(), nullable=False),
        sa.Column("status", _message_status_enum(), nullable=False),
    )
    _create_base_indexes("project_inquiries")
    op.create_index("ix_project_inquiries_status", "project_inquiries", ["status"])


def downgrade() -> None:
    op.drop_index("ix_project_inquiries_status", table_name="project_inquiries")
    _drop_base_indexes("project_inquiries")
    op.drop_table("project_inquiries")

    op.drop_index("ix_contact_messages_status", table_name="contact_messages")
    _drop_base_indexes("contact_messages")
    op.drop_table("contact_messages")

    op.drop_index("ix_product_features_product_sort", table_name="product_features")
    _drop_base_indexes("product_features")
    op.drop_table("product_features")
