// Approximate location from a time zone, for visits without an IP location
// (ad blockers, Brave…). Table from the tinyURL project: [country, lat, lon].
export const TZ_GEO = {
  "America/Mexico_City": ["MX", 19.43, -99.13], "America/Cancun": ["MX", 21.16, -86.85], "America/Monterrey": ["MX", 25.69, -100.32],
  "America/Merida": ["MX", 20.97, -89.62], "America/Chihuahua": ["MX", 28.63, -106.07], "America/Hermosillo": ["MX", 29.07, -110.96],
  "America/Mazatlan": ["MX", 23.25, -106.41], "America/Tijuana": ["MX", 32.51, -117.04], "America/Bogota": ["CO", 4.71, -74.07],
  "America/Caracas": ["VE", 10.48, -66.9], "America/Lima": ["PE", -12.05, -77.04], "America/Guayaquil": ["EC", -2.19, -79.89],
  "America/Santiago": ["CL", -33.45, -70.67], "America/Argentina/Buenos_Aires": ["AR", -34.6, -58.38], "America/Buenos_Aires": ["AR", -34.6, -58.38],
  "America/Argentina/Cordoba": ["AR", -31.42, -64.18], "America/Argentina/Mendoza": ["AR", -32.89, -68.84], "America/Montevideo": ["UY", -34.9, -56.16],
  "America/Asuncion": ["PY", -25.26, -57.58], "America/La_Paz": ["BO", -16.5, -68.15], "America/Sao_Paulo": ["BR", -23.55, -46.63],
  "America/Bahia": ["BR", -12.97, -38.5], "America/Fortaleza": ["BR", -3.73, -38.52], "America/Recife": ["BR", -8.05, -34.88],
  "America/Manaus": ["BR", -3.12, -60.02], "America/Belem": ["BR", -1.46, -48.49], "America/Panama": ["PA", 8.98, -79.52],
  "America/Costa_Rica": ["CR", 9.93, -84.08], "America/Guatemala": ["GT", 14.63, -90.51], "America/El_Salvador": ["SV", 13.69, -89.22],
  "America/Tegucigalpa": ["HN", 14.07, -87.19], "America/Managua": ["NI", 12.11, -86.24], "America/Havana": ["CU", 23.11, -82.37],
  "America/Santo_Domingo": ["DO", 18.49, -69.93], "America/Puerto_Rico": ["PR", 18.47, -66.11], "America/New_York": ["US", 40.71, -74.01],
  "America/Detroit": ["US", 42.33, -83.05], "America/Indiana/Indianapolis": ["US", 39.77, -86.16], "America/Kentucky/Louisville": ["US", 38.25, -85.76],
  "America/Chicago": ["US", 41.88, -87.63], "America/Denver": ["US", 39.74, -104.99], "America/Phoenix": ["US", 33.45, -112.07],
  "America/Los_Angeles": ["US", 34.05, -118.24], "America/Anchorage": ["US", 61.22, -149.9], "Pacific/Honolulu": ["US", 21.31, -157.86],
  "America/Toronto": ["CA", 43.65, -79.38], "America/Vancouver": ["CA", 49.28, -123.12], "America/Edmonton": ["CA", 53.55, -113.49],
  "America/Winnipeg": ["CA", 49.9, -97.14], "America/Halifax": ["CA", 44.65, -63.57], "Europe/Madrid": ["ES", 40.42, -3.7],
  "Atlantic/Canary": ["ES", 28.12, -15.43], "Europe/Lisbon": ["PT", 38.72, -9.14], "Europe/London": ["GB", 51.51, -0.13],
  "Europe/Dublin": ["IE", 53.35, -6.26], "Europe/Paris": ["FR", 48.86, 2.35], "Europe/Berlin": ["DE", 52.52, 13.4],
  "Europe/Rome": ["IT", 41.9, 12.5], "Europe/Amsterdam": ["NL", 52.37, 4.9], "Europe/Brussels": ["BE", 50.85, 4.35],
  "Europe/Zurich": ["CH", 47.38, 8.54], "Europe/Vienna": ["AT", 48.21, 16.37], "Europe/Stockholm": ["SE", 59.33, 18.07],
  "Europe/Oslo": ["NO", 59.91, 10.75], "Europe/Copenhagen": ["DK", 55.68, 12.57], "Europe/Warsaw": ["PL", 52.23, 21.01],
  "Europe/Prague": ["CZ", 50.08, 14.44], "Europe/Athens": ["GR", 37.98, 23.73], "Europe/Istanbul": ["TR", 41.01, 28.98],
  "Europe/Moscow": ["RU", 55.76, 37.62], "Europe/Kiev": ["UA", 50.45, 30.52], "Europe/Kyiv": ["UA", 50.45, 30.52],
  "Europe/Bucharest": ["RO", 44.43, 26.1], "Europe/Helsinki": ["FI", 60.17, 24.94], "Asia/Tokyo": ["JP", 35.68, 139.69],
  "Asia/Shanghai": ["CN", 31.23, 121.47], "Asia/Hong_Kong": ["HK", 22.32, 114.17], "Asia/Singapore": ["SG", 1.35, 103.82],
  "Asia/Kolkata": ["IN", 22.57, 88.36], "Asia/Calcutta": ["IN", 22.57, 88.36], "Asia/Dubai": ["AE", 25.2, 55.27],
  "Asia/Seoul": ["KR", 37.57, 126.98], "Asia/Manila": ["PH", 14.6, 120.98], "Asia/Jakarta": ["ID", -6.21, 106.85],
  "Asia/Bangkok": ["TH", 13.76, 100.5], "Australia/Sydney": ["AU", -33.87, 151.21], "Australia/Melbourne": ["AU", -37.81, 144.96],
  "Pacific/Auckland": ["NZ", -36.85, 174.76], "Africa/Johannesburg": ["ZA", -26.2, 28.05], "Africa/Cairo": ["EG", 30.04, 31.24],
  "Africa/Lagos": ["NG", 6.52, 3.38], "Africa/Casablanca": ["MA", 33.57, -7.59],
};

/** { cc, lat, lon, city } for a time zone, or null. */
export function geoFromTimeZone(tz) {
  const g = TZ_GEO[tz];
  if (!g) return null;
  return { cc: g[0], lat: g[1], lon: g[2], city: tz.split('/').pop().replace(/_/g, ' ') };
}
