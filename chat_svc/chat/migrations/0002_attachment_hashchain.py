from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='previous_hash',
            field=models.CharField(max_length=64, blank=True),
        ),
        migrations.AddField(
            model_name='message',
            name='hash',
            field=models.CharField(max_length=64, blank=True),
        ),
        migrations.CreateModel(
            name='Attachment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to='attachments/')),
                ('checksum', models.CharField(editable=False, blank=True, max_length=64)),
                ('message', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attachments', to='chat.message')),
            ],
        ),
    ]
