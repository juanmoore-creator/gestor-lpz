import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import authHandler from './api/imagekit-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import 'dotenv/config'; // Loads .env file using dotenv

console.log("Environment variables loaded via dotenv.");

const PORT = 3000;

function createMockRes(res) {
    return {
        setHeader: (k, v) => res.setHeader(k, v),
        status: (code) => {
            res.statusCode = code;
            return createMockRes(res);
        },
        json: (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return createMockRes(res);
        },
        send: (data) => {
            res.end(data || '');
            return createMockRes(res);
        },
        end: (data) => res.end(data || '')
    };
}

function handleError(e, res) {
    console.error("Handler error:", e);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: e.message }));
}

const server = createServer(async (req, res) => {
    // Add CORS headers for local development access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/api/imagekit-auth') {
        console.log("Request received for /api/imagekit-auth");

        const mockRes = createMockRes(res);

        try {
            await authHandler(req, mockRes);
        } catch (e) {
            handleError(e, res);
        }
    } else if (req.url === '/api/upload-to-drive') {
        console.log("Request received for /api/upload-to-drive");

        const mockRes = createMockRes(res);

        try {
            // Import the handler dynamically to ensure it picks up the latest version if changed
            const { default: uploadHandler } = await import('./api/upload-to-drive.js');
            await uploadHandler(req, mockRes);
        } catch (e) {
            handleError(e, res);
        }
    } else if (req.url === '/api/rename-file') {
        console.log("Request received for /api/rename-file");

        const mockRes = createMockRes(res);

        try {
            // Import the handler dynamically
            const { default: renameHandler } = await import('./api/rename-file.js');
            await renameHandler(req, mockRes);
        } catch (e) {
            handleError(e, res);
        }
    } else if (req.url.startsWith('/api/whatsapp/webhooks')) {
        console.log("Request received for /api/whatsapp/webhooks");
        const mockRes = createMockRes(res);
        try {
            const { default: webhookHandler } = await import('./api/whatsapp/webhooks.js');
            // Basic query param parsing for local server
            const url = new URL(req.url, `http://${req.headers.host}`);
            req.query = Object.fromEntries(url.searchParams);

            // Basic body parsing for POST
            if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk.toString(); });
                req.on('end', async () => {
                    try {
                        req.body = JSON.parse(body || '{}');
                        await webhookHandler(req, mockRes);
                    } catch (err) {
                        handleError(err, res);
                    }
                });
            } else {
                await webhookHandler(req, mockRes);
            }
        } catch (e) {
            handleError(e, res);
        }
    } else if (req.url === '/api/whatsapp/send-message') {
        console.log("Request received for /api/whatsapp/send-message");
        const mockRes = createMockRes(res);
        try {
            const { default: sendHandler } = await import('./api/whatsapp/send-message.js');
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                try {
                    req.body = JSON.parse(body || '{}');
                    await sendHandler(req, mockRes);
                } catch (err) {
                    handleError(err, res);
                }
            });
        } catch (e) {
            handleError(e, res);
        }
    } else {
        res.statusCode = 404;
        res.end('Not Found: ' + req.url);
    }
});

server.listen(PORT, () => {
    console.log(`\n✅ Local Backend Server running at http://localhost:${PORT}`);
    console.log(`   - Auth Endpoint: http://localhost:${PORT}/api/imagekit-auth`);
    console.log(`\n⚠️  Leave this terminal open while developing!\n`);
});
