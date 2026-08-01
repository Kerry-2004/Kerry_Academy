from django.conf import settings
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import RegisterSerializer, UserSerializer

REFRESH_COOKIE_KWARGS = {
    "httponly": True,
    # SameSite=None impose Secure=True côté navigateur ; on force donc secure
    # dès que SameSite n'est pas Lax/Strict.
    "secure": (not settings.DEBUG) or settings.REFRESH_COOKIE_SAMESITE.lower() == "none",
    "samesite": settings.REFRESH_COOKIE_SAMESITE,
    "path": "/api/auth/",
}


def _set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        settings.REFRESH_TOKEN_COOKIE,
        str(refresh_token),
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        **REFRESH_COOKIE_KWARGS,
    )


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    throttle_scope = "auth-register"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        response = Response(
            {"access": str(refresh.access_token), "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
        _set_refresh_cookie(response, refresh)
        return response


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth-login"

    def post(self, request, *args, **kwargs):
        serializer = TokenObtainPairSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except (ValidationError, TokenError):
            return Response(
                {"detail": "Email ou mot de passe invalide."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        access = serializer.validated_data["access"]
        refresh = serializer.validated_data["refresh"]

        response = Response(
            {"access": str(access), "user": UserSerializer(serializer.user).data},
            status=status.HTTP_200_OK,
        )
        _set_refresh_cookie(response, refresh)
        return response


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        raw_refresh = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE)
        if not raw_refresh:
            return Response({"detail": "Refresh token manquant."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            refresh = RefreshToken(raw_refresh)
            access = refresh.access_token
            user_id = refresh.payload.get("user_id")
            if settings.SIMPLE_JWT.get("BLACKLIST_AFTER_ROTATION"):
                refresh.blacklist()
        except TokenError:
            return Response({"detail": "Refresh token invalide ou expiré."}, status=status.HTTP_401_UNAUTHORIZED)

        # Émet un nouveau refresh token (rotation) pour le même utilisateur.
        user = User.objects.filter(pk=user_id, is_active=True).first()
        if user is None:
            return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_401_UNAUTHORIZED)

        new_refresh = RefreshToken.for_user(user)
        response = Response({"access": str(access)}, status=status.HTTP_200_OK)
        _set_refresh_cookie(response, new_refresh)
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        raw_refresh = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE)
        if raw_refresh:
            try:
                RefreshToken(raw_refresh).blacklist()
            except TokenError:
                pass

        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(settings.REFRESH_TOKEN_COOKIE, path="/api/auth/")
        return response


class MeView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
