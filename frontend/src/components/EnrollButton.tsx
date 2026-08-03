"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowRight } from "@tabler/icons-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError, enrollCourse } from "@/lib/api";

export default function EnrollButton({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnroll() {
    // Sans compte, on envoie vers l'inscription (retour vers cette page ensuite).
    if (!user || !accessToken) {
      router.push(`/register?next=/courses/${slug}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await enrollCourse(slug, accessToken);
      router.push(`/dashboard/courses/${slug}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Inscription…" : "S'inscrire maintenant"}
        {!loading && <IconArrowRight className="h-4 w-4" />}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
