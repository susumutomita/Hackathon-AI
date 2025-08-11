# Repository Guidelines

## Project Structure & Module Organization

- `src/app` and `src/pages/api`: Next.js routes (App Router + API).
- `src/components`, `src/hooks`, `src/lib`: UI and utilities.
- `src/adapters`, `src/factories`, `src/interfaces`: Domain modules.
- Tests live in `**/__tests__` with mocks in `src/__mocks__`.
- Static assets in `public/`. Config in root (e.g., `tsconfig.json`, `vitest.config.ts`, `tailwind.config.ts`).

## Build, Test, and Development Commands

- `pnpm dev` / `make dev`: Run the app locally at `http://localhost:3000`.
- `pnpm build` / `make build`: Production build via Next.js
- `pnpm start` / `make start`: Start the built app.
- `pnpm test` / `make test`: Run Vitest; `pnpm run test:coverage` for coverage.
- `pnpm lint`: Run ESLint.
- `pnpm run format_check`: Check formatting with Prettier.
- `pnpm run typecheck`: TypeScript type-check.
- Pre-commit hook runs `make before_commit`.
- Sequence: lint → typecheck → format_check → build → test.

## Coding Style & Naming Conventions

- TypeScript with Next.js (ESLint extends `next/core-web-vitals`). Use Prettier for formatting.
- Indentation/quotes handled by Prettier; do not hand-format.
- React components/types: `PascalCase`. Files/dirs: `kebab-case`. Variables/functions: `camelCase`.
- Keep modules focused; colocate tests next to code or under `__tests__`.

## Testing Guidelines

- Framework: Vitest with V8 coverage. Target coverage ≥ 90％
- Test files: `*.test.ts` / `*.test.tsx` under `**/__tests__` (e.g., `src/lib/__tests__/foo.test.ts`).
- Use `pnpm test:watch` during dev; `pnpm test:coverage` in CI.
- Place shared fakes/stubs in `src/__mocks__`.

## Commit & Pull Request Guidelines

- Conventional Commits with optional emoji and scope (seen in history):
  - Example: `feat(ui): add idea search (#123)` or `🐛 fix: improve error logging`.
- PRs: clear description, linked issues, before/after screenshots for UI, and check that pre-commit passes.

## Security & Configuration Tips

- Secrets via `.env` / `.env.test`; never commit keys. Required examples: `QD_URL`, `QD_API_KEY`, `NOMIC_API_KEY`, model settings.
- Node ≥ 18 and pnpm ≥ 8. Install with `make install` or `pnpm install`.
- For MCP server: `pnpm run mcp:install` then `pnpm run mcp:build` (reads env from `.env`).

## Spec‑Driven Development (Claude Code)

- See `CLAUDE.md` for Kiro‑style Spec‑Driven Development. When using Claude Code, drive features via specs under `.kiro/`.
- Core flow (three approvals):
  1) Requirements → 2) Design → 3) Tasks. Approve each phase by updating `spec.json` flags.
- Common slash commands:
  - `/spec-init [feature]`
  - `/spec-requirements [feature]`
  - `/spec-design [feature]`
  - `/spec-tasks [feature]`
  - `/spec-status [feature]`
- Steering docs (optional): `/steering-init`, `/steering-update` to keep product/tech/structure current under `.kiro/steering/`.
- During implementation, update `tasks.md` checkboxes and ensure pre‑commit passes before opening a PR.
