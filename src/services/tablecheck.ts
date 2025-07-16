import { SearchParams, RestaurantResult, AvailabilityParams, AvailabilitySlot, Cuisine, AutocompleteResponse, ShopSearchResponse } from '../types/index.js';
import { CONFIG } from '../config/constants.js';
import { buildShopSearchUrl, buildAutocompleteUrl, buildCuisinesUrl, buildAvailabilityUrl, buildReservationUrl } from '../utils/url-builder.js';

/**
 * Custom error class for TableCheck API errors
 */
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

/**
 * Handles API errors and throws appropriate TableCheckError
 */
const handleApiError = (error: any): never => {
  if (error.response?.status === 404) {
    throw new TableCheckError('Restaurant not found', 404);
  }
  if (error.response?.status === 429) {
    throw new TableCheckError('Rate limit exceeded', 429);
  }
  if (error.response?.status === 400) {
    throw new TableCheckError('Invalid request parameters', 400);
  }
  throw new TableCheckError('API request failed', error.response?.status || 500);
};

/**
 * TableCheck API service for restaurant search and reservations
 */
export class TableCheckService {
  private baseUrl = CONFIG.API_BASE_URL;

  /**
   * Searches for restaurants using either text search or parameter-based search
   * @param params Search parameters
   * @returns Array of restaurant results
   */
  async searchRestaurants(params: SearchParams): Promise<RestaurantResult[]> {
    try {
      if (params.query) {
        return await this.textSearch(params);
      } else {
        return await this.parameterSearch(params);
      }
    } catch (error) {
      console.error('Search error:', error);
      return handleApiError(error);
    }
  }

  /**
   * Performs text-based search using the autocomplete endpoint
   * @param params Search parameters with query text
   * @returns Array of restaurant results
   */
  private async textSearch(params: SearchParams): Promise<RestaurantResult[]> {
    const url = buildAutocompleteUrl(params);
    console.error('Autocomplete URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new TableCheckError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }

    const data = await response.json() as AutocompleteResponse;
    return this.parseAutocompleteResponse(data, params);
  }

  /**
   * Performs parameter-based search using the shop_search endpoint
   * @param params Search parameters
   * @returns Array of restaurant results
   */
  private async parameterSearch(params: SearchParams): Promise<RestaurantResult[]> {
    const url = buildShopSearchUrl(params);
    console.error('Shop search URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new TableCheckError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }

    const data = await response.json() as ShopSearchResponse;
    return this.parseShopSearchResponse(data, params);
  }

  /**
   * Parses autocomplete API response into restaurant results
   * @param response Autocomplete API response
   * @param params Original search parameters
   * @returns Array of restaurant results
   */
  private parseAutocompleteResponse(response: AutocompleteResponse, params: SearchParams): RestaurantResult[] {
    const results: RestaurantResult[] = [];

    if (response.shops && response.shops.length > 0) {
      response.shops.forEach((shop: any) => {
        const slug =  shop.payload ? shop.payload.shop_slug : null
        const result: RestaurantResult = {
          id: slug,
          name: shop.text || 'Unknown Restaurant',
          slug: slug,
          cuisine: shop.cuisines || [],
          location: {
            lat: shop.geocode ? shop.geocode.lat : null,
            lng: shop.geocode ? shop.geocode.lon : null,
          },
          price_range: {
            avg: shop.budget_avg,
            min: shop.budget_lunch_min || shop.price_range?.min,
            max: shop.budget_dinner_max || shop.price_range?.max,
            currency: shop.currency || 'JPY',
          },
          availability_summary: "",
          image_url: "",
          reservation_url: buildReservationUrl(slug, params, params.locale),
        };
        results.push(result);
      });
    }

    return results;
  }

  /**
   * Parses shop search API response into restaurant results
   * @param response Shop search API response
   * @param params Original search parameters
   * @returns Array of restaurant results
   */
  private parseShopSearchResponse(response: ShopSearchResponse, params: SearchParams): RestaurantResult[] {
    const results: RestaurantResult[] = [];

    if (response.shops && response.shops.length > 0) {
      response.shops.forEach((shop: any) => {
        const result: RestaurantResult = {
          id: shop.id || shop.slug,
          name: shop.name[0] || 'Unknown Restaurant',
          slug: shop.slug || shop.id,
          cuisine: shop.cuisines || [],
          location: {
            lat: shop.geocode ? shop.geocode.lat : null,
            lng: shop.geocode ? shop.geocode.lon : null,
          },
          price_range: {
            min: shop.budget_lunch_min,
            max: shop.budget_dinner_max,
            avg: shop.budget_avg,
            currency: shop.currency || 'JPY',
          },
          availability_summary: this.formatAvailabilitySummary(shop),
          image_url: shop.search_image,
          reservation_url: buildReservationUrl(shop.slug || shop.id, params, params.locale),
        };
        results.push(result);
      });
    }

    return results;
  }

  /**
   * Formats availability information into a readable summary
   * @param shop Shop data from API
   * @returns Formatted availability summary
   */
  private formatAvailabilitySummary(shop: any): string {
    if (shop.availability_summary) {
      return shop.availability_summary;
    }

    if (shop.availability_status) {
      return `Availability: ${shop.availability_status}`;
    }

    if (shop.next_available_date) {
      return `Next available: ${shop.next_available_date}`;
    }

    return 'Contact restaurant for availability';
  }

  /**
   * Gets detailed availability calendar for a specific restaurant
   * @param params Availability parameters
   * @returns Array of availability slots
   */
  async getAvailability(params: AvailabilityParams): Promise<AvailabilitySlot[]> {
    try {
      const url = buildAvailabilityUrl();
      console.error('Availability URL:', url);

      const requestBody = {
        locale: params.locale || CONFIG.DEFAULT_LOCALE,
        start_at: params.start_at,
        shop_id: params.shop_id,
        num_people: params.num_people.toString(),
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new TableCheckError(`HTTP ${response.status}: ${response.statusText}`, response.status);
      }

      const data = await response.json() as any;
      return this.parseAvailabilityResponse(data, params.num_people);
    } catch (error) {
      console.error('Availability error:', error);
      return handleApiError(error);
    }
  }

  /**
   * Parses availability API response into availability slots
   * @param response Availability API response
   * @returns Array of availability slots
   */
  private parseAvailabilityResponse(response: any, party_size: number): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];

    if (response.availability_calendar && response.availability_calendar.data) {
      Object.entries(response.availability_calendar.data).forEach(([date, times]) => {
        Object.entries(times as Record<string, boolean>).forEach(([time, available]) => {
          slots.push({
            date: date,
            time: time,
            available: available,
            party_size: party_size,
          });
        });
      });
    }

    return slots;
  }

  /**
   * Gets list of available cuisines
   * @param locale Language locale
   * @returns Array of cuisines
   */
  async getCuisines(locale: string = 'en'): Promise<Cuisine[]> {
    try {
      const url = buildCuisinesUrl(locale);
      console.error('Cuisines URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });


      if (!response.ok) {
        throw new TableCheckError(`HTTP ${response.status}: ${response.statusText}`, response.status);
      }

      const data = await response.json() as any;
      return this.parseCuisinesResponse(data, locale);
    } catch (error) {
      console.error('Cuisines error:', error);
      return handleApiError(error);
    }
  }

  /**
   * Parses cuisines API response into cuisine objects
   * @param response Cuisines API response
   * @param locale Language locale
   * @returns Array of cuisines
   */
  private parseCuisinesResponse(response: any, locale: string): Cuisine[] {
    const cuisines: Cuisine[] = [];

    if (response && response["cuisines"] && Array.isArray(response["cuisines"])) {
      response["cuisines"].forEach((cuisine: any) => {
        const cuisine_for_locale = cuisine.text_translations.find((translation: any) => translation.locale === locale)
        cuisines.push({
          id: cuisine.field,
          name: cuisine_for_locale.translation,
          locale: locale,
        });
      });
    }

    return cuisines;
  }

  /**
   * Generates a reservation link for a specific restaurant
   * @param shopId Restaurant slug or ID
   * @param params Search parameters to include in the link
   * @param locale Language locale
   * @returns Reservation URL
   */
  generateReservationLink(shopId: string, params: Partial<SearchParams> = {}, locale: string = 'en'): string {
    return buildReservationUrl(shopId, params, locale);
  }
} 