#!/bin/sh

# Debug: Check if script is running
echo "Starting nginx startup script..."
echo "Script location: $(pwd)"
echo "Script permissions: $(ls -la /start-nginx.sh)"

# Wait for backend to be ready with timeout
echo "Waiting for backend to be ready..."
MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if wget --quiet --tries=1 --spider http://backend:3001/api/health; then
    echo "Backend is ready, starting nginx..."
    break
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  echo "Backend not ready yet, waiting... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
  sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "ERROR: Backend did not become ready within $((MAX_ATTEMPTS * 2)) seconds"
  echo "Backend container logs:"
  # Try to get backend logs if possible
  exit 1
fi

echo "Backend is ready, starting nginx..."

# Start nginx
exec nginx -g "daemon off;"