#!/usr/bin/env node
// Builds the .mcpb Desktop Extension bundle for Claude Desktop.
// Usage: npm run build && node scripts/build-mcpb.mjs
// Output: <name>-<version>.mcpb in the repo root.
import { execSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { readFileSync } from "node:fs";

const root = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
if (pkg.version !== manifest.version) {
  console.error(`version mismatch: package.json ${pkg.version} vs manifest.json ${manifest.version}`);
  process.exit(1);
}
if (!existsSync(join(root, "dist"))) {
  console.error("dist/ missing: run `npm run build` first");
  process.exit(1);
}

const stage = mkdtempSync(join(tmpdir(), "mcpb-"));
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: "inherit", shell: true });
try {
  for (const f of ["package.json", "package-lock.json", "manifest.json", "LICENSE"]) {
    cpSync(join(root, f), join(stage, f));
  }
  cpSync(join(root, "dist"), join(stage, "dist"), { recursive: true });
  run("npm ci --omit=dev --ignore-scripts", stage);
  const out = join(root, `${manifest.name}-${manifest.version}.mcpb`);
  run(`npx -y @anthropic-ai/mcpb@latest pack . "${out}"`, stage);
  console.log(`\nbundle: ${out}`);
} finally {
  rmSync(stage, { recursive: true, force: true });
}
