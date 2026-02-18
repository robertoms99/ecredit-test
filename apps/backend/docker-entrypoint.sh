#!/bin/sh
set -e

echo "🚀Starting eCredit Backend..."

echo "⏳ Waiting for database..."


echo "✅ Database is ready"

echo "🌱 Seeding database..."
bun run db:seed:prod

echo "🚀 Starting server..."
exec bun run start
