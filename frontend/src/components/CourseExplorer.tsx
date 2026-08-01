"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { IconArrowUpRight, IconBook2 } from "@tabler/icons-react";
import Reveal from "@/components/Reveal";
import { fetchCategories, fetchCourses, type Category, type Course } from "@/lib/api";

export default function CourseExplorer() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCourses(null);
    fetchCourses(selected ?? undefined)
      .then(setCourses)
      .catch(() => setError(true));
  }, [selected]);

  return (
    <>
      <Reveal className="mx-auto max-w-6xl text-center">
        <h2 className="font-syne text-4xl font-extrabold text-white sm:text-5xl">Explorez nos Cours</h2>
        <div className="mx-auto mt-6 h-px w-32 bg-gradient-to-r from-transparent via-gold-border to-transparent" />

        {categories.length > 0 && (
          <div className="mt-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">Categories</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setSelected(null)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  selected === null
                    ? "bg-gold text-[#0d0d0d]"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
              >
                Tous
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelected(category.slug)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    selected === category.slug
                      ? "bg-gold text-[#0d0d0d]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </Reveal>

      <div className="mx-auto mt-14 max-w-6xl">
        {error ? (
          <p className="text-center text-muted-foreground">
            Impossible de charger les formations pour le moment. Réessayez plus tard.
          </p>
        ) : courses === null ? (
          <p className="text-center text-muted-foreground">Chargement…</p>
        ) : courses.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Aucune formation publiée dans cette catégorie pour le moment.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: reduce ? 0 : 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, ease: "easeOut", delay: reduce ? 0 : (index % 3) * 0.08 }}
                whileHover={reduce ? undefined : { y: -6 }}
                className="group flex flex-col rounded-3xl border border-white/5 bg-[#141414] p-6 transition-colors hover:border-gold-border/60"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-syne text-xl font-bold leading-tight text-white">{course.title}</h3>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-[#0d0d0d] transition-transform duration-300 group-hover:rotate-45">
                    <IconArrowUpRight className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-4 h-px w-full bg-white/10" />

                <p className="mt-4 text-sm text-muted-foreground">
                  {course.description || "Détails de cette formation à venir."}
                </p>

                <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-2xl bg-white/5">
                  {course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element -- backend-hosted upload, not run through the image optimizer
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <IconBook2 className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
