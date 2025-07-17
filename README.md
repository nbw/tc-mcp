# TableCheck MCP Server

A Model Context Protocol (MCP) server for searching restaurant reservations and guiding users to reservation pages using the TableCheck API. This server is compatible with Claude.ai and other MCP clients, and supports both local stdio transport and remote HTTP/SSE transport for cloud deployment.

This is just a proof of concept.

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Docker (optional, for containerized deployment)

### Install Dependencies

```bash
npm install
```

## Usage

### Local Development (stdio transport)

For local use with Claude Desktop and other MCP clients:

```bash
# Build the project
npm run build

# Start the local server (stdio transport)
npm start

# Or run in development mode
npm run dev
```

### Remote Server (HTTP/SSE transport)

For cloud deployment and remote access:

```bash
# Build the project
npm run build

# Start the remote server
npm run start:remote
```

The remote server will be available at:
- **MPC endpoint**: `http://localhost:3000/mcp`
- **Health check**: `http://localhost:3000/health`
- **Server info**: `http://localhost:3000/info`


### Claude Desktop Configuration

#### For Local Server (stdio transport)

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "tablecheck": {
      "command": "node",
      "args": ["/path/to/tablecheck-mcp/dist/index.js"]
    }
  }
}
```

#### For Remote Server (HTTP transport)

Use `mcp-remote` to connect to the remote server:

```json
{
  "mcpServers": {
    "tablecheck": {
      "command": "npx",
      "args": ["mcp-remote", "https://your-server.com/mcp"]
    }
  }
}
```

## Available Tools

### 1. Search Restaurants

Search for restaurants with various filters:


### 2. Get Restaurant Availability

Get detailed availability calendar for a specific restaurant:

### 3. List Cuisines

Get available cuisine types for filtering:

### 4. Generate Reservation Link

Generate a direct reservation link with pre-filled parameters:

## API Endpoints (Remote Mode)

When running in remote mode, the server exposes the following endpoints:

- **`POST /mcp`**: JSON-RPC endpoint for MCP tool calls
- **`GET /health`**: Health check endpoint
- **`GET /info`**: Server information endpoint

## Examples

### Basic Restaurant Search

```typescript
// Search for Italian restaurants
search_restaurants({
  query: "italian",
  location: "shibuya",
  num_people: 2
})
```

### Advanced Search with Filters

```typescript
// Search with multiple filters
search_restaurants({
  location: "ginza",
  cuisines: ["italian", "french"],
  date_min: "2024-01-15",
  date_max: "2024-01-20",
  num_people: 4,
  time: "19:00",
  budget_max: 10000,
  sort_by: "price",
  sort_order: "asc"
})
```