#!/usr/bin/env node
// Simple env validator for local troubleshooting.
// Loads .env.local if present and checks required variables without printing secrets.

const fs = require("fs");
const path = require("path");

const dotenvPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(dotenvPath)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv").config({ path: dotenvPath });
}

const guidance = `
Placez .env.local à la racine (même niveau que package.json), puis relancez "npm run dev".
Commandes utiles :
  npm run hash:password -- "motDePasse"
  npm run prisma:migrate -- --name init
  npm run dev
`;

const checks = [
  {
    name: "DATABASE_URL",
    value: process.env.DATABASE_URL,
    validate: (val) => Boolean(val && val.trim() !== ""),
    message: "DATABASE_URL manquant.",
  },
  {
    name: "ADMIN_USERNAME",
    value: process.env.ADMIN_USERNAME,
    validate: (val) => Boolean(val && val.trim() !== ""),
    message: "ADMIN_USERNAME manquant.",
  },
  {
    name: "ADMIN_PASSWORD / ADMIN_PASSWORD_HASH",
    value: {
      hash: process.env.ADMIN_PASSWORD_HASH,
      plain: process.env.ADMIN_PASSWORD,
    },
    validate: (val) => {
      const hashOk =
        val.hash &&
        /^(?:\$2[aby]\$)/.test(val.hash) &&
        !val.hash.includes("remplacez");
      const plainOk =
        val.plain &&
        val.plain.length >= 8 &&
        !val.plain.includes("remplacez") &&
        !val.plain.includes("changez-moi");
      return Boolean(hashOk || plainOk);
    },
    message:
      "ADMIN_PASSWORD_HASH manquant ou invalide, et aucun ADMIN_PASSWORD (>=8 caractères) fourni.",
  },
  {
    name: "SESSION_PASSWORD",
    value: process.env.SESSION_PASSWORD,
    validate: (val) =>
      Boolean(val && val.length >= 32 && !val.includes("changez-moi")),
    message:
      "SESSION_PASSWORD manquant ou trop court (>=32 caractères) / placeholder détecté.",
  },
];

const errors = checks
  .filter((check) => !check.validate(check.value))
  .map((check) => `- ${check.message}`);

if (errors.length) {
  console.error("Configuration env incomplète :");
  console.error(errors.join("\n"));
  console.error(guidance);
  process.exit(1);
} else {
  console.log("✅ .env.local OK pour lancer Prisma et Next.js");
}
