#!/usr/bin/env node

/**
 * Health check script for backend
 * This script checks if the backend is ready to accept requests
 */

import http from 'http';

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('Backend is healthy');
    process.exit(0);
  } else {
    console.log(`Backend returned status ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.log(`Backend health check failed: ${err.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('Backend health check timed out');
  req.destroy();
  process.exit(1);
});

req.end();