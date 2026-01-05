/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { giftPayloadSchema } from "@/lib/validation";
import type { GiftDTO } from "@/types/gift";

type Props = {
  onCreated: (gift: GiftDTO) => void;
  onError: (message: string) => void;
};

export default function AddGiftForm({ onCreated, onError }: Props) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [images, setImages] = useState<string[]>([]);
  const [newImage, setNewImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSource, setPreviewSource] = useState<string | null>(null);
  const [previewWarning, setPreviewWarning] = useState<string | null>(null);

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      onError("Merci de fournir des champs valides (titre, lien, etc.).");
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
      setDescription("");
      setPrice("");
      setCurrency("EUR");
      setImages([]);
      setNewImage("");
      setPreviewSource(null);
      setPreviewWarning(null);
    } catch (error) {
      console.error("Erreur lors de l'ajout du cadeau", error);
      onError("Une erreur est survenue, réessayez.");
    } finally {
      setLoading(false);
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
        </label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold text-ink sm:col-span-2">
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-base text-ink shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            rows={3}
            placeholder="Quelques détails sur le cadeau..."
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
          Prix
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-base text-ink shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="49.99"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
          Devise
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-base text-ink shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </label>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={newImage}
            onChange={(event) => setNewImage(event.target.value)}
            className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-base text-ink shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="URL d'image"
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
                  className="h-20 w-28 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setImages((prev) => prev.filter((item) => item !== img))
                  }
                  className="absolute right-1 top-1 rounded-full bg-white/80 px-2 py-1 text-xs font-semibold text-rose-600 shadow-soft opacity-0 transition group-hover:opacity-100"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-base font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "En cours..." : "Ajouter"}
        </button>
      </div>
    </form>
  );
}
