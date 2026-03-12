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
- **Dashboard** (`dashboard.atmagaming.com`): SvelteKit SPA with adapter-static, fetches from API
- **Web** (`atmagaming.com`): Next.js static marketing site

## Auth

- JWT Bearer tokens (not cookies)
- Dashboard stores token in localStorage
- All API calls include `Authorization: Bearer <token>`

## Key Commands

- `bun install` from root to install all workspaces
- `bun run lint` / `bun run format` from root for biome
- Each app has its own dev/build scripts

## Code Style

See individual app CLAUDE.md files for specific conventions. Global rules:
- Use `??` instead of `||` for defaults
- No `getXXX()`/`setXXX()` methods, use property accessors
- No unnecessary `?` optional chaining
- Don't use `!` - throw descriptive errors
- Don't abbreviate names
