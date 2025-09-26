#!/bin/sh

# Debug: Check if script is running
echo "Starting nginx startup script..."
echo "Script location: $(pwd)"
echo "Script permissions: $(ls -la /start-nginx.sh 2>/dev/null || echo 'Script not found')"
echo "Current user: $(whoami)"
echo "Available commands: $(which wget nginx 2>/dev/null || echo 'Commands not found')"
echo "Nginx configuration check:"
ls -la /etc/nginx/ 2>/dev/null || echo "Nginx config directory not found"

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
  echo "WARNING: Backend did not become ready within $((MAX_ATTEMPTS * 2)) seconds"
  echo "Starting nginx anyway - backend may become available later"
  # Don't exit, just continue with nginx startup
fi

echo "Backend is ready, starting nginx..."

# Start nginx
exec nginx -g "daemon off;"