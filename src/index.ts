#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from './core/server.js';

/**
 * Main entry point for stdio transport (local MCP server)
 */
async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  
  await server.connect(transport);
  console.error("TableCheck MCP Server running on stdio");
}

/**
 * Handle process events
 */
process.on('SIGINT', async () => {
  console.error("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error("Fatal error in main:", error);
  process.exit(1);
}); 