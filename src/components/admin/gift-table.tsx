"use client";

import { useState } from "react";
import { giftPayloadSchema } from "@/lib/validation";
import type { GiftDTO } from "@/types/gift";

type Props = {
  gifts: GiftDTO[];
  onUpdate: (gift: GiftDTO) => void;
  onDelete: (id: string) => void;
  onError: (message: string) => void;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(new Date(date));
}

function GiftRow({
  gift,
  onUpdate,
  onDelete,
  onError,
}: {
  gift: GiftDTO;
  onUpdate: (gift: GiftDTO) => void;
  onDelete: (id: string) => void;
  onError: (message: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(gift.title);
  const [url, setUrl] = useState(gift.url ?? "");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
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
      const response = await fetch(`/api/gifts/${gift.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        onError(data.error ?? "Impossible de mettre à jour ce cadeau.");
        setLoading(false);
        return;
      }

      const data = (await response.json()) as { gift: GiftDTO };
      onUpdate(data.gift);
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur de mise à jour du cadeau", error);
      onError("Une erreur est survenue, réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Supprimer ce cadeau ? Cette action est définitive.",
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/gifts/${gift.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        onError(data.error ?? "Impossible de supprimer ce cadeau.");
        setLoading(false);
        return;
      }

      onDelete(gift.id);
    } catch (error) {
      console.error("Erreur de suppression du cadeau", error);
      onError("Une erreur est survenue, réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white/80 p-4 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 space-y-1">
          {isEditing ? (
            <>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-base text-ink shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="Titre"
                aria-label="Titre"
              />
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-base text-ink shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="URL (optionnel)"
                aria-label="URL"
              />
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-ink">{gift.title}</p>
              <p className="text-xs text-slate-500">
                Ajouté le {formatDate(gift.createdAt)}
              </p>
              {gift.url ? (
                <a
                  href={gift.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-ink"
                >
                  Voir le lien
                  <span aria-hidden>↗</span>
                </a>
              ) : (
                <span className="inline-flex items-center rounded-full border border-dashed border-border px-3 py-1 text-xs font-semibold text-slate-500">
                  Pas de lien
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/gifts/${gift.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-lilac/40 bg-lilac/15 px-3 py-2 text-xs font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-lilac/25"
          >
            Voir
            <span aria-hidden>↗</span>
          </a>
          {isEditing ? (
            <>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setTitle(gift.title);
                  setUrl(gift.url ?? "");
                }}
                className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 text-xs font-semibold text-ink transition hover:bg-slate-50"
              >
                Annuler
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 text-xs font-semibold text-ink transition hover:bg-slate-50"
              >
                Éditer
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GiftTable({
  gifts,
  onUpdate,
  onDelete,
  onError,
}: Props) {
  if (gifts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white/80 p-8 text-center text-slate-600 shadow-soft">
        Aucun cadeau n&apos;est encore enregistré.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {gifts.map((gift) => (
        <GiftRow
          key={gift.id}
          gift={gift}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onError={onError}
        />
      ))}
    </div>
  );
}
