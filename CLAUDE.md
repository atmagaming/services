## Monorepo Structure

```
atma/
  apps/
    backend/      # Hono API + Telegram Bot (Render, Docker)
    dashboard/    # Svelte SPA (Vercel, adapter-static)
    web/          # Next.js static marketing site (Vercel)
  packages/
    google-api/   # Shared Google Drive/Docs/Calendar/OAuth
    signing/      # Shared DigiSigner + PDF signature box extraction
    notion/       # Shared Notion API wrapper
    types/        # Shared Person/Role/Status types
```

## Architecture

- **Backend** (`api.atmagaming.com`): Hono server on Bun, handles all API routes + Telegram bot
- **Dashboard** (`dashboard.atmagaming.com`): SvelteKit + Svelte 5 SPA with adapter-static, fetches from API
- **Web** (`atmagaming.com`): Next.js static marketing site

## Auth

- JWT Bearer tokens (not cookies)
- Dashboard stores token in localStorage
- All API calls include `Authorization: Bearer <token>`

## Key Commands

- `bun install` from root to install all workspaces
- `bun run lint` / `bun run format` from root for biome
- Use `ide getDiagnostics` MCP tool to check issues in current files
- Do not run full `build` to check

## Code Style

- Use `??` instead of `||` for defaults
- No `getXXX()`/`setXXX()` methods — use property accessors
- No unnecessary `?` optional chaining
- Don't use `!` — throw descriptive errors
- Don't abbreviate names (exceptions: `i` for loop index, `e` in catch, `x`/`y` for coordinates)
- Single-statement blocks: no braces, one line (e.g., `if (condition) throw error;`)
- Compact object returns: `return { inlineData: { mimeType, data } };`
- Use `Promise.withResolvers()` instead of `new Promise()` when exposing resolve/reject outside executor
- Don't define excessive helper interfaces/types — rely on TypeScript inference
- Never silence errors: `catch (e) { throw new Error("Descriptive message: " + e.message); }`
- Write self-explanatory code; avoid obvious comments

```typescript
class Example {
  private readonly field = new Field(); // assign directly when possible
  constructor(private readonly dependency: Dependency) {} // use constructor when init requires params
}
```

## @elumixor Packages

### `@elumixor/di`
Singleton DI container. Classes as tokens, no decorators.
```typescript
@di.injectable class MyService { ... }
new MyService(); // registers singleton
di.inject(MyService);
di.inject(MyService, { optional: true }); // undefined if not registered
```

### `@elumixor/event-emitter`
Type-safe event emitter. Use instead of callbacks.
```typescript
readonly clicked = new EventEmitter();
readonly changed = new EventEmitter<number>();
emitter.emit(42);
const sub = emitter.subscribe((v) => { ... }); sub.unsubscribe();
emitter.subscribeOnce((v) => { ... });
const value = await emitter.nextEvent;
```

### `@elumixor/extensions`
`import "@elumixor/extensions";` — adds `.first`, `.last`, `.isEmpty`, `.shuffle()`, `.pick()`, `Array.range()`, `.capitalize()`.

### `@elumixor/frontils`
`all()` (typed Promise.all), `assert()`, `delay(seconds)`, `random`, `nonNull()`, `zip()`, `DefaultMap`.

## Database (Turso/libSQL)

- Turso SQLite database, credentials in root `.env` (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`)
- Prisma schema split into `apps/backend/prisma/schema/*.prisma` (multi-file)
- `prisma.config.ts` uses `file:./prisma/dev.db` for local migration generation (Prisma can't connect to libSQL directly)
- Generate migration: `bun run prisma migrate dev --name <name> --create-only` (from `apps/backend/`)
- Apply to Turso: `turso db shell finances < prisma/migrations/<timestamp>_<name>/migration.sql`
- Auto-generated migration SQL for column renames/PK changes is often wrong — always review and fix manually
- `prisma/dev.db` is gitignored; it's only for local migration diffing

## Render Deployment

- Use `-o` flag for non-interactive output in `render` CLI commands
- Sync `.env` changes with Render environment variable settings

## Security

- Never commit secrets or API keys. Use `.env.local` with placeholders; add to `.gitignore`.
