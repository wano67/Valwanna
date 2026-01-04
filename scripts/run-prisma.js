#!/usr/bin/env node
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const root = process.cwd();
const envLocalPath = path.join(root, ".env.local");

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  console.error(
    ".env.local introuvable. Générez-le avec `npm run bootstrap:dev` ou créez-le à la racine, puis relancez.",
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL manquant pour Prisma. Assurez-vous que .env.local contient DATABASE_URL, puis relancez.",
  );
  process.exit(1);
}

const args = process.argv.slice(2);

const child = spawn("npx", ["prisma", ...args], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
