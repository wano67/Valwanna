#!/usr/bin/env node
const bcrypt = require("bcryptjs");

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error(
      "Usage: npm run hash:password -- <mot-de-passe>\nLe mot de passe n'est pas enregistré, seul le hash est affiché."
    );
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  } catch (error) {
    console.error("Impossible de générer le hash bcrypt:", error);
    process.exit(1);
  }
}

main();
