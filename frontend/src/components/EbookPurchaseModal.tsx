"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { IconBrandWhatsapp, IconMail, IconX, IconCircleCheckFilled } from "@tabler/icons-react";
import type { EbookOrderInfo } from "@/lib/api";

export default function EbookPurchaseModal({
  order,
  onClose,
}: {
  order: EbookOrderInfo;
  onClose: () => void;
}) {
  const alreadyOwned = order.status === "paid";

  const message = `Bonjour, je souhaite acheter l'ebook « ${order.ebook_title} » (référence ${order.reference}). Comment procéder au paiement ?`;
  const waNumber = order.whatsapp_number.replace(/[^0-9]/g, "");
  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}` : null;
  const mailLink = order.contact_email
    ? `mailto:${order.contact_email}?subject=${encodeURIComponent(
        `Achat ebook — ${order.reference}`,
      )}&body=${encodeURIComponent(message)}`
    : null;

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

          {alreadyOwned ? (
            <div className="text-center">
              <IconCircleCheckFilled className="mx-auto h-12 w-12 text-gold" />
              <h2 className="mt-3 font-syne text-xl font-bold text-white">Vous possédez déjà cet ebook</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Retrouvez-le dans votre espace pour le télécharger.
              </p>
              <Link href="/dashboard" className="btn-primary mt-6 inline-block">
                Aller à mon espace
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest text-gold">Finaliser l'achat</p>
              <h2 className="mt-1 font-syne text-xl font-bold text-white">{order.ebook_title}</h2>
              <p className="mt-1 text-2xl font-bold text-gold">{order.price} HTG</p>

              <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-muted-foreground">Votre référence de commande</p>
                <p className="mt-1 font-syne text-lg font-bold tracking-wider text-white">{order.reference}</p>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                Contactez-nous en indiquant cette référence pour régler le paiement (MonCash).
                Une fois le paiement confirmé, votre ebook sera <strong className="text-white">téléchargeable
                dans votre espace</strong> (onglet « Mes ebooks »).
              </p>

              <div className="mt-6 flex flex-col gap-3">
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-black transition hover:opacity-90"
                  >
                    <IconBrandWhatsapp className="h-5 w-5" />
                    Payer via WhatsApp
                  </a>
                )}
                {mailLink && (
                  <a
                    href={mailLink}
                    className="flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                  >
                    <IconMail className="h-5 w-5" />
                    Contacter par email
                  </a>
                )}
                {!waLink && !mailLink && (
                  <p className="rounded-xl bg-white/5 p-4 text-sm text-muted-foreground">
                    Les coordonnées de contact ne sont pas encore configurées. Notez votre référence
                    <strong className="text-white"> {order.reference}</strong> et contactez le vendeur.
                  </p>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
