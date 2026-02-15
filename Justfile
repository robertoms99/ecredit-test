default: run

set shell := "bash"

run:
  bun run src/server.ts

worker:
  bun run src/jobs/worker.ts

migrate:
  bun run scripts/migrate.ts

dev:
  bun run src/server.ts & bun run src/jobs/worker.ts
