import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { fuelStore } from './server/store.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for external software integration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key, X-API-Key, X-Fuel-Signature, X-Fuel-API-Key'
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Helper to extract API key from request
function extractApiKey(req: express.Request): string | null {
  const headerKey = req.headers['x-api-key'] || req.headers['x-fuel-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim();
  }
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const queryKey = req.query.api_key || req.query.key;
  if (typeof queryKey === 'string' && queryKey.trim()) {
    return queryKey.trim();
  }
  return null;
}

// Initialize fuel scraper daemon
fuelStore.initialize().catch((err) => {
  console.error('Failed to initialize Fuel Price Store:', err);
});

// ==========================================
// API Endpoints for User's Software
// ==========================================

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Delhi Fuel Price Real-time Scraper & Daemon',
    authMethodsSupported: ['x-api-key header', 'Authorization: Bearer <key>', '?api_key=<key> query parameter'],
    timestamp: new Date().toISOString(),
  });
});

// 2. Primary endpoint: GET /api/fuel-prices/delhi
app.get('/api/fuel-prices/delhi', (req, res) => {
  const rawKey = extractApiKey(req);
  let keyValidation: { valid: boolean; key?: any; error?: string } = { valid: false };

  if (rawKey) {
    keyValidation = fuelStore.validateAndRecordUsage(rawKey);
    if (!keyValidation.valid) {
      res.status(401).json({
        success: false,
        error: keyValidation.error || 'Unauthorized: Invalid API key provided.',
        help: 'Generate an active API key in the Delhi Fuel Price Portal.',
      });
      return;
    }
    // Set authenticated headers for consuming clients
    res.setHeader('X-API-Key-Tier', keyValidation.key.tier);
    res.setHeader('X-API-Key-RateLimit', `${keyValidation.key.rateLimitPerMin}/min`);
    res.setHeader('X-API-Key-UsageCount', keyValidation.key.requestCount);
    res.setHeader('X-Auth-Status', 'authenticated');
  } else {
    res.setHeader('X-Auth-Status', 'public-access');
  }

  const data = fuelStore.getData();
  if (!data) {
    res.status(503).json({
      error: 'Fuel price data is initializing. Please retry in a moment.',
    });
    return;
  }

  res.json({
    success: true,
    auth: rawKey && keyValidation.valid ? {
      authenticated: true,
      keyName: keyValidation.key.name,
      tier: keyValidation.key.tier,
      rateLimitPerMin: keyValidation.key.rateLimitPerMin,
      requestCount: keyValidation.key.requestCount,
    } : {
      authenticated: false,
      mode: 'public-demo',
      hint: 'Include header "x-api-key: dlf_live_..." for unlimited throughput & rate limits.',
    },
    data,
  });
});

// 2b. API Key Management Endpoints
app.get('/api/keys', (req, res) => {
  res.json({
    success: true,
    keys: fuelStore.getApiKeys(),
  });
});

app.post('/api/keys', (req, res) => {
  const { name, tier, rateLimitPerMin, description, createdFor } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Key name is required.' });
    return;
  }
  const newKey = fuelStore.createApiKey({
    name,
    tier,
    rateLimitPerMin,
    description,
    createdFor,
  });
  res.json({
    success: true,
    message: 'API Key generated successfully. Keep it secure.',
    key: newKey,
  });
});

app.post('/api/keys/revoke', (req, res) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).json({ error: 'Key ID is required.' });
    return;
  }
  const revoked = fuelStore.revokeApiKey(id);
  if (!revoked) {
    res.status(404).json({ error: 'API key not found.' });
    return;
  }
  res.json({
    success: true,
    message: `API Key "${revoked.name}" has been revoked.`,
    key: revoked,
  });
});

app.delete('/api/keys/:id', (req, res) => {
  const { id } = req.params;
  const deleted = fuelStore.deleteApiKey(id);
  res.json({
    success: deleted,
    message: deleted ? 'API Key deleted.' : 'API Key not found.',
  });
});

app.post('/api/keys/test', (req, res) => {
  const { key } = req.body;
  if (!key) {
    res.status(400).json({ error: 'API Key is required to test.' });
    return;
  }
  const validation = fuelStore.validateAndRecordUsage(key);
  if (!validation.valid) {
    res.status(401).json({
      success: false,
      error: validation.error,
    });
    return;
  }
  const data = fuelStore.getData();
  res.json({
    success: true,
    authenticated: true,
    keyDetails: {
      name: validation.key?.name,
      tier: validation.key?.tier,
      rateLimitPerMin: validation.key?.rateLimitPerMin,
      totalRequests: validation.key?.requestCount,
    },
    message: 'API Key is valid and authenticated successfully.',
    data,
  });
});


// 3. Force re-scrape: POST /api/fuel-prices/refresh
app.post('/api/fuel-prices/refresh', async (req, res) => {
  try {
    const freshData = await fuelStore.refreshPrices(true);
    res.json({
      success: true,
      message: 'Scraped latest live fuel prices from official government portals.',
      data: freshData,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Scrape failed',
    });
  }
});

// 4. Historical prices: GET /api/fuel-prices/history
app.get('/api/fuel-prices/history', (req, res) => {
  res.json({
    success: true,
    city: 'Delhi',
    points: fuelStore.getHistory(),
  });
});

// 5. Scrape logs: GET /api/fuel-prices/logs
app.get('/api/fuel-prices/logs', (req, res) => {
  res.json({
    success: true,
    logs: fuelStore.getLogs(),
  });
});

// 6. Update polling interval: POST /api/fuel-prices/interval
app.post('/api/fuel-prices/interval', (req, res) => {
  const { minutes } = req.body;
  if (!minutes || typeof minutes !== 'number' || minutes < 1) {
    res.status(400).json({ error: 'Interval must be a positive number of minutes.' });
    return;
  }
  fuelStore.setIntervalMinutes(minutes);
  res.json({
    success: true,
    intervalMinutes: fuelStore.getIntervalMinutes(),
  });
});

// 7. Webhooks management
app.get('/api/fuel-prices/webhooks', (req, res) => {
  res.json({
    success: true,
    webhooks: fuelStore.getWebhooks(),
  });
});

app.post('/api/fuel-prices/webhooks', (req, res) => {
  const { url, secret, events } = req.body;
  if (!url || !url.startsWith('http')) {
    res.status(400).json({ error: 'Valid HTTP/HTTPS URL is required.' });
    return;
  }
  fuelStore.addWebhook({
    url,
    secret: secret || '',
    enabled: true,
    events: Array.isArray(events) && events.length > 0 ? events : ['price_change'],
  });
  res.json({
    success: true,
    message: 'Webhook registered successfully',
    webhooks: fuelStore.getWebhooks(),
  });
});

app.delete('/api/fuel-prices/webhooks', (req, res) => {
  const { url } = req.body;
  if (!url) {
    res.status(400).json({ error: 'URL parameter is required.' });
    return;
  }
  fuelStore.removeWebhook(url);
  res.json({
    success: true,
    message: 'Webhook removed',
    webhooks: fuelStore.getWebhooks(),
  });
});

// 8. Test webhook ping
app.post('/api/fuel-prices/test-webhook', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }
  try {
    const sampleData = fuelStore.getData();
    const pingRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Delhi-Fuel-Price-Scraper/1.0-Test',
      },
      body: JSON.stringify({
        event: 'test_ping',
        timestamp: new Date().toISOString(),
        city: 'Delhi',
        message: 'This is a test notification from Delhi Fuel Price Tracker API.',
        data: sampleData,
      }),
      signal: AbortSignal.timeout(5000),
    });
    res.json({
      success: true,
      status: pingRes.status,
      statusText: pingRes.statusText,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Webhook connection test failed: ${err.message}`,
    });
  }
});

// 9. Export endpoint (CSV / JSON)
app.get('/api/fuel-prices/export', (req, res) => {
  const format = req.query.format === 'csv' ? 'csv' : 'json';
  const data = fuelStore.getData();
  const history = fuelStore.getHistory();

  if (format === 'csv') {
    let csv = 'Date,City,Petrol_INR,Diesel_INR,CNG_INR,EV_INR\n';
    history.forEach((h) => {
      csv += `"${h.date}","Delhi",${h.petrol},${h.diesel},${h.cng},${h.ev}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="delhi_fuel_prices.csv"');
    res.send(csv);
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="delhi_fuel_prices.json"');
  res.json({
    city: 'Delhi',
    current: data,
    history,
  });
});

// ==========================================
// Vite Middleware & Static Serving
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Delhi Fuel Price Daemon & Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
