# MCP Server for TableCheck Restaurant Reservations - Implementation Plan

## Objective

Create an MCP server for searching restaurant reservations and guiding users to reservation pages using the TableCheck API. The server will be compatible with Claude.ai and other MCP clients.

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: MCP TypeScript SDK (https://github.com/modelcontextprotocol/typescript-sdk)
- **Package Manager**: npm/yarn
- **Version Manager**: mise (install appropriate Node version for SDK)

## Project Structure

```
tablecheck-mcp/
├── src/
│   ├── index.ts              # MCP server setup and initialization
│   ├── handlers/
│   │   ├── search.ts         # Restaurant search handler
│   │   ├── availability.ts   # Availability calendar handler
│   │   ├── cuisines.ts       # Cuisine list handler
│   │   └── links.ts          # Reservation link generation
│   ├── services/
│   │   └── tablecheck.ts     # TableCheck API client
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── utils/
│   │   ├── url-builder.ts    # URL generation helpers
│   │   ├── location.ts       # Location resolution utilities
│   │   └── validation.ts     # Input validation helpers
│   └── config/
│       └── constants.ts      # Configuration constants
├── tests/
│   └── __mocks__/           # Mock API responses
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration Constants

```typescript
// src/config/constants.ts
export const CONFIG = {
  API_BASE_URL: 'https://production.tablecheck.com/v2',
  SHOP_UNIVERSE_ID: '57e0b91744aea12988000001',
  DEFAULT_LOCATION: {
    lat: 35.6762,  // Tokyo Station
    lng: 139.6503
  },
  DEFAULT_LOCALE: 'en',
  SUPPORTED_LOCALES: ['en'] as const,
  DEFAULT_SERVICE_MODE: 'dining',
  DEFAULT_VENUE_TYPE: 'all',
  DEFAULT_PER_PAGE: 50,
  DEFAULT_AVAILABILITY_DAYS: 7
};
```

## TypeScript Interfaces

```typescript
// src/types/index.ts
export interface SearchParams {
  query?: string;
  location?: {
    lat: number;
    lng: number;
  };
  cuisines?: string[];
  date_min?: string;
  date_max?: string;
  num_people?: number;
  time?: string;
  budget_max?: number;
  budget_min?: number;
  sort_by?: 'distance' | 'price';
  sort_order?: 'asc' | 'desc';
  geo_distance?: string;
  locale?: 'en' | 'jp';
}

export interface RestaurantResult {
  id: string;
  name: string;
  slug: string;
  cuisine: string[];
  location: {
    lat: number;
    lng: number;
  };
  price_range: {
    avg?: number;
    min?: number;
    max?: number;
    currency: string;
  };
  availability_summary: string;
  image_url?: string;
  reservation_url: string;
}

export interface AvailabilityParams {
  shop_id: string;
  start_at: string;
  num_people: number;
  locale?: 'en' | 'jp';
}

export interface AvailabilitySlot {
  date: string;
  time: string;
  available: boolean;
  party_size: number;
}

export interface Cuisine {
  id: string;
  name: string;
  locale: string;
}
```

## MCP Tool Definitions

### 1. Search Restaurants Tool

```typescript
{
  name: "search_restaurants",
  description: "Search for restaurants with optional filters. Can search by text query, location, cuisine type, date range, party size, budget, and more.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Text search query (restaurant name, cuisine type, etc.)"
      },
      location: {
        type: "object",
        properties: {
          lat: { type: "number" },
          lng: { type: "number" }
        },
        description: "Geographic coordinates for location-based search"
      },
      cuisines: {
        type: "array",
        items: { type: "string" },
        description: "Array of cuisine types to filter by"
      },
      date_min: {
        type: "string",
        description: "Earliest reservation date (YYYY-MM-DD format)"
      },
      date_max: {
        type: "string",
        description: "Latest reservation date (YYYY-MM-DD format)"
      },
      num_people: {
        type: "number",
        description: "Number of people for the reservation"
      },
      time: {
        type: "string",
        description: "Preferred time (HH:MM format)"
      },
      budget_max: {
        type: "number",
        description: "Maximum budget per person"
      },
      sort_by: {
        type: "string",
        enum: ["distance", "price"],
        description: "Sort results by distance or price"
      },
      locale: {
        type: "string",
        enum: ["en", "jp"],
        description: "Language locale"
      }
    }
  }
}
```

### 2. Get Restaurant Availability Tool

```typescript
{
  name: "get_restaurant_availability",
  description: "Get detailed availability calendar for a specific restaurant",
  inputSchema: {
    type: "object",
    required: ["shop_id", "start_at", "num_people"],
    properties: {
      shop_id: {
        type: "string",
        description: "Restaurant ID or slug"
      },
      start_at: {
        type: "string",
        description: "Start date/time for availability check (ISO format)"
      },
      num_people: {
        type: "number",
        description: "Number of people for the reservation"
      },
      locale: {
        type: "string",
        enum: ["en", "jp"],
        description: "Language locale"
      }
    }
  }
}
```

### 3. List Cuisines Tool

```typescript
{
  name: "list_cuisines",
  description: "Get a list of all available cuisine types for filtering restaurant searches",
  inputSchema: {
    type: "object",
    properties: {
      locale: {
        type: "string",
        enum: ["en", "jp"],
        description: "Language locale for cuisine names"
      }
    }
  }
}
```

### 4. Generate Reservation Link Tool

```typescript
{
  name: "generate_reservation_link",
  description: "Generate a direct reservation link for a specific restaurant with pre-filled parameters",
  inputSchema: {
    type: "object",
    required: ["shop_id"],
    properties: {
      shop_id: {
        type: "string",
        description: "Restaurant ID or slug"
      },
      num_people: {
        type: "number",
        description: "Number of people for the reservation"
      },
      date: {
        type: "string",
        description: "Preferred date (YYYY-MM-DD format)"
      },
      time: {
        type: "string",
        description: "Preferred time (HH:MM format)"
      },
      locale: {
        type: "string",
        enum: ["en", "jp"],
        description: "Language locale"
      }
    }
  }
}
```

## API Service Implementation

```typescript
// src/services/tablecheck.ts
export class TableCheckService {
  private baseUrl = CONFIG.API_BASE_URL;
  
  async searchRestaurants(params: SearchParams): Promise<RestaurantResult[]> {
    // Handle both text search and parameter-based search
    if (params.query) {
      return this.textSearch(params);
    } else {
      return this.parameterSearch(params);
    }
  }
  
  private async textSearch(params: SearchParams): Promise<RestaurantResult[]> {
    // Use autocomplete endpoint for text search
    const url = this.buildAutocompleteUrl(params);
    const response = await fetch(url);
    return this.parseAutocompleteResponse(response);
  }
  
  private async parameterSearch(params: SearchParams): Promise<RestaurantResult[]> {
    // Use shop_search endpoint for parameter-based search
    const url = this.buildShopSearchUrl(params);
    const response = await fetch(url);
    return this.parseShopSearchResponse(response);
  }
  
  async getAvailability(params: AvailabilityParams): Promise<AvailabilitySlot[]> {
    // POST to availability_calendar endpoint
  }
  
  async getCuisines(locale: string = 'en'): Promise<Cuisine[]> {
    // GET cuisines endpoint
  }
}
```

## Error Handling Strategy

```typescript
// src/utils/error-handling.ts
export class TableCheckError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'TableCheckError';
  }
}

export const handleApiError = (error: any): never => {
  if (error.response?.status === 404) {
    throw new TableCheckError('Restaurant not found', 404);
  }
  if (error.response?.status === 429) {
    throw new TableCheckError('Rate limit exceeded', 429);
  }
  throw new TableCheckError('API request failed', error.response?.status);
};
```

## Input Validation

Please check the correctness of the validation functions against the json assets. 

```typescript
// src/utils/validation.ts
export const validateSearchParams = (params: SearchParams): void => {
  if (params.date_min && !isValidDate(params.date_min)) {
    throw new Error('Invalid date_min format. Use YYYY-MM-DD');
  }
  if (params.num_people && (params.num_people < 1 || params.num_people > 20)) {
    throw new Error('num_people must be between 1 and 20');
  }
  if (params.time && !isValidTime(params.time)) {
    throw new Error('Invalid time format. Use HH:MM');
  }
};

const isValidDate = (date: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
};

const isValidTime = (time: string): boolean => {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};
```

## Location Resolution

```typescript
// src/utils/location.ts
export const resolveLocation = async (query: string): Promise<{lat: number, lng: number}> => {
  // Implement location resolution for common Tokyo locations
  const knownLocations = {
    'shibuya': { lat: 35.6596, lng: 139.7006 },
    'shinjuku': { lat: 35.6938, lng: 139.7034 },
    'tokyo station': { lat: 35.6812, lng: 139.7671 },
    'ginza': { lat: 35.6717, lng: 139.7653 },
    // Add more as needed
  };
  
  const normalized = query.toLowerCase();
  return knownLocations[normalized] || CONFIG.DEFAULT_LOCATION;
};
```

## URL Builder Utilities

```typescript
// src/utils/url-builder.ts
export const buildReservationUrl = (
  shopId: string,
  params: Partial<SearchParams> = {},
  locale: string = 'en'
): string => {
  const baseUrl = `https://www.tablecheck.com/${locale}/${shopId}`;
  const queryParams = new URLSearchParams();
  
  // Add standard parameters
  queryParams.append('availability_days_limit', '7');
  queryParams.append('availability_format', 'date');
  queryParams.append('service_mode', 'dining');
  queryParams.append('venue_type', 'all');
  
  // Add user parameters
  if (params.num_people) {
    queryParams.append('num_people', params.num_people.toString());
  }
  if (params.date_min) {
    queryParams.append('date_min', params.date_min);
  }
  if (params.time) {
    queryParams.append('time', params.time);
  }
  
  return `${baseUrl}?${queryParams.toString()}`;
};
```

## MCP Server Setup

```typescript
// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "tablecheck-mcp",
    version: "1.0.0",
    description: "MCP server for TableCheck restaurant reservations"
  },
  {
    capabilities: {
      tools: {},
      resources: {}
    }
  }
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // Tool definitions here
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Tool execution logic here
});

// Start server
const transport = new StdioServerTransport();
server.connect(transport);
```

## Environment Configuration

```typescript
// .env.example
NODE_ENV=development
API_BASE_URL=https://production.tablecheck.com/v2
DEFAULT_LOCALE=en
LOG_LEVEL=info
```

## Documentation Requirements

### README.md
- Installation instructions using mise
- Configuration setup
- Usage examples with Claude
- API endpoint documentation
- Troubleshooting guide

### JSDoc Comments
- All public methods and interfaces
- Parameter descriptions
- Return type documentation
- Example usage

## Deployment Considerations

- Package as npm module for easy installation
- Include TypeScript declarations
- Provide both CommonJS and ESM builds
- Include health check endpoint
- Add logging for debugging


## TableCheck API

1. Search for shop. 

Here are some examples of search requests to tablecheck:

```bash
curl --header "Content-Type: application/json" \
  --request GET \
  https://production.tablecheck.com/v2/shop_search?availability_days_limit=7&availability_format=date&budget_dinner_avg_max=14000&date_min=2025-07-14&date_max=2025-09-12&geo_distance=8km&service_mode=dining&sort_by=distance&venue_type=all&geo_latitude=35.32706053082282&geo_longitude=139.62749215920184&num_people=2&time=19%3A00&availability_mode=same_meal_time&per_page=50&randomize_geo=1234&shop_universe_id=57e0b91744aea12988000001&include_ids=true
```

```bash
curl --header "Content-Type: application/json" \
  --request GET \
  https://production.tablecheck.com/v2/shop_search?availability_days_limit=7&availability_format=date&date_min=2025-07-14&date_max=2025-09-12&geo_distance=8km&service_mode=dining&sort_by=distance&venue_type=all&geo_latitude=35.32706053082282&geo_longitude=139.62749215920184&per_page=50&randomize_geo=1234&shop_universe_id=57e0b91744aea12988000001&include_ids=true
```

```bash
curl --header "Content-Type: application/json" \
  --request GET \
  https://production.tablecheck.com/v2/shop_search?availability_days_limit=7&availability_format=date&date_min=2025-07-14&date_max=2025-09-12&geo_distance=5km&service_mode=dining&sort_by=distance&venue_type=all&geo_latitude=35.32706053082282&geo_longitude=139.62749215920184&per_page=50&randomize_geo=1234&shop_universe_id=57e0b91744aea12988000001&include_ids=true
```

Here is an example with cuisines in the params:

```bash
curl --header "Content-Type: application/json" \
  --request GET \
https://production.tablecheck.com/v2/shop_search?availability_days_limit=7&availability_format=date&budget_dinner_avg_max=14000&date_min=2025-07-14&date_max=2025-09-12&geo_distance=14km&service_mode=dining&sort_by=distance&venue_type=all&geo_longitude=139.62749215920184&geo_latitude=35.32706053082282&num_people=2&time=19%3A00&availability_mode=same_meal_time&cuisines%5B%5D=agemono&cuisines%5B%5D=asian-noodles&per_page=50&randomize_geo=1234&shop_universe_id=57e0b91744aea12988000001&include_ids=true
```

The various params are encoded in the URL. 

- An example empty response can be found in `./assets/search_empty.json`
- A example typical response with results can be found in `./assets/search.json`

Some extra notes:

- geo_distance and sort_by=distance etc. only make sense if a geo latitude and logitude are provided.

- you may need to ask the user for a location, otherwise assume some central location in tokyo as the anchor point. 

- sorting options are distance and price

### List Cusines

One of the search params is cusines (it's an optional param), but to get a full list: 

```bash
curl --header "Content-Type: application/json" \
  --request GET \
  https://production.tablecheck.com/v2/cuisines
```

An example response can be found in `./assets/cuisines.json` which has results for each locale. 

### Search by text

you can search by specific text using the following api:

```bash
curl --header "Content-Type: application/json" \
  --request GET \
https://production.tablecheck.com/v2/autocomplete?locale=en&text=indian&shop_universe_id=57e0b91744aea12988000001
```

if a text param isn't included then the following is returned:

```json
{
    "errors": [
        "Required parameter missing: text"
    ]
}
```

A typical response is in `./assets/autocomplete.json`

At a top level the response includes cruisines and/or shops. 

If there are no "cuisines" then it's not included at all in the response.

Same with "shops".

If neither exist, an empty object `{}` is returned. 


### Availability Calendar of a shop

To get the availability of a specific shop:

`curl
curl --header "Content-Type: application/json" \
  --request POST \
  https://production.tablecheck.com/v2/hub/availability_calendar
```

and the request body is:

```json
{
    "locale": "en",
    "start_at": "2025-07-15T10:00:00.000Z",
    "shop_id": "hyatt-regency-yokohama-milanogrill",
    "num_people": "2"
}
```

In the above case the shop was the hyatt-regency-yokohama-milanogrill (https://www.tablecheck.com/en/hyatt-regency-yokohama-milanogrill)


### Generating a link for a shop:

A link that the user can visit will typically look like: 

https://www.tablecheck.com/en/hyatt-regency-yokohama-milanogrill?availability_days_limit=7&availability_format=date&budget_dinner_avg_min=9000&date_min=2025-07-14&date_max=2025-09-12&geo_distance=28km&service_mode=dining&sort_by=budget_dinner_avg&venue_type=all&geo_longitude=139.62749215920184&geo_latitude=35.32706053082282&num_people=2&time=19:00&availability_mode=same_meal_time&sort_order=asc

that shows the specific shop and has a bunch of prefilled filter params.

Such a link would ideally be what is returned to the customer so they can make a reservation.
