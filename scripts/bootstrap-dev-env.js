#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");
const dotenv = require("dotenv");

const root = process.cwd();
const pkgPath = path.join(root, "package.json");
const envPath = path.join(root, ".env.local");
const prismaEnvPath = path.join(root, "prisma", ".env");
const dbPath = path.join(root, "dev.db");

function assertInRoot() {
  if (!fs.existsSync(pkgPath)) {
    console.error(
      "Impossible de trouver package.json. Exécutez ce script depuis la racine du projet.",
    );
    process.exit(1);
  }
}

function generateAdminPassword() {
  // 12-16 caractères, base64url pour éviter les symboles ambigus.
  return crypto.randomBytes(9).toString("base64url");
}

async function hashPassword(password) {
  // Kept for compatibility if ever needed, but not used in the dev bootstrap (plain password only).
  const bcrypt = require("bcryptjs");
  return bcrypt.hash(password, 12);
}

async function main() {
  assertInRoot();

  const force = process.argv.includes("--force");

  if (fs.existsSync(envPath) && !force) {
    console.log(".env.local existe déjà. Utilisez --force pour l'écraser si nécessaire.");
    console.log("Pour vérifier la configuration actuelle : npm run check:env");
    return;
  }

  const adminPassword = generateAdminPassword();
  const sessionSecret = crypto.randomBytes(32).toString("hex");

const envContent = `# DEV TEMPORAIRE - généré automatiquement
DATABASE_URL=file:./dev.db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=${adminPassword}
SESSION_PASSWORD=${sessionSecret}
`;

  fs.writeFileSync(envPath, envContent, { encoding: "utf8" });
  console.log("✅ .env.local généré (DEV TEMPORAIRE). Fichier non committé.");

  fs.mkdirSync(path.dirname(prismaEnvPath), { recursive: true });
  if (!fs.existsSync(prismaEnvPath) || force) {
    fs.writeFileSync(prismaEnvPath, 'DATABASE_URL="file:./dev.db"\n', {
      encoding: "utf8",
    });
    console.log("✅ prisma/.env généré (DATABASE_URL uniquement).");
  } else {
    console.log("prisma/.env existe déjà. Utilisez --force pour le régénérer si besoin.");
  }

  // Validation post-écriture pour s'assurer qu'aucun placeholder ou valeur invalide ne reste.
  const parsed = dotenv.parse(fs.readFileSync(envPath, "utf8"));
  const errors = [];
  if (!parsed.DATABASE_URL || parsed.DATABASE_URL.trim() === "") {
    errors.push("DATABASE_URL manquant dans .env.local");
  }
  const adminPlain = parsed.ADMIN_PASSWORD ?? "";
  if (!adminPlain || adminPlain.length < 8) {
    errors.push("ADMIN_PASSWORD manquant ou trop court (<8) dans .env.local");
  }
  if (adminPlain.includes("remplacez") || adminPlain.includes("changez-moi")) {
    errors.push("ADMIN_PASSWORD contient un placeholder dans .env.local");
  }
  const session = parsed.SESSION_PASSWORD ?? "";
  if (session.length < 32) {
    errors.push("SESSION_PASSWORD trop court (<32) ou absent dans .env.local");
  }

  if (errors.length) {
    console.error("❌ .env.local généré mais invalide :");
    console.error(errors.map((e) => `- ${e}`).join("\n"));
    console.error(
      "Relancez avec npm run bootstrap:dev:force et vérifiez que vous êtes dans le dossier contenant package.json.",
    );
    process.exit(1);
  }

  console.log("   ADMIN_USERNAME: admin");
  console.log("   ADMIN_PASSWORD (à conserver):", adminPassword);
  console.log("");

  let migrateAttempted = false;
  if (!fs.existsSync(dbPath)) {
    migrateAttempted = true;
    console.log("Base dev.db absente : tentative d'application des migrations Prisma...");
    try {
      execSync("npm run prisma:migrate", { stdio: "inherit" });
    } catch (error) {
      console.warn(
        "⚠️  Impossible d'exécuter la migration automatiquement. Lancez-la manuellement : npm run prisma:migrate",
      );
    }
  }

  console.log("Prochaines étapes :");
  if (!migrateAttempted) {
    console.log("- (optionnel) Prisma déjà initialisé. Sinon : npm run prisma:migrate");
  }
  console.log("- Démarrer le serveur : npm run dev");
  console.log("- Connexion admin : utilisateur 'admin' / mot de passe affiché ci-dessus");
}

main().catch((error) => {
  console.error("Erreur lors du bootstrap de l'environnement dev :", error);
  process.exit(1);
});
