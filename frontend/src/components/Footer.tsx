import Link from "next/link";
import { IconBrandWhatsapp, IconMail, IconMapPin } from "@tabler/icons-react";
import Reveal from "@/components/Reveal";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-[#0b0b0b] px-6 py-14 lg:px-12">
      <Reveal className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="font-syne text-lg font-extrabold tracking-tight text-white">
            Kerryht<span className="text-gold">.Academy</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Formations vidéo, quiz et certificats pour maîtriser les compétences numériques, à votre rythme.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Navigation</p>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            <li>
              <Link href="/" className="text-muted-foreground transition hover:text-white">
                Accueil
              </Link>
            </li>
            <li>
              <Link href="/courses" className="text-muted-foreground transition hover:text-white">
                Formations
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-muted-foreground transition hover:text-white">
                Connexion
              </Link>
            </li>
            <li>
              <Link href="/register" className="text-muted-foreground transition hover:text-white">
                Créer un compte
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Contact</p>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <IconMapPin className="h-4 w-4 shrink-0 text-gold" />
              Haïti
            </li>
            <li>
              <a
                href="https://wa.me/50941570822"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition hover:text-white"
              >
                <IconBrandWhatsapp className="h-4 w-4 shrink-0 text-gold" />
                +509 4157 0822
              </a>
            </li>
            <li>
              <a
                href="mailto:contact@kerryht.com"
                className="flex items-center gap-2 transition hover:text-white"
              >
                <IconMail className="h-4 w-4 shrink-0 text-gold" />
                contact@kerryht.com
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Commencez</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Prêt à apprendre ? Rejoignez Kerryht Academy dès aujourd&apos;hui.
          </p>
          <Link href="/register" className="btn-primary mt-4">
            S&apos;inscrire →
          </Link>
        </div>
      </Reveal>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Kerryht Academy. Tous droits réservés.</p>
        <p>Fait avec ❤ en Haïti</p>
      </div>
    </footer>
  );
}
