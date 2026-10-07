#!/bin/sh
# nginx resolves the backend per request (see nginx.conf), so it no longer has
# to wait for the backend before starting: the UI is served immediately and
# /api requests return 503 until the backend is reachable.
echo "Starting nginx..."
exec nginx -g "daemon off;"
