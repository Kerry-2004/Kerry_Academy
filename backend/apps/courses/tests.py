import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.courses.models import Answer, Category, Course, Lesson, Module, Question


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
def test_course_list_only_returns_published_courses(api_client):
    Course.objects.create(title="Publiée", slug="publiee", is_published=True)
    Course.objects.create(title="Brouillon", slug="brouillon", is_published=False)

    response = api_client.get(reverse("course-list"))

    assert response.status_code == 200
    titles = [c["title"] for c in response.data]
    assert titles == ["Publiée"]


@pytest.mark.django_db
def test_unpublished_course_detail_is_not_found(api_client):
    Course.objects.create(title="Brouillon", slug="brouillon", is_published=False)

    response = api_client.get(reverse("course-detail", kwargs={"slug": "brouillon"}))

    assert response.status_code == 404


@pytest.mark.django_db
def test_category_list_returns_all_categories(api_client):
    Category.objects.create(name="Web-Design", slug="web-design")
    Category.objects.create(name="Graphic Design", slug="graphic-design")

    response = api_client.get(reverse("category-list"))

    assert response.status_code == 200
    names = {c["name"] for c in response.data}
    assert names == {"Web-Design", "Graphic Design"}


@pytest.mark.django_db
def test_course_list_filters_by_category_slug(api_client):
    web_design = Category.objects.create(name="Web-Design", slug="web-design")
    editing = Category.objects.create(name="Editing", slug="editing")
    Course.objects.create(title="Devenir Web Designer", slug="web-designer", is_published=True, category=web_design)
    Course.objects.create(title="Adobe Premiere Pro", slug="premiere-pro", is_published=True, category=editing)

    response = api_client.get(reverse("course-list"), {"category": "web-design"})

    assert response.status_code == 200
    titles = [c["title"] for c in response.data]
    assert titles == ["Devenir Web Designer"]


@pytest.mark.django_db
def test_lesson_supports_all_content_types():
    course = Course.objects.create(title="Formation", slug="formation")
    module = Module.objects.create(course=course, title="Module 1")

    for content_type in [Lesson.ContentType.TEXT, Lesson.ContentType.VIDEO, Lesson.ContentType.QUIZ, Lesson.ContentType.FILE]:
        lesson = Lesson.objects.create(module=module, title=f"Leçon {content_type}", content_type=content_type)
        assert lesson.content_type == content_type


@pytest.mark.django_db
def test_quiz_lesson_can_have_questions_and_answers():
    course = Course.objects.create(title="Formation", slug="formation")
    module = Module.objects.create(course=course, title="Module 1")
    lesson = Lesson.objects.create(module=module, title="Quiz final", content_type=Lesson.ContentType.QUIZ)

    question = Question.objects.create(lesson=lesson, text="2 + 2 = ?", order=1)
    Answer.objects.create(question=question, text="4", is_correct=True)
    Answer.objects.create(question=question, text="5", is_correct=False)

    assert lesson.questions.count() == 1
    assert question.answers.count() == 2
    assert question.answers.get(is_correct=True).text == "4"
