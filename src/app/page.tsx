import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(date);
}

export default async function Home() {
  const gifts = await prisma.gift.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-14">
      <section className="overflow-hidden rounded-3xl bg-white/90 shadow-soft ring-1 ring-border backdrop-blur">
        <div className="flex flex-col gap-4 p-8 sm:p-10">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-accentMuted px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent shadow-soft ring-1 ring-border">
            <span aria-hidden>💖</span>
            Wishlist partagée
          </p>
          <h1 className="text-3xl font-semibold text-ink sm:text-4xl">
            Les idées cadeaux de Val💕
          </h1>
          <p className="max-w-3xl text-lg text-slate-600">
            Ici, on retrouve tous les cadeaux que je veux, je suis très très sage en échange oui oui oui...
            
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full bg-accentMuted px-3 py-1 font-medium text-accent shadow-soft ring-1 ring-border">
              Ouvert en lecture seule
            </span>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 rounded-full border border-transparent bg-ink px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/15"
            >
              Espace admin
              <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        {gifts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white/80 p-8 text-center text-slate-600 shadow-soft">
            Aucun cadeau pour le moment. Revenez bientôt !
          </div>
        ) : (
          gifts.map((gift) => (
            <article
              key={gift.id}
              className="group flex flex-col justify-between gap-4 rounded-2xl border border-border bg-white/85 p-6 shadow-soft backdrop-blur transition hover:-translate-y-1 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/15 sm:flex-row sm:items-center"
            >
              <Link
                href={`/gifts/${gift.id}`}
                className="flex-1 space-y-2 transition focus-visible:outline-none"
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-lilac/20 px-3 py-1 text-xs font-semibold text-ink">
                  Détails
                  <span aria-hidden className="text-accent">
                    ✨
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-ink underline decoration-transparent transition group-hover:decoration-accent">
                  {gift.title}
                </h2>
                <p className="text-sm text-slate-500">
                  Ajouté le {formatDate(gift.createdAt)}
                </p>
              </Link>
              {gift.url ? (
                <a
                  href={gift.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-accent shadow-soft transition hover:-translate-y-0.5 hover:border-accent hover:bg-accentMuted/60"
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
          ))
        )}
      </section>
    </main>
  );
}
