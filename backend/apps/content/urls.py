from django.urls import path

from .views import (
    ApprovedTestimonialsView,
    CreateEbookOrderView,
    CreateTestimonialView,
    EbookDownloadView,
    EbookListView,
    HomeContentView,
    MyEbookOrdersView,
    MyTestimonialsView,
)

urlpatterns = [
    path("home/", HomeContentView.as_view(), name="home-content"),
    path("testimonials/", ApprovedTestimonialsView.as_view(), name="testimonials"),
    path("testimonials/mine/", MyTestimonialsView.as_view(), name="my-testimonials"),
    path("testimonials/submit/", CreateTestimonialView.as_view(), name="submit-testimonial"),
    # Boutique d'ebooks
    path("ebooks/", EbookListView.as_view(), name="ebooks"),
    path("ebooks/orders/mine/", MyEbookOrdersView.as_view(), name="my-ebook-orders"),
    path("ebooks/<int:pk>/order/", CreateEbookOrderView.as_view(), name="order-ebook"),
    path("ebooks/<int:pk>/download/", EbookDownloadView.as_view(), name="download-ebook"),
]
