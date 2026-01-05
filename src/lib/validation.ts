import { z } from "zod";

const pricePreprocess = z.preprocess((val) => {
  if (typeof val === "string" && val.trim() === "") return undefined;
  if (typeof val === "string") return Number(val);
  return val;
}, z.number().positive().max(1_000_000).optional());

const imagesSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Image manquante")
      .max(2_000_000, "Image trop volumineuse"),
  )
  .max(6, "Maximum 6 images")
  .optional()
  .or(z.literal(null))
  .or(z.literal(undefined));

export const giftPayloadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le titre est requis")
    .max(120, "Titre trop long"),
  url: z
    .string()
    .trim()
    .max(500, "URL trop longue")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  description: z
    .string()
    .trim()
    .max(500, "Description trop longue")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  price: pricePreprocess,
  currency: z
    .string()
    .trim()
    .length(3, "Devise sur 3 lettres (ex: EUR)")
    .transform((val) => val.toUpperCase())
    .optional()
    .or(z.literal("").transform(() => undefined)),
  images: imagesSchema,
});

export type GiftPayload = z.infer<typeof giftPayloadSchema>;

export const credentialsSchema = z.object({
  username: z.string().trim().min(1, "Nom d'utilisateur requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const giftIdSchema = z.string().uuid("Identifiant de cadeau invalide");
