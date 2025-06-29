# Generated manually for read receipt performance optimization

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat_svc', '0001_initial'),
    ]

    operations = [
        # Add composite index for efficient read receipt lookups
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_readreceipt_message_user ON chat_svc_readreceipt(message_id, user_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_readreceipt_message_user;"
        ),
        
        # Add index for timestamp-based queries
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_readreceipt_timestamp ON chat_svc_readreceipt(timestamp DESC);",
            reverse_sql="DROP INDEX IF EXISTS idx_readreceipt_timestamp;"
        ),
        
        # Add index for thread-based read receipt queries
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_message_thread_sender ON chat_svc_message(thread_id, sender_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_message_thread_sender;"
        ),
        
        # Add index for efficient unread message counting
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_message_created_at ON chat_svc_message(created_at DESC);",
            reverse_sql="DROP INDEX IF EXISTS idx_message_created_at;"
        ),
    ]