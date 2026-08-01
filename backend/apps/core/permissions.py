from rest_framework.permissions import BasePermission


class HasRole(BasePermission):
    """Base class: subclass and set `role` to restrict access to one user role."""

    role = None

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == self.role)


class IsAdmin(HasRole):
    role = "admin"


class IsInstructor(HasRole):
    role = "instructor"


class IsStudent(HasRole):
    role = "student"


class IsAdminOrInstructor(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role in ("admin", "instructor"))
