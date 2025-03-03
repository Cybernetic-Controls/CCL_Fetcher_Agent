"""create_emails_table

Revision ID: c282285ce42c
Revises: 1460c57cef49
Create Date: 2025-02-25 20:19:18.783489

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c282285ce42c'
down_revision: Union[str, None] = '1460c57cef49'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
