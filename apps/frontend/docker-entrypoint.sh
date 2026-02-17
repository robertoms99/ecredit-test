#!/bin/sh
# Docker entrypoint script for eCredit Frontend
# Allows runtime configuration of environment variables

# Default values
API_URL="${API_URL:-http://localhost:3000}"

# Create env-config.js with runtime environment variables
cat > /usr/share/nginx/html/env-config.js <<EOF
window.__env = {
  API_URL: "${API_URL}"
};
EOF

echo "✓ Frontend configuration created:"
echo "  API_URL: ${API_URL}"

# Execute the main container command
exec "$@"
