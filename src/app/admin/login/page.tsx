import { redirect } from "next/navigation";
import { getSessionData } from "@/lib/session";
import LoginForm from "@/components/admin/login-form";

export const metadata = {
  title: "Connexion admin | Valwanna",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLoginPage() {
  let sessionError = false;

  try {
    const session = await getSessionData();
    if (session?.isAdmin) {
      redirect("/admin");
    }
  } catch (error) {
    console.error("Erreur de récupération de session", error);
    sessionError = true;
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-16">
      <div className="rounded-3xl bg-white/80 p-8 shadow-soft ring-1 ring-border">
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Wishlist
          </p>
          <h1 className="text-3xl font-semibold text-ink">Connexion</h1>
          <p className="text-slate-600">
            Coucou, c&apos;est la porte secrète pour gérer ma wishlist. 🤍
          </p>
        </div>
        {sessionError ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            La configuration de session est manquante
            (`SESSION_PASSWORD`). Ajoutez les variables requises dans
            `.env.local`.
          </div>
        ) : null}
        <LoginForm />
      </div>
    </main>
  );
}
