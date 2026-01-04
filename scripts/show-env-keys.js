#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

function findRoot(start = process.cwd()) {
  let dir = start;
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

const root = findRoot();
const envLocal = path.join(root, ".env.local");
const envFile = path.join(root, ".env");

if (fs.existsSync(envLocal)) {
  dotenv.config({ path: envLocal, override: false });
} else if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile, override: false });
}

const summary = {
  nodeEnv: process.env.NODE_ENV ?? "undefined",
  hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  hasAdminUser: Boolean(process.env.ADMIN_USERNAME),
  hasAdminHash: Boolean(process.env.ADMIN_PASSWORD_HASH),
  hasAdminPasswordPlain: Boolean(process.env.ADMIN_PASSWORD),
  hasSessionPassword: Boolean(process.env.SESSION_PASSWORD),
  adminHashLooksBcrypt: Boolean(
    process.env.ADMIN_PASSWORD_HASH &&
      /^(?:\$2[aby]\$)/.test(process.env.ADMIN_PASSWORD_HASH),
  ),
  adminMode: process.env.ADMIN_PASSWORD_HASH
    ? "hash"
    : process.env.ADMIN_PASSWORD
      ? "plain"
      : "missing",
};

console.log(JSON.stringify(summary, null, 2));
