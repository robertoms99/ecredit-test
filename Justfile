# eCredit Justfile - Docker Compose Management
#
# Usage:
#   just start          # Start with Bun backend (Socket.IO)
#   just start-elixir   # Start with Elixir backend (Phoenix Channels)
#   just down           # Stop all services
#   just clean          # Stop services and remove volumes
#   just logs <service> # Follow logs (backend, frontend, db, redis, provider-sim)
#   just ps             # Show service status

set shell := ["bash", "-cu"]

ENV_FILE := ".env"
COMPOSE := "docker compose"

default:
  @echo "🚀 eCredit - Available Commands:"
  @echo ""
  @just --list

# Start eCredit with Bun backend (Socket.IO)
start:
  #!/usr/bin/env bash
  set -euo pipefail

  echo "🚀 Starting eCredit with Bun backend..."
  echo ""

  # Create .env if missing
  if [ ! -f "{{ENV_FILE}}" ]; then
    cp .env.example "{{ENV_FILE}}"
    echo "✅ Created {{ENV_FILE}} from .env.example"
    echo ""
  fi

  # Extract ports from .env
  FRONTEND_PORT=$(grep "^FRONTEND_PORT=" "{{ENV_FILE}}" | cut -d'=' -f2 || echo "5173")
  BACKEND_PORT=$(grep "^BACKEND_PORT=" "{{ENV_FILE}}" | cut -d'=' -f2 || echo "3000")
  PROVIDER_PORT=$(grep "^PROVIDER_PORT=" "{{ENV_FILE}}" | cut -d'=' -f2 || echo "3001")

  # Start Docker Compose
  {{COMPOSE}} up -d --build

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ eCredit System Ready! (Bun + Socket.IO)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📱 Frontend:     http://localhost:$FRONTEND_PORT"
  echo "🔌 Backend API:  http://localhost:$BACKEND_PORT"
  echo "🏦 Provider Sim: http://localhost:$PROVIDER_PORT"
  echo ""
  echo "🔐 Test Credentials:"
  echo "   Email: admin1@ecredit.com"
  echo "   Pass:  admin123456"
  echo ""

# Start eCredit with Elixir backend (Phoenix Channels)
start-elixir:
  #!/usr/bin/env bash
  set -euo pipefail

  echo "🚀 Starting eCredit with Elixir backend..."
  echo ""

  # Create .env if missing
  if [ ! -f "{{ENV_FILE}}" ]; then
    cp .env.example "{{ENV_FILE}}"
    echo "✅ Created {{ENV_FILE}} from .env.example"
    echo ""
  fi

  # Extract configuration from .env
  FRONTEND_PORT=$(grep "^FRONTEND_PORT=" "{{ENV_FILE}}" | cut -d'=' -f2 || echo "5173")
  BACKEND_EX_PORT=$(grep "^BACKEND_EX_PORT=" "{{ENV_FILE}}" | cut -d'=' -f2 || echo "4000")
  PROVIDER_PORT=$(grep "^PROVIDER_PORT=" "{{ENV_FILE}}" | cut -d'=' -f2 || echo "3001")
  VITE_API_URL=$(grep "^VITE_API_URL=" "{{ENV_FILE}}" | cut -d'=' -f2 || echo "")
  VITE_REALTIME=$(grep "^VITE_REALTIME_PROVIDER=" "{{ENV_FILE}}" | cut -d'=' -f2 || echo "")

  # Validate configuration for Elixir backend
  EXPECTED_URL="http://localhost:$BACKEND_EX_PORT"
  EXPECTED_PROVIDER="phoenix"

  HAS_ERROR=false

  if [[ "$VITE_API_URL" != "$EXPECTED_URL" ]]; then
    echo "❌ ERROR: VITE_API_URL is not configured for Elixir backend"
    echo "   Current:  $VITE_API_URL"
    echo "   Expected: $EXPECTED_URL"
    echo ""
    HAS_ERROR=true
  fi

  if [[ "$VITE_REALTIME" != "$EXPECTED_PROVIDER" ]]; then
    echo "❌ ERROR: VITE_REALTIME_PROVIDER is not configured for Elixir backend"
    echo "   Current:  $VITE_REALTIME"
    echo "   Expected: $EXPECTED_PROVIDER"
    echo ""
    HAS_ERROR=true
  fi

  if [[ "$HAS_ERROR" == "true" ]]; then
    echo "📝 To use Elixir backend, update {{ENV_FILE}} with:"
    echo ""
    echo "   VITE_API_URL=$EXPECTED_URL"
    echo "   VITE_REALTIME_PROVIDER=$EXPECTED_PROVIDER"
    echo ""
    exit 1
  fi

  # Start Docker Compose with Elixir profile
  {{COMPOSE}} --profile elixir up --build

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ eCredit System Ready! (Elixir + Phoenix)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📱 Frontend:     http://localhost:$FRONTEND_PORT"
  echo "🔌 Backend API:  http://localhost:$BACKEND_EX_PORT"
  echo "📊 Oban UI:      http://localhost:$BACKEND_EX_PORT/oban"
  echo "🏦 Provider Sim: http://localhost:$PROVIDER_PORT"
  echo ""
  echo "🔐 Test Credentials:"
  echo "   Email: admin1@ecredit.com"
  echo "   Pass:  admin123456"
  echo ""

# Stop all services (keeps volumes)
down:
  {{COMPOSE}} down

# Stop services and remove volumes
clean:
  {{COMPOSE}} down -v
  @echo "✅ All services stopped and volumes removed"

# Build Docker images
build:
  {{COMPOSE}} build

# Rebuild and restart services
rebuild:
  {{COMPOSE}} build && {{COMPOSE}} up -d
  @echo "✅ Services rebuilt and restarted"

# Show service status
ps:
  {{COMPOSE}} ps

# Follow logs for a specific service
logs SERVICE:
  {{COMPOSE}} logs -f {{SERVICE}}

# Backend logs (convenience)
backend-logs:
  {{COMPOSE}} logs -f backend

# Frontend logs (convenience)
frontend-logs:
  {{COMPOSE}} logs -f frontend

# Provider simulator logs (convenience)
provider-logs:
  {{COMPOSE}} logs -f provider-sim

# Redis logs (convenience)
redis-logs:
  {{COMPOSE}} logs -f redis

# Database logs (convenience)
db-logs:
  {{COMPOSE}} logs -f db

# Open PostgreSQL shell
db-shell:
  #!/usr/bin/env bash
  POSTGRES_USER=$(grep "^POSTGRES_USER=" "{{ENV_FILE}}" | cut -d'=' -f2 || echo "postgres")
  POSTGRES_DB=$(grep "^POSTGRES_DB=" "{{ENV_FILE}}" | cut -d'=' -f2 || echo "ecredit_dev")
  docker exec -it ecredit-db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# Open shell in a running container
shell SERVICE:
  docker exec -it ecredit-{{SERVICE}} sh
