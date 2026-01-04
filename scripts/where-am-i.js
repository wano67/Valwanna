#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const cwd = process.cwd();
const pkgPath = path.join(cwd, "package.json");
const envPath = path.join(cwd, ".env.local");

console.log("process.cwd():", cwd);
console.log("package.json trouvé :", fs.existsSync(pkgPath) ? pkgPath : "non trouvé");
console.log(".env.local attendu :", envPath);
console.log(".env.local existe :", fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  const hasDatabaseUrl = /DATABASE_URL\s*=/.test(content);
  const hasAdminUser = /ADMIN_USERNAME\s*=/.test(content);
  const hasAdminHash = /ADMIN_PASSWORD_HASH\s*=/.test(content);
  const hasSessionPassword = /SESSION_PASSWORD\s*=/.test(content);
  console.log("Clés détectées (sans valeurs) :", {
    hasDatabaseUrl,
    hasAdminUser,
    hasAdminHash,
    hasSessionPassword,
  });
} else {
  console.log("Clés détectées (sans valeurs) : fichier .env.local absent");
}
