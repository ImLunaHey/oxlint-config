# Repository instructions

## Commits and pull requests

- Every commit and PR title MUST use Conventional Commits: `type(scope): summary`
  or `type: summary`. Examples: `feat(rules): reject raw selects`,
  `fix(config): resolve plugin from installed package`, `docs: explain HTML checks`.
- Use an appropriate type such as `feat`, `fix`, `refactor`, `test`, `docs`,
  `build`, `ci`, `perf`, `style`, `revert`, or `chore`. Mark breaking changes with
  `!` and explain them in a `BREAKING CHANGE:` footer.
- Work on `luna/*` branches and deliver through PRs. Never push project changes
  directly to `main` or merge without the user's explicit instruction.
- Complete `.github/pull_request_template.md` with actual validation results.

## Lint package

- This is an Oxlint package. Do not introduce an ESLint runner or configuration.
- Use pnpm and Oxfmt. Export defining modules through explicit package subpaths;
  do not create handwritten barrel files.
- Keep component directory boundaries configurable and relative to the consuming
  project's root. Do not hardcode local paths or exemptions from one application.
- Share the rule implementation between the Oxlint JS plugin and HTML companion.
  Use the Oxc parser for JS/TS/JSX/TSX and Parse5 for HTML.
- Keep native layout HTML permitted; enforce the declared control boundary.
- Test both rejected and permitted inputs, accurate diagnostics, and installation
  or configuration use from a separate consuming project.
- Add a Changeset for changes to the published API or rule behavior. Do not
  publish packages without explicit authorization.

## Validation

Run `pnpm format:check` and `pnpm check` before delivery. The latter includes
TypeScript declaration checks, Oxlint, rule tests and a real Oxlint consumer test.
Run `pnpm audit --prod` when changing dependencies. Report unrun checks honestly.
