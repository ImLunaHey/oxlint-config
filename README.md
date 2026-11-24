# @imlunahey/oxlint-config

Importable Oxlint configuration and custom component-boundary rules. No ESLint
runner or configuration is used. Oxfmt handles formatting.

## Install from GitHub Packages

The public release is `@imlunahey/oxlint-config@0.1.0` on GitHub Packages.
Add this scope mapping to your project's `.npmrc`:

```ini
@imlunahey:registry=https://npm.pkg.github.com
```

GitHub's npm registry requires authentication even for public packages. You can
reuse an existing GitHub CLI login without manually creating a PAT:

```sh
gh auth refresh --hostname github.com --scopes read:packages
mkdir -p "$HOME/.local/bin"
cat > "$HOME/.local/bin/luna-github-packages-token" <<'HELPER'
#!/usr/bin/env sh
exec gh auth token --hostname github.com
HELPER
chmod 700 "$HOME/.local/bin/luna-github-packages-token"
```

Add the following to your **user** `~/.npmrc`, replacing the helper path with
your absolute path (pnpm only allows `tokenHelper` in user configuration):

```ini
//npm.pkg.github.com/:tokenHelper=/absolute/path/to/.local/bin/luna-github-packages-token
```

Then install with pnpm:

```sh
pnpm add -D oxlint @imlunahey/oxlint-config@0.1.0
```

For GitHub Actions use `permissions: { contents: read, packages: read }`,
configure `actions/setup-node` with `registry-url: https://npm.pkg.github.com`
and `scope: '@imlunahey'`, and set `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`
on the pnpm install step. Do not commit credentials or vendor a package archive.

Publish version tags through `.github/workflows/publish.yml`; it uses the
workflow's `GITHUB_TOKEN` with `packages: write`. No shared PAT is required.

## Use the configuration

```ts
// oxlint.config.ts
import { lunaConfig } from "@imlunahey/oxlint-config/config";
export default lunaConfig({
  componentDirectories: ["src/components"],
  // For a monorepo, use e.g. ['packages/ui/src'] instead.
});
```

Run `pnpm exec oxlint -c oxlint.config.ts .`. The configuration enables Oxlint's
correctness rules, TypeScript and accessibility plugins, and
`luna/no-raw-controls`. The custom rule supports JS, JSX, TS and TSX, HTML strings,
and native DOM construction. Native button/input/textarea/select/dialog/table/
progress/meter elements belong only in configured component directories.
Paths are relative to the lint invocation's working directory. Invoke from the
project root; do not broadly allow an entire application directory.

For authored HTML files, run the companion `luna-lint-html boundary.config.json`:

```json
{
  "componentDirectories": ["src/components"],
  "ignoreDirectories": ["tests", "coverage"]
}
```

Oxlint does not lint standalone HTML, so the companion uses the same rule engine,
Parse5 for markup, and the Oxc parser for embedded scripts. Generated `dist`,
`node_modules`, `.git`, `.turbo`, and `.runtime` are always skipped. App-specific
output directories can be listed explicitly. No `design` or `tests` exceptions
are imposed on consuming projects by default.

`./plugin` exposes just the Oxlint JS plugin; `./boundary` exposes `lintSource`
and `lintProject` for build integration. This is a static architectural rule,
not a security boundary against deliberately obfuscated code.

Validation: `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm format:check`.
Tests run the real Oxlint CLI from an independent consumer directory.
