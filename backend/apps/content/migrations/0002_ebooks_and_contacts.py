import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="homecontent",
            name="whatsapp_number",
            field=models.CharField(
                blank=True,
                max_length=30,
                verbose_name="Numéro WhatsApp (format international, ex. +50912345678)",
            ),
        ),
        migrations.AddField(
            model_name="homecontent",
            name="contact_email",
            field=models.EmailField(blank=True, max_length=254, verbose_name="Email de contact"),
        ),
        migrations.CreateModel(
            name="Ebook",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200, verbose_name="Titre")),
                ("slug", models.SlugField(max_length=220, unique=True)),
                ("author", models.CharField(blank=True, max_length=200, verbose_name="Auteur")),
                ("description", models.TextField(blank=True, verbose_name="Description")),
                ("cover", models.ImageField(blank=True, null=True, upload_to="ebooks/covers/", verbose_name="Couverture")),
                ("file", models.FileField(upload_to="ebooks/files/", verbose_name="Fichier de l'ebook (privé — PDF/EPUB)")),
                ("price", models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name="Prix")),
                ("is_published", models.BooleanField(default=True, verbose_name="Publié")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="EbookOrder",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reference", models.CharField(max_length=20, unique=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "En attente de paiement"),
                            ("paid", "Payé"),
                            ("cancelled", "Annulé"),
                        ],
                        default="pending",
                        max_length=10,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("confirmed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "ebook",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="orders",
                        to="content.ebook",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ebook_orders",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
                "unique_together": {("user", "ebook")},
            },
        ),
    ]
