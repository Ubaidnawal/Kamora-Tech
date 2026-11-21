from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _create_base_indexes(table_name: str) -> None:
    op.create_index(f"ix_{table_name}_id", table_name, ["id"])
    op.create_index(f"ix_{table_name}_created_at", table_name, ["created_at"])


def _drop_base_indexes(table_name: str) -> None:
    op.drop_index(f"ix_{table_name}_created_at", table_name=table_name)
    op.drop_index(f"ix_{table_name}_id", table_name=table_name)


def upgrade() -> None:
    op.create_table(
        "product_reviews",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("product_id", sa.String(length=36), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rating", sa.SmallInteger(), nullable=False),
        sa.Column("review_text", sa.Text(), nullable=True),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="ck_product_reviews_rating_range"),
        sa.UniqueConstraint("product_id", "user_id", name="uq_product_reviews_product_user"),
    )
    _create_base_indexes("product_reviews")
    op.create_index("ix_product_reviews_product_created", "product_reviews", ["product_id", "created_at"])
    op.create_index("ix_product_reviews_product_rating", "product_reviews", ["product_id", "rating"])


def downgrade() -> None:
    op.drop_index("ix_product_reviews_product_rating", table_name="product_reviews")
    op.drop_index("ix_product_reviews_product_created", table_name="product_reviews")
    _drop_base_indexes("product_reviews")
    op.drop_table("product_reviews")
