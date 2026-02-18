#!/bin/sh
API_URL="${API_URL:-http://localhost:3000}"

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__env = {
  API_URL: "${API_URL}"
};
EOF

echo "✓ Frontend configuration created:"
echo "  API_URL: ${API_URL}"

exec "$@"
