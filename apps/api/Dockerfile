FROM oven/bun:1.2.20-slim

WORKDIR /app

# Install build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make gcc g++ && rm -rf /var/lib/apt/lists/*

# Copy root workspace files
COPY package.json bun.lock ./
COPY packages/ packages/

# Copy API app
COPY apps/api/ apps/api/

# Copy dashboard package.json for workspace resolution (no source code needed)
COPY apps/dashboard/package.json apps/dashboard/package.json

# Install dependencies
RUN cd apps/api && bun install

# Generate Prisma client
COPY apps/api/prisma apps/api/prisma
RUN cd apps/api && bunx prisma generate

CMD ["bun", "run", "apps/api/src/index.tsx"]
