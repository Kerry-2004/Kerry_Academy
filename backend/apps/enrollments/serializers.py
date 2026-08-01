from rest_framework import serializers

from apps.courses.serializers import CourseListSerializer

from .models import Enrollment


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ["id", "course", "status", "enrolled_at"]
