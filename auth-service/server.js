'use strict';

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const API_TARGET = process.env.API_TARGET || 'http://localhost:3000';

// Security/light defaults
app.disable('x-powered-by');

// Proxy API requests to backend FIRST (before static files)
// This ensures /v1/api/* routes are proxied, not served as static files
app.use(
  '/v1/api',
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    logLevel: 'debug',
    ws: false, // Disable websocket proxying
    // Path rewriting: Express strips /v1/api when using app.use('/v1/api', ...)
    // So we need to add it back: /auth/register -> /v1/api/auth/register
    pathRewrite: function (path, req) {
      const newPath = `/v1/api${path}`;
      console.log(`[PATH REWRITE] ${path} -> ${newPath}`);
      return newPath;
    },
    onError: (err, req, res) => {
      console.error('[PROXY ERROR]', err.message);
      if (!res.headersSent) {
        res.status(500).json({ 
          status: 'error', 
          message: 'Proxy error: ' + err.message,
          hint: 'Make sure the API server is running on ' + API_TARGET
        });
      }
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[PROXY REQ] ${req.method} ${req.url}`);
      console.log(`[PROXY REQ] Forwarding to: ${API_TARGET}${req.url}`);
      console.log(`[PROXY REQ] Headers:`, JSON.stringify(req.headers, null, 2));
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[PROXY RES] ${proxyRes.statusCode} ${proxyRes.statusMessage} for ${req.method} ${req.url}`);
    }
  })
);

// Serve static assets from this folder (after proxy)
// Only serve HTML files, not API routes
const staticDir = __dirname;
app.use((req, res, next) => {
  // Skip static middleware for API routes
  if (req.path.startsWith('/v1/api')) {
    return next();
  }
  next();
}, express.static(staticDir, { 
  index: false, // Don't auto-serve index.html for all routes
  extensions: ['html'],
  setHeaders: (res, path) => {
    // Only set headers for HTML files
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// Explicit routes for HTML pages (after proxy, before 404)
app.get('/', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(staticDir, 'register.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(staticDir, 'dashboard.html'));
});

// 404 handler - if it's an API route, give helpful error
app.use((req, res) => {
  if (req.path.startsWith('/v1/api')) {
    console.error(`[404] API route not found: ${req.method} ${req.path}`);
    res.status(404).json({
      status: 'error',
      message: `API route not found: ${req.method} ${req.path}`,
      hint: 'Check if the API server is running and the route exists'
    });
  } else {
    res.status(404).send('Page not found');
  }
});

app.listen(PORT, () => {
  console.log(`Auth static server running on http://localhost:${PORT}`);
  console.log(`Proxying API to ${API_TARGET}`);
  console.log(`Test API: curl http://localhost:${PORT}/v1/api/auth/register`);
});


