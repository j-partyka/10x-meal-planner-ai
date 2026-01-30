#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-console -- CLI output */
/**
 * Removes build and cache dirs so a fresh dev/build picks up env and code.
 * Run before restarting the dev server if env or code changes aren't applied.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = path.resolve(__dirname, "..");
const dirs = ["dist", ".astro", "node_modules/.vite"];

for (const dir of dirs) {
  const full = path.join(cwd, dir);
  try {
    fs.rmSync(full, { recursive: true });
    console.log("Removed", dir);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}
