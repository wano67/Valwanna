/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(date);
}

function parseImages(images?: string | null): string[] {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    return [];
  }
  return [];
}

function formatPrice(price: number | null, currency: string | null) {
  if (price === null) return null;
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency ?? "EUR",
    }).format(price);
  } catch {
    return `${price} ${currency ?? ""}`.trim();
  }
}

export default async function Home() {
  const gifts = await prisma.gift.findMany({
    orderBy: { createdAt: "desc" },
  });

  const palettes = [
    { bg: "bg-[#fff5fb]", border: "border-rose-200", shadow: "shadow-[0_18px_30px_-18px_rgba(255,105,180,0.55)]" },
    { bg: "bg-[#f9f7ff]", border: "border-lilac/70", shadow: "shadow-[0_18px_30px_-18px_rgba(124,58,237,0.35)]" },
    { bg: "bg-[#fffaf2]", border: "border-amber-100", shadow: "shadow-[0_18px_30px_-18px_rgba(251,191,36,0.35)]" },
    { bg: "bg-[#f4fffb]", border: "border-emerald-100", shadow: "shadow-[0_18px_30px_-18px_rgba(16,185,129,0.25)]" },
  ];
  const rotations = [-2.2, 1.8, -1.1, 2.5, -3, 3.2];
  const lifts = ["sm:-translate-y-1", "sm:translate-y-0.5", "sm:-translate-y-2", "sm:translate-y-1"];

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-14">
      <div className="relative">
        <Link
          href="/"
          className="absolute -top-8 left-2 z-10 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-white shadow-soft ring-1 ring-border transition hover:-translate-y-0.5"
        >
          <img
            src="/favicon.png"
            alt="Retour à l'accueil"
            className="h-full w-full rounded-xl object-cover"
          />
        </Link>
        <section className="overflow-hidden rounded-3xl bg-white/90 shadow-soft ring-1 ring-border backdrop-blur">
          <div className="flex flex-col gap-4 p-8 sm:p-10">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="inline-flex w-fit items-center gap-2 rounded-full bg-accentMuted px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent shadow-soft ring-1 ring-border">
                  <span aria-hidden>📝</span>
                  WISHLIST
                </p>
                <h1 className="text-3xl font-semibold text-ink sm:text-4xl">
                  Les idées cadeaux de Val
                </h1>
              </div>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-rose-400 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-16px_rgba(236,72,153,0.65)] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-400/45"
              >
                Ajouter des cadeaux
                <span aria-hidden>✨</span>
              </Link>
            </div>
            <p className="max-w-3xl text-lg text-slate-600">
              J&apos;ai regroupé ici ce qui me ferait plaisir. Quand une occasion arrive,
              pioche une idée : tu sauras exactement quoi offrir.
            </p>
          </div>
        </section>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        {gifts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white/80 p-8 text-center text-slate-600 shadow-soft">
            Pas encore d&apos;idées publiées. Je remplirai la liste bientôt.
          </div>
        ) : (
          gifts.map((gift) => {
            const images = parseImages(gift.images);
            const priceLabel = formatPrice(gift.price, gift.currency);
            const mainImage = gift.mainImage ?? images[0];
            const palette = palettes[gift.id.length % palettes.length];
            const rotate = rotations[gift.id.length % rotations.length];
            const lift = lifts[gift.id.length % lifts.length];
            return (
            <article
              key={gift.id}
              className={`group relative flex flex-col gap-4 rounded-2xl border p-6 backdrop-blur transition ${palette.bg} ${palette.border} ${palette.shadow} ${lift}`}
              style={{ transform: `rotate(${rotate}deg)` }}
            >
              <Link
                href={`/gifts/${gift.id}`}
                className="flex-1 space-y-3 transition focus-visible:outline-none"
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-lilac/20 px-3 py-1 text-xs font-semibold text-ink">
                  Voir le détail
                  <span aria-hidden className="text-accent">
                    ✨
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-ink underline decoration-transparent transition group-hover:decoration-accent">
                  {gift.title}
                </h2>
                {mainImage ? (
                  <div className="overflow-hidden rounded-2xl border border-border shadow-soft">
                    <img
                      src={mainImage}
                      alt=""
                      className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  </div>
                ) : null}
                {gift.description ? (
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {gift.description}
                  </p>
                ) : null}
                {priceLabel ? (
                  <p className="text-sm font-semibold text-ink">{priceLabel}</p>
                ) : null}
                <p className="text-sm text-slate-500">
                  Ajouté le {formatDate(gift.createdAt)}
                </p>
              </Link>
              {gift.url ? (
                <a
                  href={gift.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-border bg-white/80 px-5 py-2.5 text-sm font-semibold text-accent shadow-soft transition hover:-translate-y-0.5 hover:border-accent hover:bg-accentMuted/60"
                >
                  Voir le lien
                  <span aria-hidden>↗</span>
                </a>
              ) : (
                <span className="self-start rounded-full border border-dashed border-border px-3 py-1 text-xs font-semibold text-slate-500">
                  Pas de lien
                </span>
              )}
            </article>
          );
          })
        )}
      </section>
    </main>
  );
}
