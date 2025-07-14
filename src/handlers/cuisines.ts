import { TableCheckService } from '../services/tablecheck.js';

/**
 * Handles cuisine list requests
 * @param tableCheckService Instance of TableCheck service
 * @param args Cuisine arguments from MCP client
 * @returns Formatted cuisine list
 */
export async function handleListCuisines(tableCheckService: TableCheckService, args: any) {
  try {
    const locale = args.locale || 'en';
    
    // Get cuisines
    const cuisines = await tableCheckService.getCuisines(locale);
    
    // Format results for MCP response
    return {
      content: [
        {
          type: "text",
          text: formatCuisinesList(cuisines, locale)
        }
      ]
    };
    
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error getting cuisines: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Formats cuisine list for display
 * @param cuisines Array of cuisine objects
 * @param locale Language locale
 * @returns Formatted cuisine list string
 */
function formatCuisinesList(cuisines: any[], locale: string): string {
  if (cuisines.length === 0) {
    return `No cuisines found for locale ${locale}.`;
  }
  
  let output = `Available cuisines (${cuisines.length} total):\n\n`;
  
  // Sort cuisines alphabetically
  const sortedCuisines = cuisines.sort((a, b) => a.name.localeCompare(b.name));
  
  sortedCuisines.forEach((cuisine, index) => {
    output += `${index + 1}. **${cuisine.name}** (${cuisine.id})\n`;
  });
  
  output += '\nYou can use these cuisine IDs when searching for restaurants with specific cuisine types.';
  
  return output;
} 