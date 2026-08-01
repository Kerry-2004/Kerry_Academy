from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import Category, Course
from .serializers import CategorySerializer, CourseDetailSerializer, CourseListSerializer


class CategoryListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer
    queryset = Category.objects.all()


class CourseListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CourseListSerializer

    def get_queryset(self):
        queryset = Course.objects.filter(is_published=True).select_related("category", "instructor")
        category_slug = self.request.query_params.get("category")
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        return queryset


class CourseDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = CourseDetailSerializer
    lookup_field = "slug"
    queryset = Course.objects.filter(is_published=True).prefetch_related("modules__lessons")
