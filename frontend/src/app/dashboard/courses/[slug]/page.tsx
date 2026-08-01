"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  IconArrowRight,
  IconBook2,
  IconChevronDown,
  IconChevronLeft,
  IconCircleCheckFilled,
  IconCircleDashed,
  IconDownload,
  IconLoader2,
  IconLock,
} from "@tabler/icons-react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import QuizPlayer from "@/components/QuizPlayer";
import { useAuth } from "@/lib/auth-context";
import { completeLesson, fetchCourseProgress, type CourseProgress } from "@/lib/api";

type Selection = { type: "overview" } | { type: "lesson"; lessonId: number };

function EmptyLessonState({ text }: { text: string }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-[#141414]">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function CourseCurriculum({ slug }: { slug: string }) {
  const { accessToken } = useAuth();
  const [data, setData] = useState<CourseProgress | null>(null);
  const [error, setError] = useState(false);
  const [selection, setSelection] = useState<Selection>({ type: "overview" });
  const [openModules, setOpenModules] = useState<Set<number>>(new Set());
  const [completing, setCompleting] = useState(false);

  const load = (isInitial: boolean) => {
    if (!accessToken) return;
    fetchCourseProgress(slug, accessToken)
      .then((result) => {
        setData(result);
        if (isInitial && result.modules.length > 0) {
          setOpenModules(new Set([result.modules[0].id]));
        }
      })
      .catch(() => setError(true));
  };

  useEffect(() => load(true), [accessToken, slug]);

  const toggleModule = (moduleId: number) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleComplete = async () => {
    if (selection.type !== "lesson" || !accessToken || !data) return;
    setCompleting(true);
    try {
      await completeLesson(slug, selection.lessonId, accessToken);
      load(false);
    } finally {
      setCompleting(false);
    }
  };

  if (error) {
    return (
      <main className="flex-1 px-6 py-20 text-center lg:px-12">
        <p className="text-sm text-red-400">
          Impossible de charger cette formation. Vérifiez que vous y êtes bien inscrit·e.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm text-gold hover:underline">
          Retour à mon espace
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex flex-1 items-center justify-center py-32 text-muted-foreground">Chargement…</main>
    );
  }

  // Toutes les leçons dans l'ordre pédagogique (avec le module d'appartenance).
  const orderedLessons = data.modules.flatMap((m) => m.lessons.map((l) => ({ lesson: l, moduleId: m.id })));

  const selectedLesson =
    selection.type === "lesson"
      ? orderedLessons.find((o) => o.lesson.id === selection.lessonId)?.lesson ?? null
      : null;

  const currentIndex =
    selection.type === "lesson"
      ? orderedLessons.findIndex((o) => o.lesson.id === selection.lessonId)
      : -1;
  const nextEntry = currentIndex >= 0 ? orderedLessons[currentIndex + 1] : undefined;

  const openLesson = (lessonId: number, moduleId: number) => {
    setOpenModules((prev) => new Set(prev).add(moduleId));
    setSelection({ type: "lesson", lessonId });
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-0 px-4 py-10 lg:flex-row lg:px-8">
      <aside className="shrink-0 rounded-2xl border border-white/5 bg-[#141414] lg:w-80">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div>
            <p className="font-syne text-base font-bold text-white">{data.course.title}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gold" style={{ width: `${data.progress_percent}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{data.progress_percent}%</span>
            </div>
          </div>
          <Link href="/dashboard" className="text-muted-foreground transition hover:text-white">
            <IconChevronLeft className="h-5 w-5" />
          </Link>
        </div>

        <div className="max-h-[28rem] overflow-y-auto p-2">
          <button
            onClick={() => setSelection({ type: "overview" })}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${
              selection.type === "overview" ? "bg-gold-dim text-gold-light" : "text-white hover:bg-white/5"
            }`}
          >
            <IconBook2 className="h-4 w-4 shrink-0" />
            Aperçu
          </button>

          {data.modules.map((module) => {
            const isOpen = openModules.has(module.id);
            return (
              <div key={module.id} className="mt-1">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-white/5"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{module.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {module.completed_count}/{module.total_count} étapes
                    </p>
                  </div>
                  <IconChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="ml-4 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                    {module.lessons.map((lesson) => {
                      const isSelected = selectedLesson?.id === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => !lesson.is_locked && openLesson(lesson.id, module.id)}
                          disabled={lesson.is_locked}
                          title={lesson.is_locked ? "Terminez la leçon précédente pour débloquer" : undefined}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                            lesson.is_locked
                              ? "cursor-not-allowed text-muted-2"
                              : isSelected
                                ? "bg-gold-dim text-gold-light"
                                : "text-muted-foreground hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {lesson.is_locked ? (
                            <IconLock className="h-4 w-4 shrink-0" />
                          ) : lesson.is_completed ? (
                            <IconCircleCheckFilled className="h-4 w-4 shrink-0 text-gold" />
                          ) : (
                            <IconCircleDashed className="h-4 w-4 shrink-0" />
                          )}
                          {lesson.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <div className="flex-1 lg:pl-8">
        {selection.type === "overview" ? (
          <div className="pt-6 lg:pt-0">
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-[#141414]">
              {data.course.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element -- backend-hosted upload, not run through the image optimizer
                <img src={data.course.thumbnail} alt={data.course.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <IconBook2 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            <h1 className="mt-8 font-syne text-2xl font-bold text-white">À propos</h1>
            <p className="mt-3 text-muted-foreground">
              {data.course.description || "Détails de cette formation à venir."}
            </p>
          </div>
        ) : (
          <div className="pt-6 lg:pt-0">
            <p className="text-xs uppercase tracking-wide text-gold">
              {selectedLesson?.content_type === "video"
                ? "Vidéo"
                : selectedLesson?.content_type === "quiz"
                  ? "Quiz"
                  : selectedLesson?.content_type === "file"
                    ? "Fichier"
                    : "Leçon"}
            </p>
            <h1 className="mt-2 font-syne text-2xl font-bold text-white">{selectedLesson?.title}</h1>

            <div className="mt-8">
              {selectedLesson?.content_type === "video" && (
                <div className="aspect-video w-full overflow-hidden rounded-2xl bg-[#141414]">
                  {selectedLesson.video ? (
                    <video
                      key={selectedLesson.video}
                      src={selectedLesson.video}
                      controls
                      controlsList="nodownload"
                      className="h-full w-full"
                    />
                  ) : (
                    <EmptyLessonState text="Vidéo à venir." />
                  )}
                </div>
              )}

              {selectedLesson?.content_type === "text" &&
                (selectedLesson.text_content ? (
                  <div
                    className="prose prose-invert max-w-none rounded-2xl bg-[#141414] p-6 prose-headings:font-syne prose-a:text-gold"
                    dangerouslySetInnerHTML={{ __html: selectedLesson.text_content }}
                  />
                ) : (
                  <EmptyLessonState text="Contenu à venir." />
                ))}

              {selectedLesson?.content_type === "file" &&
                (selectedLesson.file ? (
                  <a
                    href={selectedLesson.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-gold-border/40 bg-[#141414] p-6 transition hover:border-gold-border"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-[#0d0d0d]">
                      <IconDownload className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-syne font-semibold text-white">Télécharger le fichier</span>
                      <span className="block text-sm text-muted-foreground">{selectedLesson.title}</span>
                    </span>
                  </a>
                ) : (
                  <EmptyLessonState text="Fichier à venir." />
                ))}

              {selectedLesson?.content_type === "quiz" &&
                (selectedLesson.questions.length > 0 && accessToken ? (
                  <QuizPlayer
                    key={selectedLesson.id}
                    slug={slug}
                    lessonId={selectedLesson.id}
                    questions={selectedLesson.questions}
                    accessToken={accessToken}
                    previousResult={selectedLesson.quiz_result}
                    onFinished={() => load(false)}
                  />
                ) : (
                  <EmptyLessonState text="Questions à venir." />
                ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              {/* Marquer comme terminée : pour les leçons non-quiz pas encore terminées.
                  Le quiz se valide via sa propre soumission. */}
              {selectedLesson?.content_type !== "quiz" && !selectedLesson?.is_completed && (
                <button onClick={handleComplete} disabled={completing} className="btn-primary">
                  {completing ? <IconLoader2 className="h-4 w-4 animate-spin" /> : "Marquer comme terminée →"}
                </button>
              )}

              {selectedLesson?.content_type !== "quiz" && selectedLesson?.is_completed && (
                <span className="inline-flex items-center gap-2 rounded-full bg-gold-dim px-5 py-2.5 text-sm font-semibold text-gold-light">
                  <IconCircleCheckFilled className="h-4 w-4" />
                  Étape terminée
                </span>
              )}

              {/* Leçon suivante : disponible une fois la leçon courante terminée. */}
              {selectedLesson?.is_completed && nextEntry && (
                <button
                  onClick={() => openLesson(nextEntry.lesson.id, nextEntry.moduleId)}
                  className="btn-primary"
                >
                  Leçon suivante
                  <IconArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CourseCurriculumPage() {
  const params = useParams<{ slug: string }>();

  return (
    <>
      <Navbar />
      <ProtectedRoute>
        <CourseCurriculum slug={params.slug} />
      </ProtectedRoute>
    </>
  );
}
