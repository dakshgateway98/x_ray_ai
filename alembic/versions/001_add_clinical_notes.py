"""Add clinical_notes to XRay model

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add clinical_notes column to xrays table
    op.add_column('xrays', sa.Column('clinical_notes', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove clinical_notes column from xrays table
    op.drop_column('xrays', 'clinical_notes') 