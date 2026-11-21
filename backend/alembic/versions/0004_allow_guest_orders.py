from collections.abc import Sequence

import sqlalchemy as sa

from alembic import context, op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("orders") as batch_op:
        batch_op.alter_column(
            "user_id",
            existing_type=sa.String(length=36),
            nullable=True,
        )


def downgrade() -> None:
    if context.is_offline_mode():
        return
    bind = op.get_bind()
    has_nulls = (
        bind.execute(sa.text("SELECT 1 FROM orders WHERE user_id IS NULL LIMIT 1")).first()
        is not None
    )
    if has_nulls:
        return
    with op.batch_alter_table("orders") as batch_op:
        batch_op.alter_column(
            "user_id",
            existing_type=sa.String(length=36),
            nullable=False,
        )
