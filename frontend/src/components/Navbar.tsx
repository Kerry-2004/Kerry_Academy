"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6 lg:px-12">
        <Link href="/" className="font-syne text-xl font-extrabold tracking-tight text-white">
          Kerryht<span className="text-gold">.Academy</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/" className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-white">
            Accueil
          </Link>
          <Link href="/courses" className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-white">
            Formations
          </Link>
          {user && (
            <Link href="/dashboard" className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-white">
              Mon espace
            </Link>
          )}
        </nav>

        <div>
          {loading ? null : user ? (
            <button onClick={() => logout()} className="btn-secondary">
              Déconnexion
            </button>
          ) : (
            <Link href="/login" className="btn-primary">
              Connexion →
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
