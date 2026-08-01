"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconBook2, IconChevronRight, IconCircleCheckFilled } from "@tabler/icons-react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { fetchMyEnrollments, type Enrollment } from "@/lib/api";

type Tab = "actifs" | "completes";

function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  return (
    <div className="border-b border-white/5 py-5 last:border-b-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-white/5">
          {enrollment.course.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element -- backend-hosted upload, not run through the image optimizer
            <img
              src={enrollment.course.thumbnail}
              alt={enrollment.course.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <IconBook2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="font-syne text-base font-semibold text-white">{enrollment.course.title}</p>
          <p className="text-xs text-muted-foreground">{enrollment.course.category?.name ?? "Formation"}</p>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <span
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
              enrollment.status === "completed"
                ? "bg-gold/15 text-gold"
                : enrollment.status === "pending_payment"
                  ? "bg-white/5 text-muted-foreground"
                  : "bg-gold-dim text-gold-light"
            }`}
          >
            {enrollment.status === "completed"
              ? "Terminée"
              : enrollment.status === "pending_payment"
                ? "Paiement en attente"
                : "Vous participez"}
          </span>

          <Link
            href={`/dashboard/courses/${enrollment.course.slug}`}
            className="flex items-center gap-1 text-sm font-medium text-white transition hover:text-gold"
          >
            Voir le programme
            <IconChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user, accessToken, logout } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[] | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("actifs");

  useEffect(() => {
    if (!accessToken) return;
    fetchMyEnrollments(accessToken)
      .then(setEnrollments)
      .catch(() => setError(true));
  }, [accessToken]);

  const filtered = (enrollments ?? []).filter((e) =>
    tab === "completes" ? e.status === "completed" : e.status !== "completed",
  );

  const initial = (user?.first_name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-10 px-6 py-16 lg:flex-row lg:px-12">
      <aside className="shrink-0 lg:w-64">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold font-syne text-lg font-bold text-[#0d0d0d]">
            {initial}
          </span>
          <div>
            <p className="font-syne text-base font-bold text-white">
              {user?.first_name || user?.email}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-dim px-2.5 py-0.5 text-[11px] font-medium text-gold-light">
              <IconCircleCheckFilled className="h-3 w-3" />
              Étudiant
            </span>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-1 border-t border-white/5 pt-6 lg:border-t-0 lg:pt-0">
          <span className="rounded-lg bg-white/5 px-4 py-2.5 text-sm font-semibold text-gold">Mes Cours</span>
          <button
            onClick={() => logout()}
            className="rounded-lg px-4 py-2.5 text-left text-sm text-muted-foreground transition hover:bg-white/5 hover:text-white"
          >
            Déconnexion
          </button>
        </nav>
      </aside>

      <div className="flex-1 border-t border-white/5 pt-10 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
        <h1 className="font-syne text-3xl font-bold text-white">Programmes</h1>
        <p className="mt-2 text-muted-foreground">Suivez la progression de vos programmes.</p>

        <div className="mt-8 flex gap-6 border-b border-white/10">
          {(["actifs", "completes"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 pb-3 text-sm font-medium transition ${
                tab === t ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              {t === "actifs" ? "Actifs" : "Complétés"}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {error ? (
            <p className="mt-6 text-sm text-red-400">
              Impossible de charger vos formations pour le moment. Réessayez plus tard.
            </p>
          ) : enrollments === null ? (
            <p className="mt-6 text-sm text-muted-foreground">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              {tab === "actifs"
                ? "Vous n'êtes inscrit à aucune formation active pour le moment."
                : "Aucune formation complétée pour le moment."}
            </p>
          ) : (
            <div>
              {filtered.map((enrollment) => (
                <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <ProtectedRoute>
        <DashboardContent />
      </ProtectedRoute>
    </>
  );
}
