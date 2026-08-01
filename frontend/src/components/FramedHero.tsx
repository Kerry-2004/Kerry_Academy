"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import SplitScreenShowcase from "@/components/SplitScreenShowcase";

export default function FramedHero() {
  const { user, loading, logout } = useAuth();
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <section className="px-4 pt-4 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-[#0d0d0d] shadow-2xl shadow-black/60">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(201,168,76,0.18),transparent_60%)]" />

        <header className="flex items-center justify-between px-6 py-6 sm:px-10">
          <Link href="/" className="font-syne text-lg font-extrabold tracking-tight text-white">
            Kerryht<span className="text-gold">.Academy</span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2 py-1 md:flex">
            <Link href="/" className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-white">
              Accueil
            </Link>
            <Link href="/courses" className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-white">
              Formations
            </Link>
            {user && (
              <Link href="/dashboard" className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-white">
                Mon espace
              </Link>
            )}
          </nav>

          {loading ? (
            <div className="h-10 w-28" />
          ) : user ? (
            <button onClick={() => logout()} className="btn-primary">
              Déconnexion
            </button>
          ) : (
            <Link href="/login" className="btn-primary">
              Connexion →
            </Link>
          )}
        </header>

        <div className="px-6 pb-40 pt-8 text-center sm:px-10">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="mx-auto flex max-w-2xl flex-col items-center gap-7"
          >
            <motion.div
              variants={item}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/5 px-4 py-2 text-xs text-white"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
              Inscriptions ouvertes
            </motion.div>

            <motion.h1 variants={item} className="font-syne text-[36px] font-bold leading-[43px] text-white">
              Apprenez les compétences numériques{" "}
              <span className="text-gold">qui font avancer votre carrière.</span>
            </motion.h1>

            <motion.p variants={item} className="max-w-xl text-muted-foreground">
              Kerryht Academy accompagne les étudiants haïtiens et francophones vers la maîtrise
              du digital : formations vidéo, quiz, certificats vérifiables, à votre rythme.
            </motion.p>

            <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-6">
              <Link href="/courses" className="btn-primary">
                Voir les formations →
              </Link>
              <Link
                href="/register"
                className="font-syne text-xs font-bold uppercase tracking-wider text-white transition hover:text-gold"
              >
                Créer un compte
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: reduce ? 0 : 0.5 }}
          className="relative z-10 mx-auto -mt-32 max-w-4xl px-4 pb-8 sm:px-8"
        >
          <SplitScreenShowcase posterSrc="/images/kerry-hero.png" />
        </motion.div>
      </div>
    </section>
  );
}
