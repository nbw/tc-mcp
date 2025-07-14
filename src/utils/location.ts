import { CONFIG } from '../config/constants.js';

/**
 * Resolves a location query string to geographic coordinates
 * @param query Location query string
 * @returns Promise containing lat/lng coordinates
 */
export const resolveLocation = async (query: string): Promise<{lat: number, lng: number}> => {
  // Known locations in Tokyo area
  const knownLocations: Record<string, {lat: number, lng: number}> = {
    'shibuya': { lat: 35.6596, lng: 139.7006 },
    'shinjuku': { lat: 35.6938, lng: 139.7034 },
    'tokyo station': { lat: 35.6812, lng: 139.7671 },
    'ginza': { lat: 35.6717, lng: 139.7653 },
    'harajuku': { lat: 35.6703, lng: 139.7027 },
    'roppongi': { lat: 35.6627, lng: 139.7321 },
    'akasaka': { lat: 35.6735, lng: 139.7377 },
    'asakusa': { lat: 35.7148, lng: 139.7967 },
    'ikebukuro': { lat: 35.7295, lng: 139.7109 },
    'ueno': { lat: 35.7138, lng: 139.7774 },
    'nakameguro': { lat: 35.6436, lng: 139.6983 },
    'ebisu': { lat: 35.6467, lng: 139.7102 },
    'daikanyama': { lat: 35.6496, lng: 139.6993 },
    'tsukiji': { lat: 35.6654, lng: 139.7707 },
    'yokohama': { lat: 35.4437, lng: 139.6380 },
    'kamakura': { lat: 35.3192, lng: 139.5491 },
    'odaiba': { lat: 35.6269, lng: 139.7767 },
    'akihabara': { lat: 35.7022, lng: 139.7742 },
    'jimbocho': { lat: 35.6952, lng: 139.7577 },
    'kagurazaka': { lat: 35.7022, lng: 139.7401 },
    'nihonbashi': { lat: 35.6833, lng: 139.7744 },
    'marunouchi': { lat: 35.6792, lng: 139.7644 },
    'otemachi': { lat: 35.6847, lng: 139.7678 },
    'hibiya': { lat: 35.6739, lng: 139.7593 },
    'kasumigaseki': { lat: 35.6738, lng: 139.7521 },
    'toranomon': { lat: 35.6695, lng: 139.7496 },
    'shimbashi': { lat: 35.6657, lng: 139.7587 },
    'yurakucho': { lat: 35.6751, lng: 139.7634 },
    'omote-sando': { lat: 35.6658, lng: 139.7128 },
    'takeshita-dori': { lat: 35.6703, lng: 139.7027 },
    'meiji-jingu': { lat: 35.6764, lng: 139.6993 },
    'yoyogi': { lat: 35.6837, lng: 139.7020 },
    'sangenjaya': { lat: 35.6430, lng: 139.6685 },
    'shimokitazawa': { lat: 35.6613, lng: 139.6681 },
    'kichijoji': { lat: 35.7033, lng: 139.5806 },
    'shinjuku-south': { lat: 35.6896, lng: 139.7006 },
    'shinjuku-east': { lat: 35.6938, lng: 139.7051 },
    'shinjuku-west': { lat: 35.6916, lng: 139.6993 }
  };
  
  const normalized = query.toLowerCase().trim();
  
  // Direct match
  if (knownLocations[normalized]) {
    return knownLocations[normalized];
  }
  
  // Fuzzy matching for partial matches
  const matchedKey = Object.keys(knownLocations).find(key => 
    key.includes(normalized) || normalized.includes(key)
  );
  
  if (matchedKey) {
    return knownLocations[matchedKey];
  }
  
  // Default to Tokyo Station if no match found
  return CONFIG.DEFAULT_LOCATION;
};

/**
 * Calculates distance between two geographic points
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}; 