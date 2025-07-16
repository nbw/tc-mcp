#!/usr/bin/env node

import { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import { createMcpServer } from './core/server.js';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

/**************************
 * SERVER: MCP WEB SERVER
 * 
 * Plugs an MCP Server into an Express server so that it can be
 * accessed via HTTP. 
 * 
 * Uses StreamableHTTPServerTransport to handle MCP requests.
**************************/

/**
 * Configuration
 */
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const HOST = process.env.HOST || '0.0.0.0';

// Create MCP Server
const mcpServer = createMcpServer();

// Create Web Server
const app = express();
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for SSE
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  // origin: NODE_ENV === 'production' ? false : '*', // Allow all origins in dev
  origin: '*',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.post('/mcp', async (req: Request, res: Response) => {
  // In stateless mode, create a new instance of transport and server for each request
  // to ensure complete isolation. A single instance would cause request ID collisions
  // when multiple clients connect concurrently.

  try {
    // const server = getServer(); 
    const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on('close', () => {
      console.log('Request closed');
      transport.close();
      mcpServer.close();
    });
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// SSE notifications not supported in stateless mode
app.get('/mcp', async (req: Request, res: Response) => {
  console.log('Received GET MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});

// Session termination not needed in stateless mode
app.delete('/mcp', async (req: Request, res: Response) => {
  console.log('Received DELETE MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: NODE_ENV
  });
});

/**
 * Server info endpoint
 */
app.get('/info', (req, res) => {
  res.json({
    name: 'tablecheck-mcp',
    version: '1.0.0',
    description: 'MCP server for TableCheck restaurant reservations',
    transport: 'sse',
    endpoints: {
      mcp: '/mcp',
      health: '/health',
      info: '/info'
    }
  });
});

/**
 * Error handling middleware
 */
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express error:', error);
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? error.message : undefined
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

/**
 * Start web server
 */
async function startServer() {
  try {
    const server = app.listen(PORT, HOST, () => {
      console.error(`TableCheck MCP Server running on http://${HOST}:${PORT}`);
      console.error(`Environment: ${NODE_ENV}`);
      console.error(`MCP Endpoint: http://${HOST}:${PORT}/mcp`);
      console.error(`Health check: http://${HOST}:${PORT}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.error('Received SIGTERM, shutting down gracefully...');
      server.close(() => {
        console.error('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.error('Received SIGINT, shutting down gracefully...');
      server.close(() => {
        console.error('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
}); 