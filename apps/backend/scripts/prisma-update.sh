#!/bin/bash
set -e

NAME=${1:-"update_$(date +%Y%m%d%H%M%S)"}

bun prisma migrate dev --name "$NAME"

LATEST=$(ls prisma/migrations | grep -v migration_lock | tail -1)
turso db shell finances < "prisma/migrations/$LATEST/migration.sql"

bun prisma generate
