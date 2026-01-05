import { redirect } from "next/navigation";
import type { Gift } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionWithResponse } from "@/lib/session";
import { toGiftDTO } from "@/lib/gift-serializer";
import AdminDashboard from "@/components/admin/admin-dashboard";
import type { GiftDTO } from "@/types/gift";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function serializeGift(gift: Gift): GiftDTO {
  return toGiftDTO(gift);
}

export default async function AdminPage() {
  let session = null;
  let sessionError = false;

  try {
    const { session: s } = await getSessionWithResponse();
    session = s;
  } catch (error) {
    console.error("Erreur de récupération de session", error);
    sessionError = true;
  }

  if (sessionError) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-14">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-800 shadow-soft">
          Impossible d&apos;initialiser la session admin. Vérifiez les variables
          `SESSION_PASSWORD`, `ADMIN_USERNAME` et `ADMIN_PASSWORD_HASH` dans
          `.env.local`.
        </div>
      </main>
    );
  }

  if (!session?.isAdmin) {
    redirect("/admin/login");
  }

  const gifts = await prisma.gift.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-14">
      <section className="overflow-hidden rounded-3xl bg-white/80 p-8 shadow-soft ring-1 ring-border backdrop-blur">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Tableau de bord
          </p>
          <h1 className="text-3xl font-semibold text-ink sm:text-4xl">
            Gérer la wishlist
          </h1>
          <p className="text-slate-600">
            Ajoutez, modifiez ou supprimez les idées cadeaux. Les changements
            sont visibles immédiatement sur la page publique.
          </p>
        </div>
      </section>

      <AdminDashboard initialGifts={gifts.map(serializeGift)} />
    </main>
  );
}
