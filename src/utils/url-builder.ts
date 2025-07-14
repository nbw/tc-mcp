import { SearchParams } from '../types/index.js';
import { CONFIG } from '../config/constants.js';

/**
 * Builds a reservation URL for a specific restaurant
 * @param shopId Restaurant slug or ID
 * @param params Search parameters to include in the URL
 * @param locale Language locale
 * @returns Complete reservation URL
 */
export const buildReservationUrl = (
  shopId: string,
  params: Partial<SearchParams> = {},
  locale: string = 'en'
): string => {
  const baseUrl = `https://www.tablecheck.com/${locale}/${shopId}`;
  const queryParams = new URLSearchParams();
  
  // Add standard parameters
  queryParams.append('availability_days_limit', CONFIG.DEFAULT_AVAILABILITY_DAYS.toString());
  queryParams.append('availability_format', 'date');
  queryParams.append('service_mode', CONFIG.DEFAULT_SERVICE_MODE);
  queryParams.append('venue_type', CONFIG.DEFAULT_VENUE_TYPE);
  
  // Add user parameters
  if (params.num_people) {
    queryParams.append('num_people', params.num_people.toString());
  }
  if (params.date_min) {
    queryParams.append('date_min', params.date_min);
  }
  if (params.date_max) {
    queryParams.append('date_max', params.date_max);
  }
  if (params.time) {
    queryParams.append('time', params.time);
    queryParams.append('availability_mode', 'same_meal_time');
  }
  if (params.budget_min) {
    queryParams.append('budget_dinner_avg_min', params.budget_min.toString());
  }
  if (params.budget_max) {
    queryParams.append('budget_dinner_avg_max', params.budget_max.toString());
  }
  if (params.location) {
    queryParams.append('geo_latitude', params.location.lat.toString());
    queryParams.append('geo_longitude', params.location.lng.toString());
  }
  if (params.geo_distance) {
    queryParams.append('geo_distance', params.geo_distance);
  }
  if (params.sort_by) {
    queryParams.append('sort_by', params.sort_by);
  }
  if (params.sort_order) {
    queryParams.append('sort_order', params.sort_order);
  }
  
  return `${baseUrl}?${queryParams.toString()}`;
};

/**
 * Builds a shop search URL for the TableCheck API
 * @param params Search parameters
 * @returns Complete API URL for shop search
 */
export const buildShopSearchUrl = (params: SearchParams): string => {
  const baseUrl = `${CONFIG.API_BASE_URL}/shop_search`;
  const queryParams = new URLSearchParams();
  
  // Add required parameters
  queryParams.append('shop_universe_id', CONFIG.SHOP_UNIVERSE_ID);
  queryParams.append('availability_days_limit', CONFIG.DEFAULT_AVAILABILITY_DAYS.toString());
  queryParams.append('availability_format', 'date');
  queryParams.append('service_mode', CONFIG.DEFAULT_SERVICE_MODE);
  queryParams.append('venue_type', CONFIG.DEFAULT_VENUE_TYPE);
  queryParams.append('per_page', CONFIG.DEFAULT_PER_PAGE.toString());
  queryParams.append('include_ids', 'true');
  
  // Add randomization to prevent caching issues
  queryParams.append('randomize_geo', Math.floor(Math.random() * 10000).toString());
  
  // Add optional parameters
  if (params.location) {
    queryParams.append('geo_latitude', params.location.lat.toString());
    queryParams.append('geo_longitude', params.location.lng.toString());
  }
  if (params.geo_distance) {
    queryParams.append('geo_distance', params.geo_distance);
  }
  if (params.date_min) {
    queryParams.append('date_min', params.date_min);
  }
  if (params.date_max) {
    queryParams.append('date_max', params.date_max);
  }
  if (params.num_people) {
    queryParams.append('num_people', params.num_people.toString());
  }
  if (params.time) {
    queryParams.append('time', params.time);
    queryParams.append('availability_mode', 'same_meal_time');
  }
  if (params.budget_min) {
    queryParams.append('budget_dinner_avg_min', params.budget_min.toString());
  }
  if (params.budget_max) {
    queryParams.append('budget_dinner_avg_max', params.budget_max.toString());
  }
  if (params.sort_by) {
    queryParams.append('sort_by', params.sort_by);
  }
  if (params.sort_order) {
    queryParams.append('sort_order', params.sort_order);
  }
  if (params.cuisines && params.cuisines.length > 0) {
    params.cuisines.forEach(cuisine => {
      queryParams.append('cuisines[]', cuisine);
    });
  }
  
  return `${baseUrl}?${queryParams.toString()}`;
};

/**
 * Builds an autocomplete URL for text search
 * @param params Search parameters
 * @returns Complete API URL for autocomplete
 */
export const buildAutocompleteUrl = (params: SearchParams): string => {
  const baseUrl = `${CONFIG.API_BASE_URL}/autocomplete`;
  const queryParams = new URLSearchParams();
  
  // Add required parameters
  queryParams.append('shop_universe_id', CONFIG.SHOP_UNIVERSE_ID);
  queryParams.append('locale', params.locale || CONFIG.DEFAULT_LOCALE);
  
  if (params.query) {
    queryParams.append('text', params.query);
  }
  
  return `${baseUrl}?${queryParams.toString()}`;
};

/**
 * Builds a cuisines list URL
 * @param locale Language locale
 * @returns Complete API URL for cuisines
 */
export const buildCuisinesUrl = (locale: string = 'en'): string => {
  return `${CONFIG.API_BASE_URL}/cuisines`;
};

/**
 * Builds an availability calendar URL
 * @returns Complete API URL for availability calendar
 */
export const buildAvailabilityUrl = (): string => {
  return `${CONFIG.API_BASE_URL}/hub/availability_calendar`;
}; 