from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0002_ebooks_and_contacts"),
    ]

    operations = [
        migrations.CreateModel(
            name="PaymentSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("moncash_number", models.CharField(blank=True, default="+509 4780-8070", max_length=40, verbose_name="Numéro MonCash")),
                ("moncash_name", models.CharField(blank=True, default="Kerry Cherestal", max_length=120, verbose_name="Nom du compte MonCash")),
                ("natcash_number", models.CharField(blank=True, default="+509 4157-0822", max_length=40, verbose_name="Numéro Natcash")),
                ("natcash_name", models.CharField(blank=True, default="Kerry Cherestal", max_length=120, verbose_name="Nom du compte Natcash")),
                ("whatsapp_number", models.CharField(blank=True, default="+509 4780-8070", max_length=40, verbose_name="Numéro WhatsApp (envoi de la preuve)")),
                (
                    "instructions",
                    models.TextField(
                        blank=True,
                        default="Envoyez la preuve de paiement via WhatsApp. Dans un délai de moins d'1 h de temps, vous aurez accès à la formation complète.",
                        verbose_name="Message d'instructions",
                    ),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Paiement (instructions)",
                "verbose_name_plural": "Paiement (instructions)",
            },
        ),
    ]
