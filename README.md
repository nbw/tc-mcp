# TableCheck MCP Server

A Model Context Protocol (MCP) server for searching restaurant reservations and guiding users to reservation pages using the TableCheck API. This server is compatible with Claude.ai and other MCP clients.

## Features

- **Restaurant Search**: Search for restaurants by name, cuisine, location, budget, and more
- **Availability Calendar**: Get detailed availability information for specific restaurants
- **Cuisine Filtering**: List available cuisines to filter restaurant searches
- **Reservation Links**: Generate direct reservation links with pre-filled parameters
- **Location Intelligence**: Smart location resolution for Tokyo area locations
- **Flexible Search**: Support for both text-based and parameter-based searches

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- [mise](https://mise.jdx.dev/) (recommended for version management)

### Install Dependencies

```bash
npm install
```

### Install with mise

If you have mise installed:

```bash
mise use node@18
npm install
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory (optional):

```env
NODE_ENV=development
DEFAULT_LOCALE=en
LOG_LEVEL=info
```

### Configuration Constants

The server uses default configuration values defined in `src/config/constants.ts`:

- **API Base URL**: `https://production.tablecheck.com/v2`
- **Default Location**: Tokyo Station (35.6762, 139.6503)
- **Default Locale**: English (`en`)
- **Default Search Radius**: 5km
- **Default Results**: 50 per page

## Usage

### Build and Start

```bash
# Build the project
npm run build

# Start the server
npm start
```

### Development Mode

```bash
# Run in development mode with auto-reload
npm run dev
```

### Using with Claude Desktop

Add this server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "tablecheck": {
      "command": "node",
      "args": ["path/to/tablecheck-mcp/dist/index.js"]
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

## Error Handling

The server provides comprehensive error handling:

- **Validation Errors**: Invalid parameters, date formats, etc.
- **API Errors**: Rate limiting, network issues, invalid requests
- **Location Errors**: Unknown locations fall back to Tokyo Station
- **Graceful Degradation**: Partial results when some data is unavailable

## Development

### Project Structure

```
src/
├── config/           # Configuration constants
├── handlers/         # Request handlers for each tool
├── services/         # TableCheck API service
├── types/           # TypeScript interfaces
├── utils/           # Utility functions
└── index.ts         # Main server entry point
```

### Testing

```bash
# Run tests (when implemented)
npm test

# Run linter
npm run lint
```

### Building

```bash
# Build for production
npm run build

# Clean build artifacts
npm run clean
```

## API Reference

### TableCheck API Endpoints

- **Search**: `GET /v2/shop_search` - Parameter-based restaurant search
- **Autocomplete**: `GET /v2/autocomplete` - Text-based restaurant search
- **Cuisines**: `GET /v2/cuisines` - List available cuisines
- **Availability**: `POST /v2/hub/availability_calendar` - Get restaurant availability

### Rate Limiting

The TableCheck API has rate limiting. The server handles rate limit errors gracefully and provides appropriate error messages.

## Troubleshooting

### Common Issues

1. **"Restaurant not found"**: Check that the shop_id is correct
2. **"Invalid date format"**: Use YYYY-MM-DD format for dates
3. **"Rate limit exceeded"**: Wait a moment before retrying
4. **"Location not found"**: Use a supported location name or exact coordinates

### Debugging

Set `LOG_LEVEL=debug` in your environment to see detailed API requests and responses.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Open an issue on GitHub 