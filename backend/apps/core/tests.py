import pytest
from rest_framework.test import APIRequestFactory

from apps.accounts.models import User
from apps.core.permissions import IsAdmin, IsInstructor, IsStudent


@pytest.fixture
def factory():
    return APIRequestFactory()


@pytest.mark.django_db
@pytest.mark.parametrize(
    "role,permission_class,expected",
    [
        (User.Role.ADMIN, IsAdmin, True),
        (User.Role.INSTRUCTOR, IsAdmin, False),
        (User.Role.STUDENT, IsAdmin, False),
        (User.Role.INSTRUCTOR, IsInstructor, True),
        (User.Role.ADMIN, IsInstructor, False),
        (User.Role.STUDENT, IsStudent, True),
        (User.Role.ADMIN, IsStudent, False),
    ],
)
def test_role_permission_grants_only_matching_role(factory, role, permission_class, expected):
    user = User.objects.create_user(email=f"{role}@example.com", password="Sup3rSecret!42", role=role)
    request = factory.get("/")
    request.user = user

    assert permission_class().has_permission(request, None) is expected


def test_role_permission_denies_anonymous_user(factory):
    from django.contrib.auth.models import AnonymousUser

    request = factory.get("/")
    request.user = AnonymousUser()

    assert IsStudent().has_permission(request, None) is False
