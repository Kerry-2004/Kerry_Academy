import { IconStarFilled, IconQuote } from "@tabler/icons-react";
import Reveal from "@/components/Reveal";
import type { Testimonial } from "@/lib/api";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <IconStarFilled
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-gold" : "text-white/15"}`}
        />
      ))}
    </div>
  );
}

export default function TestimonialsGrid({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((t, index) => (
        <Reveal
          key={t.id}
          delay={index * 0.05}
          className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-gold/30"
        >
          <IconQuote className="h-7 w-7 text-gold/40" />
          <Stars rating={t.rating} />
          <p className="mt-4 flex-1 text-sm leading-relaxed text-white/80">{t.comment}</p>
          <div className="mt-6 flex items-center gap-3 border-t border-white/5 pt-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold font-syne text-sm font-bold text-[#0d0d0d]">
              {getInitials(t.author_name)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-syne text-sm font-semibold text-white">{t.author_name}</p>
              <p className="truncate text-xs text-muted-foreground">{t.course_title}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
