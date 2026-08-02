from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.courses.models import Lesson
from apps.enrollments.models import Enrollment, Progress

from .models import HomeContent, Testimonial
from .serializers import (
    MyTestimonialSerializer,
    TestimonialCreateSerializer,
    TestimonialPublicSerializer,
)


def has_completed_course(user, course):
    """Vrai si l'étudiant a terminé la formation (statut « Terminée » ou 100 %
    des leçons complétées)."""
    enrollment = Enrollment.objects.filter(user=user, course=course).first()
    if enrollment is None:
        return False
    if enrollment.status == Enrollment.Status.COMPLETED:
        return True
    total = Lesson.objects.filter(module__course=course).count()
    if total == 0:
        return False
    completed = Progress.objects.filter(
        enrollment=enrollment, lesson__module__course=course, completed_at__isnull=False
    ).count()
    return completed >= total


class HomeContentView(APIView):
    """Contenu public de la page d'accueil (vidéo + image de couverture)."""

    permission_classes = [AllowAny]

    def get(self, request):
        content = HomeContent.load()
        return Response(
            {
                "hero_video": (
                    request.build_absolute_uri(content.hero_video.url)
                    if content.hero_video
                    else None
                ),
                "hero_poster": (
                    request.build_absolute_uri(content.hero_poster.url)
                    if content.hero_poster
                    else None
                ),
            }
        )


class ApprovedTestimonialsView(generics.ListAPIView):
    """Avis approuvés, affichés publiquement sur la page d'accueil."""

    permission_classes = [AllowAny]
    serializer_class = TestimonialPublicSerializer

    def get_queryset(self):
        return Testimonial.objects.filter(
            status=Testimonial.Status.APPROVED
        ).select_related("course")


class MyTestimonialsView(generics.ListAPIView):
    """Les avis de l'étudiant connecté, avec leur statut de modération."""

    permission_classes = [IsAuthenticated]
    serializer_class = MyTestimonialSerializer

    def get_queryset(self):
        return Testimonial.objects.filter(user=self.request.user).select_related("course")


class CreateTestimonialView(APIView):
    """Soumission d'un avis (réservé à qui a terminé la formation). L'avis part
    en modération : il n'est jamais publié automatiquement."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TestimonialCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.validated_data["course"]

        if not has_completed_course(request.user, course):
            return Response(
                {"detail": "Vous devez d'abord terminer cette formation pour laisser un avis."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if Testimonial.objects.filter(user=request.user, course=course).exists():
            return Response(
                {"detail": "Vous avez déjà laissé un avis pour cette formation."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        testimonial = Testimonial.objects.create(
            user=request.user,
            course=course,
            author_name=request.user.get_full_name(),
            rating=serializer.validated_data["rating"],
            comment=serializer.validated_data["comment"],
            status=Testimonial.Status.PENDING,
        )
        return Response(
            MyTestimonialSerializer(testimonial).data, status=status.HTTP_201_CREATED
        )
