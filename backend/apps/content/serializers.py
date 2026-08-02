from rest_framework import serializers

from .models import Testimonial


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
