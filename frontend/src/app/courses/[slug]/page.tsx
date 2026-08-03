import Link from "next/link";
import { notFound } from "next/navigation";
import {
  IconArrowLeft,
  IconBook2,
  IconPlaylist,
  IconUser,
} from "@tabler/icons-react";
import Navbar from "@/components/Navbar";
import EnrollButton from "@/components/EnrollButton";
import { ApiError, fetchCourse, type CourseDetail } from "@/lib/api";

// La présentation dépend du contenu géré dans l'admin : rendu dynamique pour
// toujours refléter la dernière version.
export const dynamic = "force-dynamic";

export default async function CoursePresentationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let course: CourseDetail;
  try {
    course = await fetchCourse(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const isFree = Number(course.price) === 0;

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* En-tête */}
        <section className="border-b border-white/5 px-6 py-14 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-gold"
            >
              <IconArrowLeft className="h-4 w-4" />
              Toutes les formations
            </Link>

            <div className="mt-6 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
              <div>
                {course.category && (
                  <span className="inline-block rounded-full bg-gold-dim px-3 py-1 text-xs font-medium text-gold-light">
                    {course.category.name}
                  </span>
                )}
                <h1 className="mt-4 font-syne text-3xl font-bold leading-tight text-white sm:text-4xl">
                  {course.title}
                </h1>
                {course.instructor_name && (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <IconUser className="h-4 w-4" />
                    par {course.instructor_name}
                  </p>
                )}
                {(course.short_description || course.description) && (
                  <p className="mt-4 max-w-xl text-muted-foreground">
                    {course.short_description || course.description}
                  </p>
                )}

                <div className="mt-8 flex flex-wrap items-center gap-5">
                  <span className="font-syne text-2xl font-bold text-gold">
                    {isFree ? "Gratuit" : `${course.price} HTG`}
                  </span>
                  <EnrollButton slug={course.slug} />
                </div>
              </div>

              <div>
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-white/5">
                  {course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element -- upload backend, hors optimiseur
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <IconBook2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-around rounded-2xl border border-white/10 bg-white/[0.03] py-4 text-center">
                  <div>
                    <p className="font-syne text-lg font-bold text-white">{course.modules.length}</p>
                    <p className="text-xs text-muted-foreground">Modules</p>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div>
                    <p className="font-syne text-lg font-bold text-white">{totalLessons}</p>
                    <p className="text-xs text-muted-foreground">Leçons</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Présentation riche */}
        <section className="px-6 py-14 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">Présentation</p>
            <h2 className="mt-2 font-syne text-2xl font-bold text-white">À propos de cette formation</h2>

            {course.long_description ? (
              <div
                className="ck-content prose prose-invert mt-6 max-w-none prose-headings:font-syne prose-a:text-gold prose-strong:text-white"
                dangerouslySetInnerHTML={{ __html: course.long_description }}
              />
            ) : course.description ? (
              <p className="mt-6 whitespace-pre-line leading-relaxed text-white/80">{course.description}</p>
            ) : (
              <p className="mt-6 text-muted-foreground">La présentation détaillée sera bientôt disponible.</p>
            )}
          </div>
        </section>

        {/* Au programme */}
        {course.modules.length > 0 && (
          <section className="border-t border-white/5 px-6 py-14 lg:px-12">
            <div className="mx-auto max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold">Programme</p>
              <h2 className="mt-2 font-syne text-2xl font-bold text-white">Au programme</h2>

              <div className="mt-6 space-y-3">
                {course.modules.map((module) => (
                  <div key={module.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center gap-2">
                      <IconPlaylist className="h-4 w-4 text-gold" />
                      <h3 className="font-syne text-base font-semibold text-white">{module.title}</h3>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {module.lessons.length} leçon{module.lessons.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    {module.lessons.length > 0 && (
                      <ul className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                        {module.lessons.map((lesson) => (
                          <li key={lesson.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="h-1 w-1 rounded-full bg-gold" />
                            {lesson.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA final */}
        <section className="border-t border-white/5 px-6 py-16 text-center lg:px-12">
          <h2 className="font-syne text-2xl font-bold text-white sm:text-3xl">Prêt·e à commencer ?</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Rejoignez cette formation et avancez à votre rythme.
          </p>
          <EnrollButton slug={course.slug} className="mt-8 flex justify-center" />
        </section>
      </main>
    </>
  );
}
