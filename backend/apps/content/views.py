import os
import secrets

from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.courses.models import Lesson
from apps.enrollments.models import Enrollment, Progress

from .models import Ebook, EbookOrder, HomeContent, PaymentSettings, Testimonial
from .serializers import (
    EbookSerializer,
    MyEbookOrderSerializer,
    MyTestimonialSerializer,
    PaymentSettingsSerializer,
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


class PaymentSettingsView(APIView):
    """Instructions de paiement publiques (MonCash / Natcash / WhatsApp)."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(PaymentSettingsSerializer(PaymentSettings.load()).data)


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


def _generate_order_reference():
    """Référence courte et unique pour une commande (ex. EB-1A2B3C)."""
    while True:
        reference = "EB-" + secrets.token_hex(3).upper()
        if not EbookOrder.objects.filter(reference=reference).exists():
            return reference


class EbookListView(generics.ListAPIView):
    """Catalogue public des ebooks en vente (page d'accueil)."""

    permission_classes = [AllowAny]
    serializer_class = EbookSerializer

    def get_queryset(self):
        return Ebook.objects.filter(is_published=True)

    def get_serializer_context(self):
        return {"request": self.request}


class CreateEbookOrderView(APIView):
    """Crée (ou récupère) la commande d'un ebook pour l'acheteur connecté et
    renvoie les instructions de paiement manuel (WhatsApp / email)."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        ebook = get_object_or_404(Ebook, pk=pk, is_published=True)
        order, created = EbookOrder.objects.get_or_create(
            user=request.user,
            ebook=ebook,
            defaults={"reference": _generate_order_reference()},
        )
        home = HomeContent.load()
        return Response(
            {
                "reference": order.reference,
                "status": order.status,
                "ebook_title": ebook.title,
                "price": str(ebook.price),
                "whatsapp_number": home.whatsapp_number,
                "contact_email": home.contact_email,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class MyEbookOrdersView(generics.ListAPIView):
    """Les commandes d'ebooks de l'acheteur connecté (avec leur statut)."""

    permission_classes = [IsAuthenticated]
    serializer_class = MyEbookOrderSerializer

    def get_queryset(self):
        return EbookOrder.objects.filter(user=self.request.user).select_related("ebook")

    def get_serializer_context(self):
        return {"request": self.request}


class EbookDownloadView(APIView):
    """Téléchargement du fichier ebook — uniquement si l'achat est confirmé
    (statut « payé »). Le fichier privé n'est jamais accessible autrement."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        ebook = get_object_or_404(Ebook, pk=pk)
        is_paid = EbookOrder.objects.filter(
            user=request.user, ebook=ebook, status=EbookOrder.Status.PAID
        ).exists()
        if not is_paid:
            return Response(
                {"detail": "Achat non confirmé : téléchargement indisponible."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not ebook.file:
            return Response(
                {"detail": "Fichier indisponible."}, status=status.HTTP_404_NOT_FOUND
            )
        return FileResponse(
            ebook.file.open("rb"),
            as_attachment=True,
            filename=os.path.basename(ebook.file.name),
        )
