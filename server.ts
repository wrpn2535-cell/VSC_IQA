import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_APP_STATE } from './src/data/initialData';
import { AppState } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory state initialized from file or default
let appState: AppState = (() => {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Error reading database.json, initializing from seed', err);
    }
  }
  return INITIAL_APP_STATE;
})();

function persistState() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(appState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database.json:', err);
  }
}

// Save initial file if not present
if (!fs.existsSync(DB_FILE)) {
  persistState();
}

// SSE Connected Clients
const sseClients: Response[] = [];

function broadcastStateUpdate(updatedState: AppState) {
  const data = JSON.stringify({ type: 'STATE_UPDATE', state: updatedState });
  sseClients.forEach((client) => {
    client.write(`data: ${data}\n\n`);
  });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/state', (req: Request, res: Response) => {
    res.json(appState);
  });

  app.post('/api/state', (req: Request, res: Response) => {
    try {
      const newState = req.body;
      if (!newState || typeof newState !== 'object') {
        res.status(400).json({ error: 'Invalid state body' });
        return;
      }
      appState = {
        ...newState,
        lastUpdated: new Date().toISOString()
      };
      persistState();
      broadcastStateUpdate(appState);
      res.json({ success: true, lastUpdated: appState.lastUpdated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update state' });
    }
  });

  // Selective Patch Endpoint
  app.post('/api/state/patch', (req: Request, res: Response) => {
    try {
      const patch = req.body;
      appState = {
        ...appState,
        ...patch,
        lastUpdated: new Date().toISOString()
      };
      persistState();
      broadcastStateUpdate(appState);
      res.json({ success: true, lastUpdated: appState.lastUpdated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to patch state' });
    }
  });

  // Server-Sent Events Endpoint
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial state ping
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', lastUpdated: appState.lastUpdated })}\n\n`);

    sseClients.push(res);

    req.on('close', () => {
      const index = sseClients.indexOf(res);
      if (index !== -1) {
        sseClients.splice(index, 1);
      }
    });
  });

  // Reset to default seed endpoint (for testing/Admin maintenance)
  app.post('/api/state/reset', (req: Request, res: Response) => {
    appState = {
      ...INITIAL_APP_STATE,
      lastUpdated: new Date().toISOString()
    };
    persistState();
    broadcastStateUpdate(appState);
    res.json({ success: true, message: 'Database reset to default seed' });
  });

  // Mount Vite in Dev Mode
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Vet Superior IQA Management Server running on port ${PORT}`);
  });
}

startServer();
