from rest_framework import serializers

from .models import Ebook, EbookOrder, Testimonial


class TestimonialPublicSerializer(serializers.ModelSerializer):
    """Ce qui est exposé publiquement sur la page d'accueil (avis approuvés)."""

    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Testimonial
        fields = ["id", "author_name", "rating", "comment", "course_title", "created_at"]


class MyTestimonialSerializer(serializers.ModelSerializer):
    """Vue « mes avis » côté étudiant : inclut le statut de modération."""

    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Testimonial
        fields = [
            "id", "course", "course_title", "rating", "comment", "status", "created_at",
        ]
        read_only_fields = ["status"]


class TestimonialCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ["course", "rating", "comment"]

    def validate_comment(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Votre avis doit faire au moins 10 caractères.")
        return value.strip()


class EbookSerializer(serializers.ModelSerializer):
    """Catalogue public : jamais le fichier, seulement la vitrine."""

    cover = serializers.SerializerMethodField()

    class Meta:
        model = Ebook
        fields = ["id", "title", "slug", "author", "description", "cover", "price"]

    def get_cover(self, obj):
        if not obj.cover:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.cover.url) if request else obj.cover.url


class MyEbookOrderSerializer(serializers.ModelSerializer):
    ebook_id = serializers.IntegerField(source="ebook.id", read_only=True)
    ebook_title = serializers.CharField(source="ebook.title", read_only=True)
    ebook_author = serializers.CharField(source="ebook.author", read_only=True)
    ebook_cover = serializers.SerializerMethodField()

    class Meta:
        model = EbookOrder
        fields = [
            "id", "reference", "status", "created_at",
            "ebook_id", "ebook_title", "ebook_author", "ebook_cover",
        ]

    def get_ebook_cover(self, obj):
        if not obj.ebook.cover:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.ebook.cover.url) if request else obj.ebook.cover.url
