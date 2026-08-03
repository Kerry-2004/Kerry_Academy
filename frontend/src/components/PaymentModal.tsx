"use client";

import { AnimatePresence, motion } from "framer-motion";
import { IconBrandWhatsapp, IconClock, IconLock, IconX } from "@tabler/icons-react";
import type { PaymentSettings } from "@/lib/api";

function PaymentMethod({
  label,
  number,
  name,
  color,
}: {
  label: string;
  number: string;
  name: string;
  color: string;
}) {
  if (!number) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <span
        className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
        style={{ backgroundColor: `${color}22`, color }}
      >
        {label}
      </span>
      <p className="mt-2 font-syne text-lg font-bold tracking-wide text-white">{number}</p>
      {name && <p className="text-xs text-muted-foreground">{name}</p>}
    </div>
  );
}

export default function PaymentModal({
  settings,
  courseTitle,
  onClose,
}: {
  settings: PaymentSettings;
  courseTitle: string;
  onClose: () => void;
}) {
  const waNumber = settings.whatsapp_number.replace(/[^0-9]/g, "");
  const message = `Bonjour, voici ma preuve de paiement pour la formation « ${courseTitle} ».`;
  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}` : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-black/80 px-6 py-10"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#141414] p-7 shadow-2xl"
        >
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
          >
            <IconX className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 text-gold">
            <IconLock className="h-5 w-5" />
            <p className="text-xs font-semibold uppercase tracking-widest">Accès complet</p>
          </div>
          <h2 className="mt-2 font-syne text-xl font-bold text-white">Débloquez cette formation</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vous consultez actuellement l'aperçu de « {courseTitle} ». Effectuez le paiement pour
            accéder à l'intégralité du contenu.
          </p>

          <p className="mt-5 text-sm font-semibold text-white">Envoyez le paiement à :</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <PaymentMethod
              label="MonCash"
              number={settings.moncash_number}
              name={settings.moncash_name}
              color="#e2001a"
            />
            <PaymentMethod
              label="Natcash"
              number={settings.natcash_number}
              name={settings.natcash_name}
              color="#00a94f"
            />
          </div>

          {settings.instructions && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-gold-dim p-4 text-sm text-gold-light">
              <IconClock className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{settings.instructions}</p>
            </div>
          )}

          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-black transition hover:opacity-90"
            >
              <IconBrandWhatsapp className="h-5 w-5" />
              Envoyer la preuve via WhatsApp
            </a>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
