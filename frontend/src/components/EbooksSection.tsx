"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconBook2, IconShoppingCart } from "@tabler/icons-react";
import Reveal from "@/components/Reveal";
import EbookPurchaseModal from "@/components/EbookPurchaseModal";
import { useAuth } from "@/lib/auth-context";
import { ApiError, orderEbook, type Ebook, type EbookOrderInfo } from "@/lib/api";

function EbookCard({
  ebook,
  onBuy,
  busy,
}: {
  ebook: Ebook;
  onBuy: (ebook: Ebook) => void;
  busy: boolean;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-gold/30">
      <div className="relative aspect-[3/4] w-full bg-white/5">
        {ebook.cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- upload backend, hors optimiseur
          <img src={ebook.cover} alt={ebook.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <IconBook2 className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-syne text-base font-bold text-white">{ebook.title}</h3>
        {ebook.author && <p className="text-xs text-muted-foreground">par {ebook.author}</p>}
        {ebook.description && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm text-white/70">{ebook.description}</p>
        )}
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-syne text-lg font-bold text-gold">{ebook.price} HTG</span>
          <button
            onClick={() => onBuy(ebook)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-bold text-[#0d0d0d] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconShoppingCart className="h-4 w-4" />
            Acheter
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EbooksSection({ ebooks }: { ebooks: Ebook[] }) {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<EbookOrderInfo | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy(ebook: Ebook) {
    // L'achat nécessite un compte (pour livrer l'ebook dans l'espace de l'acheteur).
    if (!user || !accessToken) {
      router.push(`/login?next=/`);
      return;
    }
    setBusyId(ebook.id);
    setError(null);
    try {
      const info = await orderEbook(ebook.id, accessToken);
      setOrder(info);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setBusyId(null);
    }
  }

  if (ebooks.length === 0) return null;

  return (
    <>
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Boutique</p>
        <h2 className="mt-3 font-syne text-3xl font-bold text-white sm:text-4xl">Nos ebooks</h2>
        <p className="mt-3 text-muted-foreground">
          Des ressources à emporter pour approfondir vos compétences à votre rythme.
        </p>
      </Reveal>

      {error && <p className="mt-6 text-center text-sm text-red-400">{error}</p>}

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ebooks.map((ebook) => (
          <Reveal key={ebook.id}>
            <EbookCard ebook={ebook} onBuy={handleBuy} busy={busyId === ebook.id} />
          </Reveal>
        ))}
      </div>

      {order && <EbookPurchaseModal order={order} onClose={() => setOrder(null)} />}
    </>
  );
}
