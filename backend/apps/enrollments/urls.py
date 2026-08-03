from django.urls import path

from .views import (
    CompleteLessonView,
    CourseProgressView,
    EnrollView,
    MyEnrollmentsView,
    SubmitQuizView,
)

urlpatterns = [
    path("me/", MyEnrollmentsView.as_view(), name="my-enrollments"),
    path("<slug:slug>/enroll/", EnrollView.as_view(), name="enroll"),
    path("<slug:slug>/progress/", CourseProgressView.as_view(), name="course-progress"),
    path("<slug:slug>/lessons/<int:lesson_id>/complete/", CompleteLessonView.as_view(), name="complete-lesson"),
    path(
        "<slug:slug>/lessons/<int:lesson_id>/quiz/submit/",
        SubmitQuizView.as_view(),
        name="submit-quiz",
    ),
]
