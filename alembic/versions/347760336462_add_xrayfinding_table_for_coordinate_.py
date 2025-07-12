"""Add XRayFinding table for coordinate-based findings

Revision ID: 347760336462
Revises: 002
Create Date: 2025-07-06 07:57:04.737027

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '347760336462'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'xray_findings',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('xray_id', sa.Integer(), sa.ForeignKey('xrays.id', ondelete='CASCADE'), nullable=False),
        sa.Column('diagnosis', sa.Text(), nullable=False),
        sa.Column('x1', sa.Float(), nullable=False),
        sa.Column('y1', sa.Float(), nullable=False),
        sa.Column('x2', sa.Float(), nullable=False),
        sa.Column('y2', sa.Float(), nullable=False),
        sa.Column('confidence', sa.String(), nullable=True, server_default='medium'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )


def downgrade() -> None:
    op.drop_table('xray_findings')
