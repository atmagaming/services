## Icons

- Use [Lucide](https://lucide.dev/) icons (`@lucide/svelte` package): `import Home from "@lucide/svelte/icons/home";`
- For custom icons, fetch from Brandfetch using the client id from `.env`: `https://cdn.brandfetch.io/notion.so/w/128?c=CLIENT_ID`. Store in project and import as needed.

## Development

- Charts use **Apache ECharts** directly
- Do not run full `build` to check
- Use `ide getDiagnostics` MCP tool to check issues in the current file
- Run `bun run lint` / `bun run format` after changes

## Manual Testing

Use `bun run test` to check/launch the dev server and watch logs:
```bash
bun run test              # Check server and watch logs
bun run free-port         # Kill process on port 3000
bun run free-port 8000    # Kill process on port 8000
```
Logs: `logs/requests.log` (HTTP requests), `logs/errors.log` (errors)
