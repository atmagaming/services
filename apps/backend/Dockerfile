FROM oven/bun:1.2.20-slim

WORKDIR /app

# Install build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make gcc g++ && rm -rf /var/lib/apt/lists/*

# Copy root workspace files
COPY package.json bun.lock ./
COPY apps/ apps/

# Copy backend app
COPY apps/backend/ apps/backend/

# Copy dashboard package.json for workspace resolution (no source code needed)
COPY apps/dashboard/package.json apps/dashboard/package.json

# Install dependencies
RUN cd apps/backend && bun install

# Generate Prisma client
RUN cd apps/backend && bun run prisma:generate

# Generate Notion client
RUN cd apps/backend && bun run notion:generate

# Build Nitro app
RUN cd apps/backend && bun run build

CMD ["bun", "run", "apps/backend/.output/server/index.mjs"]
