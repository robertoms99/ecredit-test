#!/bin/sh
set -e

echo "🚀 Starting eCredit Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database..."

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:pass@host:port/db
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\(.*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

max_attempts=30
attempt=0

# Wait for PostgreSQL to accept connections
until nc -z $DB_HOST $DB_PORT 2>/dev/null || [ $attempt -eq $max_attempts ]; do
  attempt=$((attempt + 1))
  echo "  Attempt $attempt/$max_attempts - Database not ready yet..."
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Database connection timeout"
  exit 1
fi

echo "✅ Database is ready"

# Run seed for production
echo "🌱 Seeding database..."
bun run db:seed:prod

# Start the server
echo "🚀 Starting server..."
exec bun run start
