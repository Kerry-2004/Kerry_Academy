import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def student(db):
    user = User.objects.create_user(email="student@example.com", password="Sup3rSecret!42")
    from apps.accounts.models import Profile
    Profile.objects.create(user=user)
    return user


@pytest.mark.django_db
def test_register_creates_user_and_returns_access_token(api_client):
    response = api_client.post(
        reverse("auth-register"),
        {"email": "new@example.com", "password": "Sup3rSecret!42", "first_name": "Kerry"},
    )

    assert response.status_code == 201
    assert "access" in response.data
    assert response.data["user"]["email"] == "new@example.com"
    assert response.data["user"]["role"] == "student"
    assert "refresh_token" in response.cookies
    assert response.cookies["refresh_token"]["httponly"] is True
    assert User.objects.filter(email="new@example.com").exists()


@pytest.mark.django_db
def test_login_with_valid_credentials_returns_access_token(api_client, student):
    response = api_client.post(
        reverse("auth-login"),
        {"email": "student@example.com", "password": "Sup3rSecret!42"},
    )

    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh_token" in response.cookies


@pytest.mark.django_db
def test_login_with_invalid_credentials_is_rejected(api_client, student):
    response = api_client.post(
        reverse("auth-login"),
        {"email": "student@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401


@pytest.mark.django_db
def test_me_requires_authentication(api_client):
    response = api_client.get(reverse("auth-me"))
    assert response.status_code == 401


@pytest.mark.django_db
def test_me_returns_current_user_when_authenticated(api_client, student):
    login = api_client.post(
        reverse("auth-login"),
        {"email": "student@example.com", "password": "Sup3rSecret!42"},
    )
    access = login.data["access"]

    response = api_client.get(reverse("auth-me"), HTTP_AUTHORIZATION=f"Bearer {access}")

    assert response.status_code == 200
    assert response.data["email"] == "student@example.com"


@pytest.mark.django_db
def test_refresh_without_cookie_is_rejected(api_client):
    response = api_client.post(reverse("auth-refresh"))
    assert response.status_code == 401


@pytest.mark.django_db
def test_refresh_rotates_cookie_and_returns_new_access_token(api_client, student):
    login = api_client.post(
        reverse("auth-login"),
        {"email": "student@example.com", "password": "Sup3rSecret!42"},
    )
    old_refresh_cookie = login.cookies["refresh_token"].value
    api_client.cookies["refresh_token"] = old_refresh_cookie

    response = api_client.post(reverse("auth-refresh"))

    assert response.status_code == 200
    assert "access" in response.data
    assert response.cookies["refresh_token"].value != old_refresh_cookie


@pytest.mark.django_db
def test_logout_blacklists_refresh_token(api_client, student):
    login = api_client.post(
        reverse("auth-login"),
        {"email": "student@example.com", "password": "Sup3rSecret!42"},
    )
    access = login.data["access"]
    api_client.cookies["refresh_token"] = login.cookies["refresh_token"].value

    logout = api_client.post(reverse("auth-logout"), HTTP_AUTHORIZATION=f"Bearer {access}")
    assert logout.status_code == 204

    refresh_after_logout = api_client.post(reverse("auth-refresh"))
    assert refresh_after_logout.status_code == 401


@pytest.mark.django_db
def test_login_is_throttled_after_repeated_attempts(api_client, student, settings):
    settings.REST_FRAMEWORK = {
        **settings.REST_FRAMEWORK,
        "DEFAULT_THROTTLE_RATES": {"auth-login": "3/min", "auth-register": "5/min"},
    }

    for _ in range(3):
        api_client.post(
            reverse("auth-login"),
            {"email": "student@example.com", "password": "wrong-password"},
        )

    response = api_client.post(
        reverse("auth-login"),
        {"email": "student@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 429
