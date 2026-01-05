/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, type ChangeEvent } from "react";
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
  const [description, setDescription] = useState(gift.description ?? "");
  const [price, setPrice] = useState(gift.price ? String(gift.price) : "");
  const [currency, setCurrency] = useState(gift.currency ?? "EUR");
  const [images, setImages] = useState<string[]>(gift.images ?? []);
  const [newImage, setNewImage] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSource, setPreviewSource] = useState<string | null>(null);
  const [previewWarning, setPreviewWarning] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    const parsed = giftPayloadSchema.safeParse({
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      price,
      currency,
      images,
    });

    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ??
        "Merci de fournir des champs valides (titre, lien, etc.).";
      onError(firstError);
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

  const applyPreview = (data: Partial<GiftDTO>) => {
    if (data.title && !title) setTitle(data.title);
    if (data.description && !description) setDescription(data.description);
    if (data.price !== undefined && data.price !== null && !price) {
      setPrice(String(data.price));
    }
    if (data.currency && !currency) setCurrency(data.currency);
    if (data.images && data.images.length && images.length === 0) {
      setImages(data.images);
    }
  };

  const handlePreview = async () => {
    if (!url.trim()) {
      onError("Ajoutez une URL avant l'auto-remplissage.");
      return;
    }
    setPreviewLoading(true);
    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        result?: Partial<GiftDTO>;
        error?: string;
        source?: string;
        warning?: string;
        blocked?: boolean;
      };
      if (!response.ok || !data.result) {
        onError(data.error ?? "Impossible de récupérer les infos.");
        return;
      }
      applyPreview(data.result);
      setPreviewSource(data.source ?? null);
      setPreviewWarning(
        data.warning ??
          (data.blocked
            ? "Site protège l'accès direct, données via unfurl si possible."
            : null),
      );
    } catch (error) {
      console.error("Erreur preview", error);
      onError("Impossible de récupérer les infos.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const addImage = () => {
    if (!newImage.trim()) return;
    setImages((prev) =>
      Array.from(new Set([...prev, newImage.trim()])).slice(0, 6),
    );
    setNewImage("");
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      onError("Image trop volumineuse (max ~2.5MB).");
      return;
    }
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          setImages((prev) =>
            Array.from(new Set([...prev, result])).slice(0, 6),
          );
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload image", error);
      onError("Impossible de charger l'image.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
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
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewLoading}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {previewLoading ? "Recherche..." : "Auto-remplir ✨"}
              </button>
              {previewSource ? (
                <p className="text-xs text-slate-500">
                  Données récupérées via : {previewSource}
                </p>
              ) : null}
              {previewWarning ? (
                <p className="text-xs text-amber-600">{previewWarning}</p>
              ) : null}
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-base text-ink shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="Description"
                rows={3}
                aria-label="Description"
              />
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-base text-ink shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="Prix"
                  aria-label="Prix"
                />
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-base text-ink shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  aria-label="Devise"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={newImage}
                    onChange={(event) => setNewImage(event.target.value)}
                    className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-base text-ink shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    placeholder="URL d'image"
                    aria-label="URL d'image"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-50"
                  >
                    Ajouter une image
                  </button>
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-border px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-50">
                    Importer une image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {images.length ? (
                  <div className="flex flex-wrap gap-2">
                    {images.map((img) => (
                      <div
                        key={img}
                        className="group relative overflow-hidden rounded-xl border border-border bg-white p-2 shadow-soft"
                      >
                        <img
                          src={img}
                          alt=""
                          className="h-16 w-24 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setImages((prev) =>
                              prev.filter((item) => item !== img),
                            )
                          }
                          className="absolute right-1 top-1 rounded-full bg-white/80 px-2 py-1 text-xs font-semibold text-rose-600 shadow-soft opacity-0 transition group-hover:opacity-100"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-ink">{gift.title}</p>
              {gift.description ? (
                <p className="text-sm text-slate-600 line-clamp-2">
                  {gift.description}
                </p>
              ) : null}
              {gift.price !== null ? (
                <p className="text-sm font-semibold text-ink">
                  {gift.price} {gift.currency ?? "EUR"}
                </p>
              ) : null}
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
                className="inline-flex items-center justify-center rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setTitle(gift.title);
                  setUrl(gift.url ?? "");
                  setDescription(gift.description ?? "");
                  setPrice(gift.price ? String(gift.price) : "");
                  setCurrency(gift.currency ?? "EUR");
                  setImages(gift.images ?? []);
                  setNewImage("");
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
                className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-50"
              >
                Éditer
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
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
