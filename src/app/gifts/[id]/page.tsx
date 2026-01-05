/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { giftIdSchema } from "@/lib/validation";

export const revalidate = 0;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
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

async function getGift(id: string) {
  const parsed = giftIdSchema.safeParse(id);
  if (!parsed.success) {
    return null;
  }

  return prisma.gift.findUnique({
    where: { id: parsed.data },
  });
}

export default async function GiftDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const gift = await getGift(params.id);

  if (!gift) {
    notFound();
  }
  const images = parseImages(gift.images);
  const priceLabel = formatPrice(gift.price, gift.currency);
  const mainImage = gift.mainImage ?? images[0];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-14">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-ink shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/10"
      >
        <span aria-hidden>←</span>
        Retour à la liste
      </Link>

      <section className="overflow-hidden rounded-3xl bg-white/90 p-[1px] shadow-soft ring-1 ring-border backdrop-blur">
        <div className="rounded-[22px] bg-gradient-to-br from-accent/15 via-white to-lilac/10 p-8 sm:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accentMuted px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent shadow-soft ring-1 ring-border">
            <span aria-hidden>✨</span> Détail du cadeau
          </div>

          <h1 className="text-3xl font-semibold text-ink sm:text-4xl">
            {gift.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Une envie du moment. Si tu cherches une idée, tu es au bon endroit.
          </p>
          {mainImage ? (
            <div className="mt-4 overflow-hidden rounded-3xl border border-border shadow-soft">
              <img
                src={mainImage}
                alt=""
                className="h-64 w-full object-cover"
              />
            </div>
          ) : null}
          {gift.description ? (
            <p className="mt-3 text-base text-slate-700">{gift.description}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center rounded-full border border-border bg-white/80 px-3 py-1">
              Ajouté le {formatDate(gift.createdAt)}
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-white/80 px-3 py-1">
              Mis à jour le {formatDate(gift.updatedAt)}
            </span>
            {priceLabel ? (
              <span className="inline-flex items-center rounded-full border border-border bg-white/80 px-3 py-1 font-semibold text-ink">
                {priceLabel}
              </span>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {gift.url ? (
              <a
                href={gift.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/15"
              >
                Voir le lien
                <span aria-hidden>↗</span>
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-4 py-2 text-xs font-semibold text-slate-600">
                Pas de lien pour ce cadeau
              </span>
            )}
          </div>

          {images.length ? (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((img) => (
                <a
                  key={img}
                  href={img}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <img
                    src={img}
                    alt=""
                    className="h-32 w-full object-cover transition group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
