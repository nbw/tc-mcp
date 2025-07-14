#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
  CallToolRequest
} from "@modelcontextprotocol/sdk/types.js";

import { TableCheckService } from './services/tablecheck.js';
import { handleSearchRestaurants } from './handlers/search.js';
import { handleGetAvailability } from './handlers/availability.js';
import { handleListCuisines } from './handlers/cuisines.js';
import { handleGenerateReservationLink } from './handlers/links.js';

/**
 * Create and configure the MCP server
 */
const server = new Server(
  {
    name: "tablecheck-mcp",
    version: "1.0.0",
    description: "MCP server for TableCheck restaurant reservations"
  },
  {
    capabilities: {
      tools: {},
    }
  }
);

// Initialize TableCheck service
const tableCheckService = new TableCheckService();

/**
 * Tool definitions for the MCP server
 */
const tools = [
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
          oneOf: [
            {
              type: "string",
              description: "Location name (e.g., 'Shibuya', 'Tokyo Station')"
            },
            {
              type: "object",
              properties: {
                lat: { type: "number", description: "Latitude" },
                lng: { type: "number", description: "Longitude" }
              },
              required: ["lat", "lng"],
              description: "Geographic coordinates for location-based search"
            }
          ]
        },
        cuisines: {
          type: "array",
          items: { type: "string" },
          description: "Array of cuisine types to filter by (use list_cuisines to get available options)"
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
          description: "Number of people for the reservation (1-20)"
        },
        time: {
          type: "string",
          description: "Preferred time (HH:MM format)"
        },
        budget_min: {
          type: "number",
          description: "Minimum budget per person"
        },
        budget_max: {
          type: "number",
          description: "Maximum budget per person"
        },
        geo_distance: {
          type: "string",
          description: "Distance radius for location-based search (e.g., '5km', '10km')"
        },
        sort_by: {
          type: "string",
          enum: ["distance", "price"],
          description: "Sort results by distance or price"
        },
        sort_order: {
          type: "string",
          enum: ["asc", "desc"],
          description: "Sort order (ascending or descending)"
        },
        locale: {
          type: "string",
          enum: ["en", "jp"],
          description: "Language locale"
        }
      }
    }
  },
  {
    name: "get_restaurant_availability",
    description: "Get detailed availability calendar for a specific restaurant",
    inputSchema: {
      type: "object",
      required: ["shop_id", "start_at", "num_people"],
      properties: {
        shop_id: {
          type: "string",
          description: "Restaurant ID or slug (get this from search results)"
        },
        start_at: {
          type: "string",
          description: "Start date/time for availability check (ISO format: YYYY-MM-DDTHH:MM:SS.sssZ)"
        },
        num_people: {
          type: "number",
          description: "Number of people for the reservation (1-20)"
        },
        locale: {
          type: "string",
          enum: ["en", "jp"],
          description: "Language locale"
        }
      }
    }
  },
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
  },
  {
    name: "generate_reservation_link",
    description: "Generate a direct reservation link for a specific restaurant with pre-filled parameters",
    inputSchema: {
      type: "object",
      required: ["shop_id"],
      properties: {
        shop_id: {
          type: "string",
          description: "Restaurant ID or slug (get this from search results)"
        },
        num_people: {
          type: "number",
          description: "Number of people for the reservation (1-20)"
        },
        date: {
          type: "string",
          description: "Preferred date (YYYY-MM-DD format)"
        },
        time: {
          type: "string",
          description: "Preferred time (HH:MM format)"
        },
        location: {
          oneOf: [
            {
              type: "string",
              description: "Location name (e.g., 'Shibuya', 'Tokyo Station')"
            },
            {
              type: "object",
              properties: {
                lat: { type: "number", description: "Latitude" },
                lng: { type: "number", description: "Longitude" }
              },
              required: ["lat", "lng"],
              description: "Geographic coordinates"
            }
          ]
        },
        locale: {
          type: "string",
          enum: ["en", "jp"],
          description: "Language locale"
        }
      }
    }
  }
];

/**
 * List tools request handler
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools
  };
});

/**
 * Call tool request handler
 */
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case "search_restaurants":
        return await handleSearchRestaurants(tableCheckService, args || {});
        
      case "get_restaurant_availability":
        return await handleGetAvailability(tableCheckService, args || {});
        
      case "list_cuisines":
        return await handleListCuisines(tableCheckService, args || {});
        
      case "generate_reservation_link":
        return await handleGenerateReservationLink(tableCheckService, args || {});
        
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    console.error(`Error calling tool ${name}:`, error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Error calling tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

/**
 * Start the server
 */
async function main() {
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