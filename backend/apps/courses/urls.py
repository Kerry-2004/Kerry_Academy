from django.urls import path

from .views import CategoryListView, CourseDetailView, CourseListView

urlpatterns = [
    path("", CourseListView.as_view(), name="course-list"),
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("<slug:slug>/", CourseDetailView.as_view(), name="course-detail"),
]
