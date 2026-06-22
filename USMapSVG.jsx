// Equirectangular projection for CONUS
// viewBox: 0 0 960 600
export const US_VIEWBOX = "0 0 960 600";

const LON_LEFT  = -127;
const LON_RIGHT = -63;
const LAT_TOP   = 50.5;
const LAT_BOT   = 23.5;
const PAD_L = 18, PAD_R = 18, PAD_T = 18, PAD_B = 18;

export function lonLatToXY(lon, lat) {
  const x = PAD_L + ((lon - LON_LEFT) / (LON_RIGHT - LON_LEFT)) * (960 - PAD_L - PAD_R);
  const y = PAD_T + ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * (600 - PAD_T - PAD_B);
  return [x, y];
}

export function xyToLonLat(x, y) {
  const lon = LON_LEFT + ((x - PAD_L) / (960 - PAD_L - PAD_R)) * (LON_RIGHT - LON_LEFT);
  const lat = LAT_TOP - ((y - PAD_T) / (600 - PAD_T - PAD_B)) * (LAT_TOP - LAT_BOT);
  return [lon, lat];
}

// No STATE_PATHS — we use city markers and state labels for a clean, accurate overlay
export const STATE_PATHS = [];

// State label positions [lon, lat, abbr] — positioned at state centroids
export const STATE_LABELS = [
  [-68.5, 45.2, 'ME'], [-71.5, 44.0, 'NH'], [-72.7, 44.0, 'VT'],
  [-71.8, 42.3, 'MA'], [-71.5, 41.7, 'RI'], [-72.7, 41.6, 'CT'],
  [-75.5, 43.0, 'NY'], [-74.5, 40.1, 'NJ'], [-77.2, 40.9, 'PA'],
  [-75.5, 39.0, 'DE'], [-76.6, 39.0, 'MD'], [-78.5, 37.5, 'VA'],
  [-80.5, 38.6, 'WV'], [-79.5, 35.5, 'NC'], [-80.9, 33.8, 'SC'],
  [-83.4, 32.7, 'GA'], [-82.5, 28.6, 'FL'], [-86.8, 32.7, 'AL'],
  [-89.7, 32.7, 'MS'], [-86.6, 35.9, 'TN'], [-84.3, 37.8, 'KY'],
  [-82.8, 40.4, 'OH'], [-86.1, 40.0, 'IN'], [-89.2, 40.0, 'IL'],
  [-84.7, 44.3, 'MI'], [-89.6, 44.6, 'WI'], [-94.3, 46.4, 'MN'],
  [-93.5, 42.0, 'IA'], [-92.5, 38.5, 'MO'], [-92.4, 34.8, 'AR'],
  [-91.9, 31.2, 'LA'], [-100.4, 47.5, 'ND'], [-100.3, 44.4, 'SD'],
  [-99.9, 41.5, 'NE'], [-98.4, 38.5, 'KS'], [-97.1, 35.6, 'OK'],
  [-99.9, 31.5, 'TX'], [-106.1, 34.4, 'NM'], [-105.5, 39.0, 'CO'],
  [-107.6, 43.0, 'WY'], [-110.0, 47.0, 'MT'], [-114.0, 44.5, 'ID'],
  [-120.5, 47.5, 'WA'], [-120.5, 43.8, 'OR'], [-119.5, 37.2, 'CA'],
  [-116.9, 38.8, 'NV'], [-111.1, 39.4, 'UT'], [-111.7, 34.3, 'AZ'],
];

// Major cities as reference markers [lon, lat, name]
export const CITY_MARKERS = [
  [-87.6, 41.9, 'Chicago'],
  [-74.0, 40.7, 'New York'],
  [-118.2, 34.1, 'Los Angeles'],
  [-95.4, 29.8, 'Houston'],
  [-112.1, 33.4, 'Phoenix'],
  [-75.2, 39.9, 'Philadelphia'],
  [-98.5, 29.4, 'San Antonio'],
  [-117.2, 32.7, 'San Diego'],
  [-97.5, 35.5, 'Oklahoma City'],
  [-90.2, 29.95, 'New Orleans'],
  [-122.3, 47.6, 'Seattle'],
  [-80.2, 25.8, 'Miami'],
  [-104.9, 39.7, 'Denver'],
  [-86.8, 36.2, 'Nashville'],
  [-83.0, 42.3, 'Detroit'],
  [-93.3, 44.9, 'Minneapolis'],
  [-84.4, 33.7, 'Atlanta'],
  [-71.1, 42.4, 'Boston'],
  [-122.4, 37.8, 'San Francisco'],
  [-96.8, 32.8, 'Dallas'],
  [-79.9, 40.4, 'Pittsburgh'], 
  [-81.4, 28.5, 'Orlando'],
  [-79.4, 43.7, 'Toronto'],
  [-73.6, 45.5, 'Montreal'],
  [-63.6, 44.7, 'Halifax'],
];
