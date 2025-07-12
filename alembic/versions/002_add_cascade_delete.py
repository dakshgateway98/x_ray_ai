"""Add cascade delete to XRay foreign key

Revision ID: 002
Revises: 001
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the existing foreign key constraint
    op.drop_constraint('xrays_patient_id_fkey', 'xrays', type_='foreignkey')
    
    # Add the foreign key constraint with CASCADE DELETE
    op.create_foreign_key(
        'xrays_patient_id_fkey',
        'xrays', 'patients',
        ['patient_id'], ['patient_id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # Drop the cascade foreign key constraint
    op.drop_constraint('xrays_patient_id_fkey', 'xrays', type_='foreignkey')
    
    # Add back the original foreign key constraint without CASCADE
    op.create_foreign_key(
        'xrays_patient_id_fkey',
        'xrays', 'patients',
        ['patient_id'], ['patient_id']
    ) 