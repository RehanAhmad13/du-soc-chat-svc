from django.db import migrations
import chat_svc.chat.encrypted_fields


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0004_device'),
    ]

    operations = [
        migrations.AlterField(
            model_name='message',
            name='content',
            field=chat_svc.chat.encrypted_fields.EncryptedTextField(blank=True),
        ),
        migrations.AlterField(
            model_name='structuredreply',
            name='answer',
            field=chat_svc.chat.encrypted_fields.EncryptedTextField(),
        ),
    ]
