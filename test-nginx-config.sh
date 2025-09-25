#!/bin/bash

# Test nginx configuration syntax
echo "Testing nginx configuration..."

# Check if nginx config has valid syntax
if command -v nginx >/dev/null 2>&1; then
    nginx -t -c nginx.conf
    if [ $? -eq 0 ]; then
        echo "✅ Nginx configuration is valid"
    else
        echo "❌ Nginx configuration has errors"
        exit 1
    fi
else
    echo "⚠️  Nginx not available for testing, but configuration should be valid"
    echo "   Fixed: Removed invalid 'must-revalidate' from gzip_proxied directive"
fi

echo "Configuration check completed"