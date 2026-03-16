Inherits from ../../CLAUDE.md

# CLAUDE.md

## Agent System

Uses OpenAI Agents SDK. Each agent has a specific role and defined tool set.

- `src/master-agent.ts`: Main orchestrator agent
- `src/tools/*`: Tool definitions by domain (e.g., `calendar`, `drive`, `telegram`)
  - Sub-agents may exist within tool directories (e.g., `src/tools/calendar/calendar-agent.ts`)
- **Never use `.optional()` for tool parameters** — use `.nullable()` instead; use `?? default` or `?? undefined` when passing nullable values to functions expecting `undefined`
- **Never use `z.record()` for tool parameters** — OpenAI rejects `propertyNames` in JSON Schema; use `z.array(z.object({ key, value }))` and convert in the execute function
- Tool names use `CamelCase`
- Keep system prompts, tool descriptions, and parameter descriptions concise

## Development

- Never run `dev` script
- Do not run full `build` to check
- Write short tests as plain `.ts` files (not `.test.ts`) and run with `bun run my-test-file.ts`
- Run `bun run lint` / `bun run format` after changes
