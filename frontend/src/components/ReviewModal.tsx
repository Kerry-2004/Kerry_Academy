"use client";

import { useState } from "react";
import { IconStarFilled, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { ApiError, submitTestimonial, type Enrollment, type MyTestimonial } from "@/lib/api";

export default function ReviewModal({
  enrollment,
  accessToken,
  onClose,
  onSubmitted,
}: {
  enrollment: Enrollment;
  accessToken: string;
  onClose: () => void;
  onSubmitted: (testimonial: MyTestimonial) => void;
}) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (comment.trim().length < 10) {
      setError("Votre avis doit faire au moins 10 caractères.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const testimonial = await submitTestimonial(
        { course: enrollment.course.id, rating, comment: comment.trim() },
        accessToken,
      );
      onSubmitted(testimonial);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");
      setSubmitting(false);
    }
  }

  const displayed = hover || rating;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 px-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#141414] p-7 shadow-2xl"
        >
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
          >
            <IconX className="h-4 w-4" />
          </button>

          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Votre avis</p>
          <h2 className="mt-1 font-syne text-xl font-bold text-white">{enrollment.course.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Votre avis sera relu par l'équipe avant d'être publié sur la page d'accueil.
          </p>

          <div className="mt-6">
            <label className="text-sm font-medium text-white">Votre note</label>
            <div className="mt-2 flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1;
                return (
                  <button
                    key={value}
                    type="button"
                    onMouseEnter={() => setHover(value)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(value)}
                    aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                    className="transition-transform hover:scale-110"
                  >
                    <IconStarFilled
                      className={`h-7 w-7 ${value <= displayed ? "text-gold" : "text-white/15"}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="review-comment" className="text-sm font-medium text-white">
              Votre commentaire
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Partagez votre expérience avec cette formation…"
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:border-gold/50 focus:outline-none"
            />
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:text-white"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Envoi…" : "Envoyer mon avis"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
