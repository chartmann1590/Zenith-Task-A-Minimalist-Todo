#!/bin/sh

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
while ! wget --quiet --tries=1 --spider http://backend:3001/api/health; do
  echo "Backend not ready yet, waiting..."
  sleep 2
done

echo "Backend is ready, starting nginx..."

# Start nginx
exec nginx -g "daemon off;"