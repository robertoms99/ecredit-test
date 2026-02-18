# Usage examples:
#   just up            # start services in background
#   just down          # stop services
#   just clean         # stop and remove volumes
#   just build         # build images
#   just ps            # show service status
#   just logs backend  # follow logs for a service (db, backend, frontend, provider-sim, redis)
#   just shell backend # open a shell in a running container
#   just db-shell      # open psql in the Postgres container

set shell := ["bash", "-cu"]

ENV_FILE := ".env.docker"
COMPOSE := "docker compose"

default:
  @echo "Available tasks:"
  @just --list

start:
  @echo "🚀 Starting eCredit..."
  {{COMPOSE}} --env-file {{ENV_FILE}} build
  {{COMPOSE}} --env-file {{ENV_FILE}} up
  @echo "✅ Ready frontend app at http://localhost:8080"

up:
  # Starts all services in background
  {{COMPOSE}} up -d

down:
  # Stops services (keeps volumes)
  {{COMPOSE}} down

clean:
  # Stops services and removes volumes
  {{COMPOSE}} down -v

build:
  # Builds images defined in docker-compose.yml
  {{COMPOSE}} build

rebuild:
  # Builds images then starts services
  {{COMPOSE}} build && {{COMPOSE}} up -d

ps:
  # Shows service status
  {{COMPOSE}} ps

logs SERVICE:
  # Follows logs of a specific service (db, backend, frontend, provider-sim, redis)
  {{COMPOSE}} logs -f {{SERVICE}}

shell SERVICE:
  # Opens an interactive shell in a running container by service name
  docker exec -it $( {{COMPOSE}} ps --services --format json | jq -r '.[]' | grep -E "^{{SERVICE}}$" >/dev/null && {{COMPOSE}} ps -q {{SERVICE}} ) sh || true

backend-logs:
  # Convenience: follow backend service logs
  {{COMPOSE}} logs -f backend

frontend-logs:
  # Convenience: follow frontend service logs
  {{COMPOSE}} logs -f frontend

provider-logs:
  # Convenience: follow provider-sim service logs
  {{COMPOSE}} logs -f provider-sim

redis-logs:
  # Convenience: follow redis service logs
  {{COMPOSE}} logs -f redis

db-logs:
  # Convenience: follow db service logs
  {{COMPOSE}} logs -f db

db-shell:
  # Open psql inside the Postgres container (uses env defaults if not set)
  docker exec -it ecredit-db sh -lc 'psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-ecredit_dev}'
