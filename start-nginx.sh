#!/bin/sh
echo "Waiting for backend to be ready..."
MAX_ATTEMPTS=60
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if wget --quiet --tries=1 --spider http://backend:3001/api/health; then
    echo "Backend is ready!"
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  echo "Backend not ready yet, waiting... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
  sleep 2
done
if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "WARNING: Backend did not become ready within $((MAX_ATTEMPTS * 2)) seconds"
  echo "Starting nginx anyway - backend may become available later"
fi
echo "Starting nginx..."
exec nginx -g "daemon off;"
