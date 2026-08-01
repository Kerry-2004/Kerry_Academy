"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ email, password, first_name: firstName });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Inscription impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <Reveal className="w-full max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl border border-gold-border/40 bg-white/[0.02] p-8"
        >
          <h1 className="font-syne text-2xl font-bold text-white">Créer un compte</h1>

          <label className="mt-6 block text-sm text-muted-foreground">
            Prénom
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-4 py-2 text-white outline-none focus:border-gold"
            />
          </label>

          <label className="mt-4 block text-sm text-muted-foreground">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-4 py-2 text-white outline-none focus:border-gold"
            />
          </label>

          <label className="mt-4 block text-sm text-muted-foreground">
            Mot de passe
            <input
              type="password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-4 py-2 text-white outline-none focus:border-gold"
            />
          </label>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full justify-center">
            {submitting ? "Création…" : "Créer mon compte →"}
          </button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà inscrit ?{" "}
            <Link href="/login" className="text-gold">
              Se connecter
            </Link>
          </p>
        </form>
        </Reveal>
      </main>
    </>
  );
}
