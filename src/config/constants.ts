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