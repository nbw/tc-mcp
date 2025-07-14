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
      address: restaurant.location.address,
      price_range: formatPriceRange(restaurant.price_range),
      rating: restaurant.rating ? `${restaurant.rating}/5` : 'No rating',
      availability: restaurant.availability_summary,
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
  if (!priceRange.min && !priceRange.max) {
    return 'Price not available';
  }
  
  const currency = priceRange.currency || 'JPY';
  const min = priceRange.min ? `${priceRange.min} ${currency}` : '';
  const max = priceRange.max ? `${priceRange.max} ${currency}` : '';
  
  if (min && max) {
    return `${min} - ${max}`;
  }
  
  return min || max || 'Price not available';
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
    output += `   • Cuisine: ${restaurant.cuisine}\n`;
    output += `   • Address: ${restaurant.address}\n`;
    output += `   • Price Range: ${restaurant.price_range}\n`;
    output += `   • Rating: ${restaurant.rating}\n`;
    output += `   • Availability: ${restaurant.availability}\n`;
    output += `   • Reservation Link: ${restaurant.reservation_url}\n`;
    
    if (restaurant.image_url) {
      output += `   • Image: ${restaurant.image_url}\n`;
    }
    
    output += '\n';
  });
  
  return output;
} 