// dev-server.js
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chatHandler from './api/chat.js';
import ttsHandler from './api/tts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3002;

// Load local .env variables dynamically for development
try {
  const envPath = path.join(__dirname, '.env');
  const envContent = await fs.readFile(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        process.env[k] = v;
      }
    }
  });
  console.log("✓ Loaded environment configurations from local .env");
} catch (e) {
  // No local .env file (normal in cloud deployment)
}

// Helper to parse JSON body from incoming requests
async function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // CORS Headers for local development ease
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    // 1. API: /api/chat Route
    if (url.pathname === '/api/chat' && req.method === 'POST') {
      req.body = await getJsonBody(req);
      
      const mockRes = {
        status(code) {
          res.statusCode = code;
          return this;
        },
        json(data) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return this;
        }
      };

      await chatHandler(req, mockRes);
      return;
    }

    // 2. API: /api/tts Route
    if (url.pathname === '/api/tts' && req.method === 'POST') {
      req.body = await getJsonBody(req);
      
      const mockRes = {
        status(code) {
          res.statusCode = code;
          return this;
        },
        setHeader(name, value) {
          res.setHeader(name, value);
          return this;
        },
        json(data) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return this;
        },
        send(buffer) {
          res.end(buffer);
          return this;
        }
      };

      await ttsHandler(req, mockRes);
      return;
    }

    // 3. Static Files Delivery
    let filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
    
    // Safety check against Directory Traversal attacks
    if (!filePath.startsWith(__dirname)) {
      res.statusCode = 403;
      res.end('Access Denied');
      return;
    }

    try {
      const data = await fs.readFile(filePath);
      
      // Determine Content Type
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'text/plain';
      if (ext === '.html') contentType = 'text/html';
      else if (ext === '.css') contentType = 'text/css';
      else if (ext === '.js') contentType = 'application/javascript';
      else if (ext === '.json') contentType = 'application/json';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.mp3') contentType = 'audio/mpeg';

      res.setHeader('Content-Type', contentType);
      res.statusCode = 200;
      res.end(data);
    } catch (err) {
      res.statusCode = 404;
      res.end('File Not Found');
    }

  } catch (error) {
    console.error("Dev Server Error:", error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🤖 MANDALA local development server active!`);
  console.log(`🔗 Interface URL: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
