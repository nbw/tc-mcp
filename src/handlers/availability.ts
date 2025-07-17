import { TableCheckService } from '../services/tablecheck.js';
import { AvailabilityParams } from '../types/index.js';
import { validateAvailabilityParams } from '../utils/validation.js';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Handles restaurant availability requests
 * @param tableCheckService Instance of TableCheck service
 * @param args Availability arguments from MCP client
 * @returns Formatted availability results
 */
export async function handleGetAvailability(tableCheckService: TableCheckService, args: any) {
  try {
    // Parse and validate availability parameters
    const availabilityParams: AvailabilityParams = {
      shop_id: args.shop_id,
      start_at: args.start_at,
      timezone: args.timezone,
      num_people: args.num_people,
      locale: args.locale || 'en',
    };
    
    // Validate parameters
    validateAvailabilityParams(availabilityParams);
    
    // Get availability
    const availability = await tableCheckService.getAvailability(availabilityParams);
    
    // Format results for MCP response
    return {
      content: [
        {
          type: "text",
          text: formatAvailabilityResults(availability, availabilityParams)
        }
      ]
    };
    
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error getting availability: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Formats availability results for display
 * @param slots Array of availability slots
 * @param params Original availability parameters
 * @returns Formatted availability string
 */
function formatAvailabilityResults(slots: any[], params: AvailabilityParams): string {
  if (slots.length === 0) {
    return `No availability found for restaurant ${params.shop_id} for ${params.num_people} people starting from ${params.start_at}.`;
  }

  const timezone = params.timezone || 'Asia/Tokyo';
  
  let output = `Availability for restaurant ${params.shop_id} (${params.num_people} people):\n\n`;
  
  // Group slots by date
  const slotsByDate = groupSlotsByDate(slots);
  
  Object.keys(slotsByDate).sort().forEach(date => {
    const dateSlots = slotsByDate[date];
    // const availableSlots = dateSlots.filter(slot => slot.available);
    
    output += `**${formatDate(date, timezone)}**\n`;
    
    if (dateSlots.length === 0) {
      output += `   No availability\n`;
    } else {
      dateSlots.forEach(slot => {
        output += `   • ${formatDate(slot.time, timezone)} (${timezone}) (${slot.party_size} people)\n`;
      });
    }
    
    output += '\n';
  });
  
  return output;
}

/**
 * Groups availability slots by date
 * @param slots Array of availability slots
 * @returns Object with dates as keys and slots as values
 */
function groupSlotsByDate(slots: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  
  slots.forEach(slot => {
    const date = slot.date;
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(slot);
  });
  
  return grouped;
}

/**
 * Formats date for display
 * @param dateString ISO date string
 * @returns Formatted date string
 */
function formatDate(dateString: string, timezone: string): string {
  try {
    return dayjs(dateString).tz(timezone).format();
    // const date = new Date(dateString);
    // return date.toLocaleDateString('en-US', {
    //   weekday: 'long',
    //   year: 'numeric',
    //   month: 'long',
    //   day: 'numeric'
    // });
  } catch (error) {
    return dateString;
  }
} 