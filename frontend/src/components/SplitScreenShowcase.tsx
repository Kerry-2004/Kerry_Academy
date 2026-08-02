"use client";

import { useState } from "react";
import Image from "next/image";
import { IconCircleCheckFilled, IconLockFilled, IconPlayerPlayFilled } from "@tabler/icons-react";
import VideoModal from "@/components/VideoModal";

const modules = [
  { title: "Découvrir les bases", done: true },
  { title: "Passer à la pratique", done: true },
  { title: "Obtenir son certificat", done: false },
];

export default function SplitScreenShowcase({
  posterSrc,
  videoSrc,
}: {
  posterSrc: string;
  videoSrc?: string;
}) {
  const [open, setOpen] = useState(false);
  // Le poster peut être une image locale (/images/…) OU une URL du backend
  // (https://…/media/…). next/image exige une config de domaine pour les URL
  // distantes ; on utilise donc un <img> simple dans ce cas.
  const isRemotePoster = /^https?:\/\//.test(posterSrc);

  return (
    <>
      <div className="relative overflow-hidden rounded-[2rem] bg-[#141414] shadow-2xl shadow-black/50">
        <div className="grid grid-cols-2">
          <div className="relative aspect-[4/5] sm:aspect-square">
            {isRemotePoster ? (
              // eslint-disable-next-line @next/next/no-img-element -- upload backend, hors optimiseur d'images
              <img
                src={posterSrc}
                alt="Formateur Kerryht Academy"
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            ) : (
              <Image
                src={posterSrc}
                alt="Formateur Kerryht Academy"
                fill
                priority
                className="object-cover object-top"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/30" />
            <span className="absolute left-3 top-3 rounded-full border border-white/60 bg-black/60 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur sm:left-5 sm:top-5">
              Formateur
            </span>
          </div>

          <div className="relative flex aspect-[4/5] flex-col justify-center gap-5 bg-[#161616] p-5 sm:aspect-square sm:p-8">
            <span className="absolute right-3 top-3 rounded-full border border-white/60 bg-black/40 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur sm:right-5 sm:top-5">
              Aperçu du cours
            </span>

            <div className="mt-6 flex items-center gap-1.5 sm:mt-0">
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            </div>

            <div>
              <p className="font-syne text-sm font-semibold text-white sm:text-base">
                Introduction au Marketing Digital
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-gold" />
              </div>
            </div>

            <ul className="flex flex-col gap-2.5">
              {modules.map((module) => (
                <li key={module.title} className="flex items-center gap-2.5 text-xs text-muted-foreground sm:text-sm">
                  {module.done ? (
                    <IconCircleCheckFilled className="h-4 w-4 shrink-0 text-gold" />
                  ) : (
                    <IconLockFilled className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={module.done ? "text-white" : undefined}>{module.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={() => setOpen(true)}
          aria-label="Regarder la vidéo de présentation"
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold text-[#0d0d0d] shadow-[0_0_0_10px_rgba(13,13,13,0.55)] transition-transform hover:scale-110 sm:h-20 sm:w-20"
        >
          <IconPlayerPlayFilled className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>

        <div className="absolute bottom-4 left-4 flex max-w-[220px] items-center gap-3 rounded-2xl border border-white/70 bg-[#0d0d0d]/90 p-3 shadow-xl backdrop-blur sm:bottom-6 sm:left-6">
          <IconCircleCheckFilled className="h-8 w-8 shrink-0 text-gold" />
          <p className="text-xs leading-snug text-white">
            Module 3 débloqué <span className="text-muted-foreground">— continuez votre progression</span>
          </p>
        </div>
      </div>

      <VideoModal open={open} onClose={() => setOpen(false)} videoSrc={videoSrc} />
    </>
  );
}
