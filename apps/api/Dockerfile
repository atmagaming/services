FROM oven/bun:1.2.20-slim

WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock ./
COPY packages/ packages/

# Copy API app
COPY apps/api/ apps/api/

# Install dependencies
RUN cd apps/api && bun install --production

# Generate Prisma client
COPY apps/api/prisma apps/api/prisma
RUN cd apps/api && bunx prisma generate

CMD ["bun", "run", "apps/api/src/index.tsx"]
