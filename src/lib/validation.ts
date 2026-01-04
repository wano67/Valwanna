import { z } from "zod";

export const giftPayloadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le titre est requis")
    .max(120, "Titre trop long"),
  url: z
    .string()
    .trim()
    .url("URL invalide")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type GiftPayload = z.infer<typeof giftPayloadSchema>;

export const credentialsSchema = z.object({
  username: z.string().trim().min(1, "Nom d'utilisateur requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const giftIdSchema = z.string().uuid("Identifiant de cadeau invalide");
