import django_ckeditor_5.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0003_lesson_file_lesson_text_content_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="course",
            name="short_description",
            field=models.CharField(
                blank=True,
                help_text="Résumé affiché sur la carte de la formation (1 à 2 phrases).",
                max_length=300,
                verbose_name="Description courte (carte)",
            ),
        ),
        migrations.AddField(
            model_name="course",
            name="long_description",
            field=django_ckeditor_5.fields.CKEditor5Field(
                blank=True, verbose_name="Présentation complète"
            ),
        ),
        migrations.AlterField(
            model_name="course",
            name="description",
            field=models.TextField(blank=True, verbose_name="Ancienne description (texte simple)"),
        ),
    ]
