"use client";

import { useState, type FormEvent } from "react";
import { giftPayloadSchema } from "@/lib/validation";
import type { GiftDTO } from "@/types/gift";

type Props = {
  onCreated: (gift: GiftDTO) => void;
  onError: (message: string) => void;
};

export default function AddGiftForm({ onCreated, onError }: Props) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const parsed = giftPayloadSchema.safeParse({
      title: title.trim(),
      url: url.trim(),
    });

    if (!parsed.success) {
      onError("Merci de fournir un titre valide et une URL correcte.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        onError(data.error ?? "Impossible d'ajouter le cadeau.");
        setLoading(false);
        return;
      }

      const data = (await response.json()) as { gift: GiftDTO };
      onCreated(data.gift);
      setTitle("");
      setUrl("");
    } catch (error) {
      console.error("Erreur lors de l'ajout du cadeau", error);
      onError("Une erreur est survenue, réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-border bg-white/80 p-6 shadow-soft backdrop-blur"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-ink">Ajouter un cadeau</h2>
        <p className="text-sm text-slate-600">
          Renseignez un titre (obligatoire) et un lien optionnel.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
          Titre
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-base text-ink shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Ex: Lego Star Wars"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
          URL (optionnel)
          <input
            name="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-base text-ink shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="https://exemple.com"
          />
        </label>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "En cours..." : "Ajouter"}
        </button>
      </div>
    </form>
  );
}
