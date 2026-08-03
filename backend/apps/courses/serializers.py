from rest_framework import serializers

from .models import Category, Course, Lesson, Module


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ["id", "title", "order", "content_type", "is_free_preview"]


class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ["id", "title", "order", "lessons"]


class CourseListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    instructor_name = serializers.CharField(source="instructor.get_full_name", read_only=True)

    class Meta:
        model = Course
        fields = [
            "id", "title", "slug", "short_description", "description",
            "category", "instructor_name", "price", "thumbnail",
        ]


class CourseDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    instructor_name = serializers.CharField(source="instructor.get_full_name", read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            "id", "title", "slug", "short_description", "description", "long_description",
            "category", "instructor_name", "price", "thumbnail", "modules",
        ]
