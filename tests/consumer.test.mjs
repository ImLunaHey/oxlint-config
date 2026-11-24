import { test } from "vitest";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
test("real Oxlint CLI loads the imported configuration and rejects TSX controls", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "luna-oxlint-"));
  try {
    writeFileSync(
      path.join(dir, "oxlint.config.ts"),
      `import {lunaConfig} from ${JSON.stringify(path.resolve("src/config.js"))}; export default lunaConfig();`,
    );
    writeFileSync(
      path.join(dir, "app.tsx"),
      'export const App = () => <select aria-label="Choice" />;',
    );
    const executable = path.resolve("node_modules/.bin/oxlint");
    const bad = spawnSync(executable, ["-c", "oxlint.config.ts", "app.tsx"], {
      cwd: dir,
      encoding: "utf8",
    });
    assert.equal(bad.status, 1, bad.stdout + bad.stderr);
    assert.match(bad.stdout + bad.stderr, /no-raw-controls/);
    writeFileSync(path.join(dir, "app.tsx"), "export const App = () => <main>Hello</main>;");
    const good = spawnSync(executable, ["-c", "oxlint.config.ts", "app.tsx"], {
      cwd: dir,
      encoding: "utf8",
    });
    assert.equal(good.status, 0, good.stdout + good.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
