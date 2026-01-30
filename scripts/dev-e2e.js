#!/usr/bin/env node
/**
 * Starts the dev server for E2E with env from .env.test so tests use the same
 * Supabase project and E2E user. Writes .env.e2e (mode-specific) so Vite
 * loads it when run with --mode e2e and overrides .env.local.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = path.resolve(__dirname, "..");
const envTestPath = path.join(cwd, ".env.test");
const envE2ePath = path.join(cwd, ".env.e2e");

dotenv.config({ path: envTestPath });

const publicUrl =
  process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const publicKey =
  process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!publicUrl || !publicKey) {
  console.error(
    "Missing SUPABASE_URL/SUPABASE_KEY or PUBLIC_SUPABASE_* in .env.test. Add them for E2E."
  );
  process.exit(1);
}

/** Escape a value for .env: wrap in double quotes if it contains space or # */
function escapeEnvValue(value) {
  const s = String(value);
  if (/[\s#"\\]/.test(s)) {
    return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return s;
}

const e2eContent = [
  `PUBLIC_SUPABASE_URL=${escapeEnvValue(publicUrl)}`,
  `PUBLIC_SUPABASE_ANON_KEY=${escapeEnvValue(publicKey)}`,
  `SUPABASE_URL=${escapeEnvValue(publicUrl)}`,
  `SUPABASE_KEY=${escapeEnvValue(publicKey)}`,
].join("\n");

fs.writeFileSync(envE2ePath, e2eContent, "utf8");

const child = spawn("npx", ["astro", "dev", "--mode", "e2e"], {
  cwd,
  env: process.env,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
