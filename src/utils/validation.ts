import { SearchParams } from '../types/index.js';

export const validateSearchParams = (params: SearchParams): void => {
  if (params.date_min && !isValidDate(params.date_min)) {
    throw new Error('Invalid date_min format. Use YYYY-MM-DD');
  }
  if (params.date_max && !isValidDate(params.date_max)) {
    throw new Error('Invalid date_max format. Use YYYY-MM-DD');
  }
  if (params.num_people && (params.num_people < 1 || params.num_people > 20)) {
    throw new Error('num_people must be between 1 and 20');
  }
  if (params.time && !isValidTime(params.time)) {
    throw new Error('Invalid time format. Use HH:MM');
  }
  if (params.budget_min && params.budget_min < 0) {
    throw new Error('budget_min must be positive');
  }
  if (params.budget_max && params.budget_max < 0) {
    throw new Error('budget_max must be positive');
  }
  if (params.budget_min && params.budget_max && params.budget_min > params.budget_max) {
    throw new Error('budget_min cannot be greater than budget_max');
  }
  if (params.location) {
    if (!isValidLatitude(params.location.lat)) {
      throw new Error('Invalid latitude. Must be between -90 and 90');
    }
    if (!isValidLongitude(params.location.lng)) {
      throw new Error('Invalid longitude. Must be between -180 and 180');
    }
  }
};

const isValidDate = (date: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
};

const isValidTime = (time: string): boolean => {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

const isValidLatitude = (lat: number): boolean => {
  return lat >= -90 && lat <= 90;
};

const isValidLongitude = (lng: number): boolean => {
  return lng >= -180 && lng <= 180;
};

export const validateAvailabilityParams = (params: any): void => {
  if (!params.shop_id) {
    throw new Error('shop_id is required');
  }
  if (!params.start_at) {
    throw new Error('start_at is required');
  }
  if (!params.num_people) {
    throw new Error('num_people is required');
  }
  if (params.num_people < 1 || params.num_people > 20) {
    throw new Error('num_people must be between 1 and 20');
  }
};
