import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

type EnvConfig = {
  DATABASE_URL: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD_HASH: string;
  SESSION_PASSWORD: string;
  MICROLINK_API_KEY?: string;
  SCRAPER_API_KEY?: string;
  SERPER_API_KEY?: string;
};

function findProjectRoot(start = process.cwd()): string {
  let dir = start;
  // Limit search depth to avoid infinite loops.
  for (let i = 0; i < 5; i += 1) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

const rootDir = findProjectRoot();
const envLocalPath = path.join(rootDir, ".env.local");
const envPath = path.join(rootDir, ".env");

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: false });
  if (process.env.NODE_ENV === "development") {
    console.info("env.ts: loaded .env.local from", envLocalPath);
  }
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
  if (process.env.NODE_ENV === "development") {
    console.info("env.ts: loaded .env from", envPath);
  }
}

if (process.env.NODE_ENV === "development") {
  const summary = {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasAdminUser: Boolean(process.env.ADMIN_USERNAME),
    hasAdminHash: Boolean(process.env.ADMIN_PASSWORD_HASH),
    hasSessionPassword: Boolean(process.env.SESSION_PASSWORD),
  };
  console.info("env.ts: keys present (dev only log):", summary);
}

const guidance = `
Configuration environnement manquante ou invalide.
- Créez un fichier .env.local à la racine du projet (même niveau que package.json).
- Vous pouvez générer un environnement de dev jetable avec: npm run bootstrap:dev
- Mettez à jour les valeurs puis redémarrez "npm run dev".
- Commandes utiles :
   npm run hash:password -- "motDePasse"
   npm run prisma:migrate -- --name init
   npm run dev
`;

function assertNonEmpty(name: keyof EnvConfig | "ADMIN_PASSWORD", value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`Variable ${name} manquante. ${guidance}`);
  }
  if (value.includes("remplacez") || value.includes("changez-moi")) {
    throw new Error(
      `Variable ${name} contient un placeholder. ` +
        `Lancez "npm run bootstrap:dev:force", puis redémarrez "npm run dev". ` +
        `Assurez-vous d'être dans le dossier contenant package.json (utilisez "npm run debug:env:paths") ` +
        `et, en dev, vérifiez /api/_debug/env. ${guidance}`,
    );
  }
  return value.trim();
}

function validateBase(name: keyof EnvConfig | "ADMIN_PASSWORD", value: string | undefined) {
  return assertNonEmpty(name, value);
}

function resolveAdminHash(): string {
  const isDev = process.env.NODE_ENV === "development";
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  const adminPlain = process.env.ADMIN_PASSWORD;

  const bcryptPrefix = /^(?:\$2[aby]\$)/;

  if (isDev) {
    if (adminHash && bcryptPrefix.test(adminHash)) {
      console.info("env.ts: admin auth using ADMIN_PASSWORD_HASH (dev mode).");
      return adminHash.trim();
    }
    if (adminPlain && adminPlain.length >= 8) {
      if (adminPlain.includes("remplacez") || adminPlain.includes("changez-moi")) {
        throw new Error(
          `ADMIN_PASSWORD contient un placeholder. Relancez "npm run bootstrap:dev:force" puis "npm run dev". ${guidance}`,
        );
      }
      console.info("env.ts: admin auth using ADMIN_PASSWORD (hashed in-memory, dev mode).");
      return bcrypt.hashSync(adminPlain, 12);
    }
    throw new Error(
      "ADMIN_PASSWORD_HASH manquant ou invalide, et aucun ADMIN_PASSWORD valide fourni (>=8 caractères). " +
        'En dev, utilisez "npm run bootstrap:dev:force" ou fournissez ADMIN_PASSWORD_HASH. ' +
        'Vérifiez "npm run debug:env:paths" et /api/_debug/env. ' +
        guidance,
    );
  }

  // Production / non-dev
  if (adminPlain) {
    throw new Error(
      "ADMIN_PASSWORD (plaintext) ne doit pas être utilisé en production. Fournissez ADMIN_PASSWORD_HASH (bcrypt). " +
        guidance,
    );
  }
  if (!adminHash || !bcryptPrefix.test(adminHash.trim())) {
    throw new Error(
      `ADMIN_PASSWORD_HASH doit être présent et être un hash bcrypt (commence par $2a$, $2b$ ou $2y$). ${guidance}`,
    );
  }
  return adminHash.trim();
}

function loadEnv(): EnvConfig {
  const DATABASE_URL = validateBase("DATABASE_URL", process.env.DATABASE_URL);
  const ADMIN_USERNAME = validateBase("ADMIN_USERNAME", process.env.ADMIN_USERNAME);
  const SESSION_PASSWORD = validateBase("SESSION_PASSWORD", process.env.SESSION_PASSWORD);

  if (SESSION_PASSWORD.length < 32) {
    throw new Error(`SESSION_PASSWORD doit contenir au moins 32 caractères. ${guidance}`);
  }

  const ADMIN_PASSWORD_HASH = resolveAdminHash();

  return {
    DATABASE_URL,
    ADMIN_USERNAME,
    ADMIN_PASSWORD_HASH,
    SESSION_PASSWORD,
    MICROLINK_API_KEY: process.env.MICROLINK_API_KEY?.trim() || undefined,
    SCRAPER_API_KEY: process.env.SCRAPER_API_KEY?.trim() || undefined,
    SERPER_API_KEY: process.env.SERPER_API_KEY?.trim() || undefined,
  };
}

export const env = loadEnv();
