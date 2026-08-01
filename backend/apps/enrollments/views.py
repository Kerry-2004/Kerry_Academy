from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.courses.models import Course, Lesson

from .models import Enrollment, Progress
from .serializers import EnrollmentSerializer


def get_ordered_lessons(course):
    """Toutes les leçons du cours, aplaties dans l'ordre pédagogique (module puis leçon)."""
    ordered = []
    for module in course.modules.all():
        for lesson in module.lessons.all():
            ordered.append(lesson)
    return ordered


def is_lesson_locked(enrollment, course, lesson):
    """Une leçon est verrouillée tant que la leçon précédente n'est pas terminée."""
    ordered = get_ordered_lessons(course)
    index = next((i for i, l in enumerate(ordered) if l.id == lesson.id), None)
    if index is None or index == 0:
        return False
    previous = ordered[index - 1]
    return not Progress.objects.filter(
        enrollment=enrollment, lesson=previous, completed_at__isnull=False
    ).exists()


class MyEnrollmentsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        return Enrollment.objects.filter(user=self.request.user).select_related(
            "course", "course__category", "course__instructor"
        )


class CourseProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        course = get_object_or_404(Course, slug=slug, is_published=True)
        enrollment = get_object_or_404(Enrollment, user=request.user, course=course)

        progress_by_lesson = {p.lesson_id: p for p in Progress.objects.filter(enrollment=enrollment)}
        completed_lesson_ids = {
            lesson_id for lesson_id, p in progress_by_lesson.items() if p.completed_at is not None
        }

        modules_data = []
        total_lessons = 0
        completed_lessons = 0
        # La leçon N est déverrouillée uniquement si la leçon N-1 est terminée.
        previous_completed = True
        for module in course.modules.all().prefetch_related("lessons"):
            lessons_data = []
            for lesson in module.lessons.all():
                is_completed = lesson.id in completed_lesson_ids
                is_locked = not previous_completed
                total_lessons += 1
                completed_lessons += 1 if is_completed else 0

                lesson_progress = progress_by_lesson.get(lesson.id)
                quiz_result = None
                if (
                    lesson.content_type == Lesson.ContentType.QUIZ
                    and lesson_progress is not None
                    and lesson_progress.score is not None
                ):
                    quiz_result = {
                        "score": lesson_progress.score,
                        "max_score": lesson_progress.max_score,
                    }

                # Le contenu d'une leçon verrouillée n'est jamais renvoyé au client.
                lessons_data.append(
                    {
                        "id": lesson.id,
                        "title": lesson.title,
                        "order": lesson.order,
                        "content_type": lesson.content_type,
                        "is_completed": is_completed,
                        "is_locked": is_locked,
                        "video": (
                            request.build_absolute_uri(lesson.video.url)
                            if lesson.video and not is_locked
                            else None
                        ),
                        "text_content": (lesson.text_content or None) if not is_locked else None,
                        "file": (
                            request.build_absolute_uri(lesson.file.url)
                            if lesson.file and not is_locked
                            else None
                        ),
                        "questions": [
                            {
                                "id": question.id,
                                "text": question.text,
                                "answers": [
                                    {"id": answer.id, "text": answer.text}
                                    for answer in question.answers.all()
                                ],
                            }
                            for question in lesson.questions.prefetch_related("answers").all()
                        ]
                        if (lesson.content_type == Lesson.ContentType.QUIZ and not is_locked)
                        else [],
                        "quiz_result": quiz_result,
                    }
                )

                previous_completed = is_completed
            modules_data.append(
                {
                    "id": module.id,
                    "title": module.title,
                    "order": module.order,
                    "lessons": lessons_data,
                    "completed_count": sum(1 for l in lessons_data if l["is_completed"]),
                    "total_count": len(lessons_data),
                }
            )

        progress_percent = round((completed_lessons / total_lessons) * 100) if total_lessons else 0

        return Response(
            {
                "course": {
                    "id": course.id,
                    "title": course.title,
                    "slug": course.slug,
                    "description": course.description,
                    "thumbnail": request.build_absolute_uri(course.thumbnail.url) if course.thumbnail else None,
                },
                "status": enrollment.status,
                "progress_percent": progress_percent,
                "modules": modules_data,
            }
        )


class CompleteLessonView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug, lesson_id):
        course = get_object_or_404(Course, slug=slug, is_published=True)
        enrollment = get_object_or_404(Enrollment, user=request.user, course=course)
        lesson = get_object_or_404(Lesson, id=lesson_id, module__course=course)

        if is_lesson_locked(enrollment, course, lesson):
            return Response(
                {"detail": "Terminez d'abord la leçon précédente."},
                status=status.HTTP_403_FORBIDDEN,
            )

        progress, _ = Progress.objects.get_or_create(enrollment=enrollment, lesson=lesson)
        progress.completed_at = timezone.now()
        progress.save()

        return Response({"lesson_id": lesson.id, "completed": True})


class SubmitQuizView(APIView):
    """Corrige un quiz côté serveur (les bonnes réponses ne quittent jamais le backend)."""

    permission_classes = [IsAuthenticated]

    def post(self, request, slug, lesson_id):
        course = get_object_or_404(Course, slug=slug, is_published=True)
        enrollment = get_object_or_404(Enrollment, user=request.user, course=course)
        lesson = get_object_or_404(
            Lesson, id=lesson_id, module__course=course, content_type=Lesson.ContentType.QUIZ
        )

        if is_lesson_locked(enrollment, course, lesson):
            return Response(
                {"detail": "Terminez d'abord la leçon précédente."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # {question_id: answer_id} envoyé par l'étudiant.
        submitted = request.data.get("answers", {})

        questions = list(lesson.questions.prefetch_related("answers").all())
        if not questions:
            return Response(
                {"detail": "Ce quiz ne contient aucune question."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = []
        score = 0
        for question in questions:
            correct_answer = next((a for a in question.answers.all() if a.is_correct), None)
            selected_answer_id = submitted.get(str(question.id)) or submitted.get(question.id)
            try:
                selected_answer_id = int(selected_answer_id) if selected_answer_id is not None else None
            except (TypeError, ValueError):
                selected_answer_id = None

            is_correct = correct_answer is not None and selected_answer_id == correct_answer.id
            if is_correct:
                score += 1

            results.append(
                {
                    "question_id": question.id,
                    "selected_answer_id": selected_answer_id,
                    "correct_answer_id": correct_answer.id if correct_answer else None,
                    "is_correct": is_correct,
                }
            )

        max_score = len(questions)

        progress, _ = Progress.objects.get_or_create(enrollment=enrollment, lesson=lesson)
        progress.score = score
        progress.max_score = max_score
        progress.completed_at = timezone.now()
        progress.save()

        return Response(
            {
                "lesson_id": lesson.id,
                "score": score,
                "max_score": max_score,
                "results": results,
            }
        )
