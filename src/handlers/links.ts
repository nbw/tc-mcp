import { TableCheckService } from '../services/tablecheck.js';
import { SearchParams } from '../types/index.js';
import { resolveLocation } from '../utils/location.js';

/**
 * Handles reservation link generation requests
 * @param tableCheckService Instance of TableCheck service
 * @param args Link generation arguments from MCP client
 * @returns Formatted reservation link
 */
export async function handleGenerateReservationLink(tableCheckService: TableCheckService, args: any) {
  try {
    const shopId = args.shop_id;
    const locale = args.locale || 'en';
    
    if (!shopId) {
      throw new Error('shop_id is required');
    }
    
    // Parse optional parameters
    const params: Partial<SearchParams> = {};
    
    if (args.num_people) {
      params.num_people = args.num_people;
    }
    
    if (args.date) {
      params.date_min = args.date;
    }
    
    if (args.time) {
      params.time = args.time;
    }
    
    if (args.location) {
      if (typeof args.location === 'string') {
        params.location = await resolveLocation(args.location);
      } else {
        params.location = args.location;
      }
    }
    
    // Generate reservation link
    const reservationUrl = tableCheckService.generateReservationLink(shopId, params, locale);
    
    // Format results for MCP response
    return {
      content: [
        {
          type: "text",
          text: formatReservationLink(reservationUrl, shopId, params)
        }
      ]
    };
    
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error generating reservation link: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Formats reservation link for display
 * @param url Generated reservation URL
 * @param shopId Restaurant ID or slug
 * @param params Search parameters used
 * @returns Formatted link string
 */
function formatReservationLink(url: string, shopId: string, params: Partial<SearchParams>): string {
  let output = `Reservation link for restaurant ${shopId}:\n\n`;
  output += `**${url}**\n\n`;
  
  if (Object.keys(params).length > 0) {
    output += 'Pre-filled parameters:\n';
    
    if (params.num_people) {
      output += `• Number of people: ${params.num_people}\n`;
    }
    
    if (params.date_min) {
      output += `• Date: ${params.date_min}\n`;
    }
    
    if (params.time) {
      output += `• Time: ${params.time}\n`;
    }
    
    if (params.location) {
      output += `• Location: ${params.location.lat}, ${params.location.lng}\n`;
    }
    
    output += '\n';
  }
  
  output += 'Click the link above to make a reservation at this restaurant.';
  
  return output;
} 