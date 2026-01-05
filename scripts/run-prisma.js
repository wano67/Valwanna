#!/usr/bin/env node
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const root = process.cwd();
const envLocalPath = path.join(root, ".env.local");
const envPath = path.join(root, ".env");
const prismaEnvPath = path.join(root, "prisma", ".env");
const schemaPath = path.join(root, "prisma", "schema.prisma");

const isPostgresUrl = (value) =>
  typeof value === "string" && /^postgres(?:ql)?:\/\//i.test(value.trim());

const isProduction = process.env.NODE_ENV === "production";
const loadEnvIfNeeded = (filepath, label) => {
  if (!isProduction && !process.env.DATABASE_URL && fs.existsSync(filepath)) {
    dotenv.config({ path: filepath, override: true });
    console.info(`[prisma] ${label} chargé`);
    return true;
  }
  return false;
};

const loadedEnvLocal = loadEnvIfNeeded(envLocalPath, ".env.local");
const loadedEnvRoot = loadEnvIfNeeded(envPath, ".env");
const loadedPrismaEnv = loadEnvIfNeeded(prismaEnvPath, "prisma/.env");

if (!loadedEnvLocal && !loadedEnvRoot && !loadedPrismaEnv && !isProduction) {
  console.info("[prisma] Pas de chargement de fichier env (pas de .env.local/.env/prisma/.env ou DATABASE_URL déjà défini). On utilise process.env.");
}

const args = process.argv.slice(2);

if (!process.env.DATABASE_URL) {
  if (args[0] === "generate") {
    // Prisma generate n'a pas besoin d'une base accessible, juste d'une URL valide.
    process.env.DATABASE_URL =
      "postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public";
    console.warn(
      "[prisma] DATABASE_URL manquant, utilisation d'un placeholder pour prisma generate (ajoutez une vraie URL PostgreSQL pour les autres commandes).",
    );
  } else {
    console.error(
      "DATABASE_URL manquant pour Prisma. Fournissez-le via les variables d'environnement (ou .env.local/.env).",
    );
    process.exit(1);
  }
}

let provider = "postgresql";
try {
  const schema = fs.readFileSync(schemaPath, "utf8");
  const match = schema.match(/provider\s*=\s*\"([^\"]+)\"/);
  if (match) {
    provider = match[1];
  }
} catch {
  // ignore
}

if (provider === "postgresql" && !isPostgresUrl(process.env.DATABASE_URL)) {
  console.error(
    "[prisma] DATABASE_URL doit commencer par postgres:// ou postgresql:// (provider=postgresql). " +
      "Mettez à jour prisma/.env ou vos variables d'environnement.",
  );
  process.exit(1);
}

const child = spawn("npx", ["prisma", ...args], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
