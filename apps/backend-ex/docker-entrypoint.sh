#!/bin/sh
set -e

echo "🚀Starting eCredit Backend..."

echo "⏳ Waiting for database..."

DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\(.*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

max_attempts=30
attempt=0

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


echo "Starting Phoenix server..."
exec bin/ecredit start
