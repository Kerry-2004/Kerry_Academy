from django.urls import path

from .views import (
    ApprovedTestimonialsView,
    CreateTestimonialView,
    HomeContentView,
    MyTestimonialsView,
)

urlpatterns = [
    path("home/", HomeContentView.as_view(), name="home-content"),
    path("testimonials/", ApprovedTestimonialsView.as_view(), name="testimonials"),
    path("testimonials/mine/", MyTestimonialsView.as_view(), name="my-testimonials"),
    path("testimonials/submit/", CreateTestimonialView.as_view(), name="submit-testimonial"),
]
