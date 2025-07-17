import { TableCheckService } from '../services/tablecheck.js';
import { SearchParams } from '../types/index.js';
import { validateSearchParams } from '../utils/validation.js';
import { resolveLocation } from '../utils/location.js';

/**
 * Handles restaurant search requests
 * @param tableCheckService Instance of TableCheck service
 * @param args Search arguments from MCP client
 * @returns Formatted search results
 */
export async function handleSearchRestaurants(tableCheckService: TableCheckService, args: any) {
  try {
    // Parse and validate search parameters
    const searchParams: SearchParams = {
      query: args.query,
      cuisines: args.cuisines,
      date_min: args.date_min,
      date_max: args.date_max,
      num_people: args.num_people,
      time: args.time,
      budget_max: args.budget_max,
      budget_min: args.budget_min,
      sort_by: args.sort_by,
      sort_order: args.sort_order,
      geo_distance: args.geo_distance,
      locale: args.locale || 'en',
    };
    
    // Resolve location if provided
    if (args.location) {
      if (typeof args.location === 'string') {
        searchParams.location = await resolveLocation(args.location);
      } else {
        searchParams.location = args.location;
      }
    }
    
    // Set default geo distance if location is provided but distance is not
    if (searchParams.location && !searchParams.geo_distance) {
      searchParams.geo_distance = '5km';
    }
    
    // Validate parameters
    validateSearchParams(searchParams);
    
    // Perform search
    const results = await tableCheckService.searchRestaurants(searchParams);
    
    // Format results for MCP response
    const formattedResults = results.map(restaurant => ({
      id: restaurant.id,
      name: restaurant.name,
      cuisine: restaurant.cuisine.join(', '),
      price_avg: formatAvgPrice(restaurant.price_avg, restaurant.currency),
      lunch_price_range: formatPriceRange(restaurant.lunch_price_range),
      dinner_price_range: formatPriceRange(restaurant.dinner_price_range),
      availability: formatAvailability(restaurant.available_dates),
      reservation_url: restaurant.reservation_url,
      image_url: restaurant.image_url,
    }));
    
    return {
      content: [
        {
          type: "text",
          text: formatSearchResults(formattedResults, searchParams)
        }
      ]
    };
    
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error searching restaurants: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Formats price range for display
 * @param priceRange Price range object
 * @returns Formatted price string
 */
function formatPriceRange(priceRange: any): string {
  const currency = priceRange.currency || 'JPY';
  const min = priceRange.min ? `${priceRange.min} ${currency}` : '';
  const max = priceRange.max ? `${priceRange.max} ${currency}` : '';
  
  if (min && max) {
    return `${min} - ${max}`;
  }
  
  return min || max || 'Price not available';
}

/**
 * Formats average price for display
 * @param price Average price
 * @returns Formatted price string
 */
function formatAvgPrice(price: number, currency: string): string {
  if (price) {
    return `${price} ${currency}`;
  } else {
    return 'Price not available';
  }
}

/**
 * Formats search results for display
 * @param results Array of formatted restaurant results
 * @param params Original search parameters
 * @returns Formatted results string
 */
function formatSearchResults(results: any[], params: SearchParams): string {
  if (results.length === 0) {
    return 'No restaurants found matching your criteria. Try adjusting your search parameters.';
  }
  
  let output = `Found ${results.length} restaurant${results.length > 1 ? 's' : ''}`;
  
  if (params.query) {
    output += ` for "${params.query}"`;
  }
  
  if (params.cuisines && params.cuisines.length > 0) {
    output += ` (${params.cuisines.join(', ')} cuisine)`;
  }
  
  if (params.location) {
    output += ` in the specified area`;
  }
  
  output += ':\n\n';
  
  results.forEach((restaurant, index) => {
    output += `${index + 1}. **${restaurant.name}**\n`;
    output += `   • Cuisine(s): ${restaurant.cuisine}\n`;
    output += `   • Price Average: ${restaurant.price_avg}\n`;
    output += `   • Lunch Price Range: ${restaurant.lunch_price_range}\n`;
    output += `   • Dinner Price Range: ${restaurant.dinner_price_range}\n`;
    output += `   • ${restaurant.availability}\n`;
    output += `   • Reservation Link: ${restaurant.reservation_url}\n`;
    
    if (restaurant.image_url) {
      output += `   • Preview Image Link: ${restaurant.image_url}\n`;
    }
    
    output += '\n';
  });
  
  return output;
} 

function formatAvailability(available_dates: string[]): string {
  if (available_dates.length === 0) {
    return 'Contact restaurant for availability'
  }

  return `Available Dates: ${available_dates.join(', ')}`;
}