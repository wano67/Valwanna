"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBanner } from "@/components/status-banner";
import type { GiftDTO } from "@/types/gift";
import AddGiftForm from "./add-gift-form";
import GiftTable from "./gift-table";

type Feedback =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

export default function AdminDashboard({
  initialGifts,
}: {
  initialGifts: GiftDTO[];
}) {
  const router = useRouter();
  const [gifts, setGifts] = useState<GiftDTO[]>(initialGifts);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const setError = (message: string) => setFeedback({ type: "error", message });
  const setSuccess = (message: string) =>
    setFeedback({ type: "success", message });

  const handleCreated = (gift: GiftDTO) => {
    setGifts((prev) => [gift, ...prev]);
    setSuccess("Cadeau ajouté avec succès.");
    router.refresh();
  };

  const handleUpdate = (gift: GiftDTO) => {
    setGifts((prev) => prev.map((item) => (item.id === gift.id ? gift : item)));
    setSuccess("Cadeau mis à jour.");
    router.refresh();
  };

  const handleDelete = (id: string) => {
    setGifts((prev) => prev.filter((gift) => gift.id !== id));
    setSuccess("Cadeau supprimé.");
    router.refresh();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });

      if (!response.ok) {
        throw new Error("logout_failed");
      }

      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Erreur de déconnexion", error);
      setError("Impossible de se déconnecter pour le moment.");
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback ? (
        <StatusBanner
          message={feedback.message}
          tone={feedback.type}
          onClose={() => setFeedback(null)}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/80 px-5 py-4 shadow-soft backdrop-blur">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-ink">Actions rapides</h2>
          <p className="text-sm text-slate-600">
            Ajoutez des idées ou gérez celles existantes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
        </button>
      </div>

      <AddGiftForm onCreated={handleCreated} onError={setError} />
      <GiftTable
        gifts={gifts}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onError={setError}
      />
    </div>
  );
}
