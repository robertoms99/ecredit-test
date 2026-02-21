# Usage examples:
#   just start          # start with Bun backend (default)
#   just start-elixir   # start with Elixir backend
#   just up             # start services in background
#   just down           # stop services
#   just clean          # stop and remove volumes
#   just build          # build images
#   just ps             # show service status
#   just logs backend   # follow logs for a service (db, backend, frontend, provider-sim, redis)
#   just shell backend  # open a shell in a running container
#   just db-shell       # open psql in the Postgres container

set shell := ["bash", "-cu"]

ENV_FILE := ".env"
COMPOSE := "docker compose"

# Load environment variables from .env
export BACKEND_PORT := `grep "^BACKEND_PORT=" {{ENV_FILE}} 2>/dev/null | cut -d'=' -f2 || echo "3000"`
export BACKEND_EX_PORT := `grep "^BACKEND_EX_PORT=" {{ENV_FILE}} 2>/dev/null | cut -d'=' -f2 || echo "4000"`
export FRONTEND_PORT := `grep "^FRONTEND_PORT=" {{ENV_FILE}} 2>/dev/null | cut -d'=' -f2 || echo "8080"`
export PROVIDER_PORT := `grep "^PROVIDER_PORT=" {{ENV_FILE}} 2>/dev/null | cut -d'=' -f2 || echo "3001"`
export VITE_API_URL := `grep "^VITE_API_URL=" {{ENV_FILE}} 2>/dev/null | cut -d'=' -f2 || echo "http://localhost:3000"`

default:
  @echo "Available tasks:"
  @just --list

start:
  @echo "🚀 Starting eCredit with Bun backend..."
  @if [ ! -f {{ENV_FILE}} ]; then cp .env.example {{ENV_FILE}}; echo "✅ Created {{ENV_FILE}} from .env.example"; fi
  {{COMPOSE}} up -d --build
  @echo ""
  @echo "✅ System ready!"
  @echo ""
  @echo "📱 Frontend:      http://localhost:$(grep "^FRONTEND_PORT=" {{ENV_FILE}} | cut -d'=' -f2 || echo 8080)"
  @echo "🔌 Backend:       http://localhost:$(grep "^BACKEND_PORT=" {{ENV_FILE}} | cut -d'=' -f2 || echo 3000)"
  @echo "🏦 Provider Sim:  http://localhost:$(grep "^PROVIDER_PORT=" {{ENV_FILE}} | cut -d'=' -f2 || echo 3001)"
  @echo ""
  @echo "🔐 Credentials:"
  @echo "   Email: admin1@ecredit.com"
  @echo "   Pass:  admin123456"
  @echo " "
  @echo "   Email: admin2@ecredit.com"
  @echo "   Pass:  admin123456"

start-elixir:
  @echo "🚀 Starting eCredit with Elixir backend..."
  @if [ ! -f {{ENV_FILE}} ]; then cp .env.example {{ENV_FILE}}; echo "✅ Created {{ENV_FILE}} from .env.example"; fi
  @VITE_URL=$$(grep "^VITE_API_URL=" {{ENV_FILE}} | cut -d'=' -f2); \
  if [[ "$$VITE_URL" != "http://localhost:4000" ]]; then \
    echo "⚠️  WARNING: VITE_API_URL is not set to Elixir port (4000)"; \
    echo "   Current: $$VITE_URL"; \
    echo "   Expected: http://localhost:4000"; \
    echo ""; \
    echo "   Please edit {{ENV_FILE}} and change:"; \
    echo "   VITE_API_URL=http://localhost:4000"; \
    echo "   API_URL=http://localhost:4000"; \
    echo ""; \
    exit 1; \
  fi
  {{COMPOSE}} --profile elixir up -d --build
  @echo ""
  @echo "✅ System ready!"
  @echo ""
  @echo "📱 Frontend:      http://localhost:$(grep "^FRONTEND_PORT=" {{ENV_FILE}} | cut -d'=' -f2 || echo 8080)"
  @echo "🔌 Backend:       http://localhost:$(grep "^BACKEND_EX_PORT=" {{ENV_FILE}} | cut -d'=' -f2 || echo 4000)"
  @echo "📊 Oban UI:       http://localhost:$(grep "^BACKEND_EX_PORT=" {{ENV_FILE}} | cut -d'=' -f2 || echo 4000)/oban"
  @echo "🏦 Provider Sim:  http://localhost:$(grep "^PROVIDER_PORT=" {{ENV_FILE}} | cut -d'=' -f2 || echo 3001)"
  @echo ""
  @echo "🔐 Credentials:"
  @echo "   Email: admin1@ecredit.com"
  @echo "   Pass:  admin123456"
  @echo ""

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
