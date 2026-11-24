# @imlunahey/oxlint-config

Importable Oxlint configuration and custom component-boundary rules. No ESLint
runner or configuration is used. Oxfmt handles formatting.

```sh
pnpm add -D oxlint github:ImLunaHey/oxlint-config#luna/initial-project
```

Use a commit SHA instead of the branch when pinning an application dependency.
Private GitHub installs require the same repository access as cloning.

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

No registry release has been published. Git installs work without a build step,
or use `pnpm pack` and install the resulting archive. Changesets describe future
package releases; publishing requires an explicit release decision.
