# TableCheck MCP Server

A Model Context Protocol (MCP) server for searching restaurant reservations and guiding users to reservation pages using the TableCheck API. This server is compatible with Claude.ai and other MCP clients, and supports both local stdio transport and remote HTTP/SSE transport for cloud deployment.

## Features

- **Restaurant Search**: Search for restaurants by name, cuisine, location, budget, and more
- **Availability Calendar**: Get detailed availability information for specific restaurants
- **Cuisine Filtering**: List available cuisines to filter restaurant searches
- **Reservation Links**: Generate direct reservation links with pre-filled parameters
- **Location Intelligence**: Smart location resolution for Tokyo area locations
- **Flexible Search**: Support for both text-based and parameter-based searches
- **Dual Transport**: Support for both local stdio and remote HTTP/SSE transport
- **Cloud Ready**: Docker containerization and production deployment support

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

# Or run in development mode
npm run dev:remote
```

The remote server will be available at:
- **SSE endpoint**: `http://localhost:3000/sse`
- **Health check**: `http://localhost:3000/health`
- **Server info**: `http://localhost:3000/info`

### Docker Deployment

#### Build and run with Docker

```bash
# Build the Docker image
docker build -t tablecheck-mcp .

# Run the container
docker run -p 3000:3000 tablecheck-mcp
```

#### Using Docker Compose

```bash
# Production deployment
docker-compose up -d

# Development mode
docker-compose --profile dev up -d tablecheck-mcp-dev
```

### Cloud Deployment

#### Deploy to Fly.io

1. **Install Fly CLI**: Follow the [Fly.io documentation](https://fly.io/docs/getting-started/installing-flyctl/)

2. **Initialize Fly app**:
   ```bash
   fly launch
   ```

3. **Deploy**:
   ```bash
   fly deploy
   ```

4. **Set environment variables** (if needed):
   ```bash
   fly secrets set NODE_ENV=production
   ```

Your server will be available at `https://your-app-name.fly.dev/sse`

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

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

#### For Remote Server (HTTP/SSE transport)

Use `mcp-remote` to connect to the remote server:

```json
{
  "mcpServers": {
    "tablecheck": {
      "command": "npx",
      "args": ["mcp-remote", "https://your-server.com/sse"]
    }
  }
}
```

## Available Tools

### 1. Search Restaurants

Search for restaurants with various filters:

```typescript
search_restaurants({
  query?: string,              // Text search (restaurant name, cuisine, etc.)
  location?: string | {lat: number, lng: number}, // Location name or coordinates
  cuisines?: string[],         // Cuisine types (use list_cuisines to get options)
  date_min?: string,           // Earliest date (YYYY-MM-DD)
  date_max?: string,           // Latest date (YYYY-MM-DD)
  num_people?: number,         // Number of people (1-20)
  time?: string,               // Preferred time (HH:MM)
  budget_min?: number,         // Minimum budget per person
  budget_max?: number,         // Maximum budget per person
  geo_distance?: string,       // Search radius (e.g., "5km", "10km")
  sort_by?: "distance" | "price", // Sort criteria
  sort_order?: "asc" | "desc", // Sort order
  locale?: "en" | "jp"         // Language locale
})
```

### 2. Get Restaurant Availability

Get detailed availability calendar for a specific restaurant:

```typescript
get_restaurant_availability({
  shop_id: string,             // Restaurant ID or slug
  start_at: string,            // Start date/time (ISO format)
  num_people: number,          // Number of people (1-20)
  locale?: "en" | "jp"         // Language locale
})
```

### 3. List Cuisines

Get available cuisine types for filtering:

```typescript
list_cuisines({
  locale?: "en" | "jp"         // Language locale
})
```

### 4. Generate Reservation Link

Generate a direct reservation link with pre-filled parameters:

```typescript
generate_reservation_link({
  shop_id: string,             // Restaurant ID or slug
  num_people?: number,         // Number of people
  date?: string,               // Preferred date (YYYY-MM-DD)
  time?: string,               // Preferred time (HH:MM)
  location?: string | {lat: number, lng: number}, // Location
  locale?: "en" | "jp"         // Language locale
})
```

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

### Check Availability

```typescript
// Check availability for a specific restaurant
get_restaurant_availability({
  shop_id: "hyatt-regency-yokohama-milanogrill",
  start_at: "2024-01-15T10:00:00.000Z",
  num_people: 2
})
```

### Generate Reservation Link

```typescript
// Generate reservation link with pre-filled parameters
generate_reservation_link({
  shop_id: "hyatt-regency-yokohama-milanogrill",
  num_people: 2,
  date: "2024-01-15",
  time: "19:00",
  location: "shibuya"
})
```

## Location Intelligence

The server includes smart location resolution for common Tokyo locations:

- **Central Tokyo**: Tokyo Station, Ginza, Marunouchi, Nihonbashi
- **Shibuya Area**: Shibuya, Harajuku, Omote-sando, Daikanyama
- **Shinjuku Area**: Shinjuku, Shinjuku-south, Shinjuku-east, Shinjuku-west
- **Other Areas**: Roppongi, Akasaka, Asakusa, Ikebukuro, Ueno, Akihabara
- **Yokohama**: Yokohama, Kamakura
- **And many more...**

You can use location names like `"shibuya"`, `"tokyo station"`, or provide exact coordinates.

## Development

### Project Structure

```
src/
├── core/             # Shared server logic
├── config/           # Configuration constants
├── handlers/         # Request handlers for each tool
├── services/         # TableCheck API service
├── types/           # TypeScript interfaces
├── utils/           # Utility functions
├── index.ts         # Main server entry point (stdio transport)
└── server.ts        # Remote server entry point (HTTP/SSE transport)
```

### Testing

```bash
# Run tests (when implemented)
npm test

# Run linter
npm run lint

# Test remote server
curl http://localhost:3000/health
curl -N -H "Accept: text/event-stream" http://localhost:3000/sse
```

### Building

```bash
# Build for production
npm run build

# Clean build artifacts
npm run clean
```

## Deployment Options

### 1. Local Development
- Use stdio transport for local Claude Desktop integration
- Run `npm run dev` for development mode

### 2. Remote Server
- Use HTTP/SSE transport for cloud deployment
- Deploy as Docker container to any cloud platform
- Access via `https://your-server.com/sse`

### 3. Hybrid Approach
- Run locally for development and testing
- Deploy to cloud for production use
- Use `mcp-remote` to connect local clients to remote server

## Error Handling

The server provides comprehensive error handling:

- **Validation Errors**: Invalid parameters, date formats, etc.
- **API Errors**: Rate limiting, network issues, invalid requests
- **Location Errors**: Unknown locations fall back to Tokyo Station
- **Graceful Degradation**: Partial results when some data is unavailable
- **Health Checks**: Built-in health monitoring for production deployments

## Security

- **CORS**: Configurable CORS settings for different environments
- **Input Validation**: Comprehensive input validation for all endpoints
- **Rate Limiting**: Protection against abuse (implement as needed)
- **Environment Variables**: Secure configuration management
- **Docker Security**: Non-root user in containers

## Monitoring

- **Health Checks**: `/health` endpoint for monitoring
- **Logging**: Structured logging with different levels
- **Metrics**: Built-in request/response tracking
- **Error Tracking**: Comprehensive error logging

## Troubleshooting

### Common Issues

1. **"Restaurant not found"**: Check that the shop_id is correct
2. **"Invalid date format"**: Use YYYY-MM-DD format for dates
3. **"Rate limit exceeded"**: Wait a moment before retrying
4. **"Location not found"**: Use a supported location name or exact coordinates
5. **"Connection failed"**: Check network connectivity and server status

### Remote Server Issues

1. **SSE Connection Problems**: Check CORS settings and firewall rules
2. **Docker Build Failures**: Ensure all dependencies are properly installed
3. **Port Already in Use**: Change PORT environment variable
4. **Health Check Failures**: Verify server is responding on `/health`

### Debugging

Set appropriate log levels and monitor server logs:

```bash
# Local debugging
npm run dev:remote

# Docker logs
docker-compose logs -f

# Production debugging
curl https://your-server.com/health
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Test both local and remote modes
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Test with both local and remote modes
- Open an issue on GitHub 