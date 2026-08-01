import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.courses.models import Answer, Course, Lesson, Module, Question
from apps.enrollments.models import Enrollment, Progress


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def student(db):
    return User.objects.create_user(email="student@example.com", password="Sup3rSecret!42")


@pytest.mark.django_db
def test_my_enrollments_requires_authentication(api_client):
    response = api_client.get(reverse("my-enrollments"))
    assert response.status_code == 401


@pytest.mark.django_db
def test_my_enrollments_returns_only_current_user_enrollments(api_client, student):
    other_student = User.objects.create_user(email="other@example.com", password="Sup3rSecret!42")
    course_a = Course.objects.create(title="Formation A", slug="formation-a", is_published=True)
    course_b = Course.objects.create(title="Formation B", slug="formation-b", is_published=True)
    Enrollment.objects.create(user=student, course=course_a, status=Enrollment.Status.ACTIVE)
    Enrollment.objects.create(user=other_student, course=course_b, status=Enrollment.Status.ACTIVE)

    api_client.force_authenticate(user=student)
    response = api_client.get(reverse("my-enrollments"))

    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["course"]["title"] == "Formation A"


@pytest.mark.django_db
def test_course_progress_requires_enrollment(api_client, student):
    course = Course.objects.create(title="Formation A", slug="formation-a", is_published=True)

    api_client.force_authenticate(user=student)
    response = api_client.get(reverse("course-progress", kwargs={"slug": course.slug}))

    assert response.status_code == 404


@pytest.mark.django_db
def test_course_progress_reports_completed_lessons(api_client, student):
    course = Course.objects.create(title="Formation A", slug="formation-a", is_published=True)
    module = Module.objects.create(course=course, title="Module 1", order=1)
    lesson_1 = Lesson.objects.create(module=module, title="Leçon 1", order=1)
    Lesson.objects.create(module=module, title="Leçon 2", order=2)
    enrollment = Enrollment.objects.create(user=student, course=course, status=Enrollment.Status.ACTIVE)
    Progress.objects.create(enrollment=enrollment, lesson=lesson_1, completed_at="2026-01-01T00:00:00Z")

    api_client.force_authenticate(user=student)
    response = api_client.get(reverse("course-progress", kwargs={"slug": course.slug}))

    assert response.status_code == 200
    assert response.data["progress_percent"] == 50
    assert response.data["modules"][0]["completed_count"] == 1
    assert response.data["modules"][0]["total_count"] == 2


@pytest.mark.django_db
def test_complete_lesson_marks_progress(api_client, student):
    course = Course.objects.create(title="Formation A", slug="formation-a", is_published=True)
    module = Module.objects.create(course=course, title="Module 1", order=1)
    lesson = Lesson.objects.create(module=module, title="Leçon 1", order=1)
    Enrollment.objects.create(user=student, course=course, status=Enrollment.Status.ACTIVE)

    api_client.force_authenticate(user=student)
    response = api_client.post(reverse("complete-lesson", kwargs={"slug": course.slug, "lesson_id": lesson.id}))

    assert response.status_code == 200
    assert Progress.objects.filter(enrollment__user=student, lesson=lesson, completed_at__isnull=False).exists()


@pytest.mark.django_db
def test_complete_lesson_requires_enrollment(api_client, student):
    course = Course.objects.create(title="Formation A", slug="formation-a", is_published=True)
    module = Module.objects.create(course=course, title="Module 1", order=1)
    lesson = Lesson.objects.create(module=module, title="Leçon 1", order=1)

    api_client.force_authenticate(user=student)
    response = api_client.post(reverse("complete-lesson", kwargs={"slug": course.slug, "lesson_id": lesson.id}))

    assert response.status_code == 404


@pytest.mark.django_db
def test_locked_lesson_content_is_hidden_and_completion_forbidden(api_client, student):
    course = Course.objects.create(title="Formation A", slug="formation-a", is_published=True)
    module = Module.objects.create(course=course, title="Module 1", order=1)
    lesson_1 = Lesson.objects.create(module=module, title="Leçon 1", order=1, text_content="<p>Intro</p>")
    lesson_2 = Lesson.objects.create(module=module, title="Leçon 2", order=2, text_content="<p>Suite</p>")
    Enrollment.objects.create(user=student, course=course, status=Enrollment.Status.ACTIVE)

    api_client.force_authenticate(user=student)

    # Au départ : leçon 1 déverrouillée avec son contenu, leçon 2 verrouillée sans contenu.
    progress = api_client.get(reverse("course-progress", kwargs={"slug": course.slug}))
    lessons = progress.data["modules"][0]["lessons"]
    assert lessons[0]["is_locked"] is False
    assert lessons[0]["text_content"] == "<p>Intro</p>"
    assert lessons[1]["is_locked"] is True
    assert lessons[1]["text_content"] is None

    # Impossible de compléter la leçon 2 tant que la 1 n'est pas terminée.
    forbidden = api_client.post(
        reverse("complete-lesson", kwargs={"slug": course.slug, "lesson_id": lesson_2.id})
    )
    assert forbidden.status_code == 403

    # On termine la leçon 1 → la leçon 2 se déverrouille.
    api_client.post(reverse("complete-lesson", kwargs={"slug": course.slug, "lesson_id": lesson_1.id}))
    progress = api_client.get(reverse("course-progress", kwargs={"slug": course.slug}))
    lessons = progress.data["modules"][0]["lessons"]
    assert lessons[1]["is_locked"] is False
    assert lessons[1]["text_content"] == "<p>Suite</p>"

    now_ok = api_client.post(
        reverse("complete-lesson", kwargs={"slug": course.slug, "lesson_id": lesson_2.id})
    )
    assert now_ok.status_code == 200


@pytest.fixture
def quiz_setup(db, student):
    course = Course.objects.create(title="Formation A", slug="formation-a", is_published=True)
    module = Module.objects.create(course=course, title="Module 1", order=1)
    lesson = Lesson.objects.create(
        module=module, title="Quiz", order=1, content_type=Lesson.ContentType.QUIZ
    )
    Enrollment.objects.create(user=student, course=course, status=Enrollment.Status.ACTIVE)

    q1 = Question.objects.create(lesson=lesson, text="1 + 1 ?", order=1)
    q1_good = Answer.objects.create(question=q1, text="2", is_correct=True)
    Answer.objects.create(question=q1, text="3", is_correct=False)

    q2 = Question.objects.create(lesson=lesson, text="Capitale d'Haïti ?", order=2)
    q2_good = Answer.objects.create(question=q2, text="Port-au-Prince", is_correct=True)
    q2_bad = Answer.objects.create(question=q2, text="Paris", is_correct=False)

    return {
        "course": course,
        "lesson": lesson,
        "q1": q1,
        "q1_good": q1_good,
        "q2": q2,
        "q2_good": q2_good,
        "q2_bad": q2_bad,
    }


@pytest.mark.django_db
def test_submit_quiz_grades_and_saves_score(api_client, student, quiz_setup):
    api_client.force_authenticate(user=student)
    response = api_client.post(
        reverse(
            "submit-quiz",
            kwargs={"slug": quiz_setup["course"].slug, "lesson_id": quiz_setup["lesson"].id},
        ),
        {
            "answers": {
                str(quiz_setup["q1"].id): quiz_setup["q1_good"].id,
                str(quiz_setup["q2"].id): quiz_setup["q2_bad"].id,
            }
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.data["score"] == 1
    assert response.data["max_score"] == 2

    progress = Progress.objects.get(enrollment__user=student, lesson=quiz_setup["lesson"])
    assert progress.score == 1
    assert progress.max_score == 2
    assert progress.completed_at is not None


@pytest.mark.django_db
def test_submit_quiz_perfect_score(api_client, student, quiz_setup):
    api_client.force_authenticate(user=student)
    response = api_client.post(
        reverse(
            "submit-quiz",
            kwargs={"slug": quiz_setup["course"].slug, "lesson_id": quiz_setup["lesson"].id},
        ),
        {
            "answers": {
                str(quiz_setup["q1"].id): quiz_setup["q1_good"].id,
                str(quiz_setup["q2"].id): quiz_setup["q2_good"].id,
            }
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.data["score"] == 2
    # Ne révèle jamais la bonne réponse que par le champ correct_answer_id des résultats
    correct_ids = {r["correct_answer_id"] for r in response.data["results"]}
    assert quiz_setup["q1_good"].id in correct_ids


@pytest.mark.django_db
def test_submit_quiz_requires_enrollment(api_client, student):
    other = User.objects.create_user(email="other@example.com", password="Sup3rSecret!42")
    course = Course.objects.create(title="Formation B", slug="formation-b", is_published=True)
    module = Module.objects.create(course=course, title="Module 1", order=1)
    lesson = Lesson.objects.create(
        module=module, title="Quiz", order=1, content_type=Lesson.ContentType.QUIZ
    )
    Enrollment.objects.create(user=other, course=course, status=Enrollment.Status.ACTIVE)

    api_client.force_authenticate(user=student)
    response = api_client.post(
        reverse("submit-quiz", kwargs={"slug": course.slug, "lesson_id": lesson.id}),
        {"answers": {}},
        format="json",
    )

    assert response.status_code == 404
