// Map configuration
export const MAP_CONFIG = {
  defaultCenter: [20, 0] as [number, number],
  defaultZoom: 2,
  minZoom: 2,
  maxZoom: 10,
  maxBounds: [
    [-90, -180],
    [90, 180],
  ] as [[number, number], [number, number]],
  tileLayer: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

// Flight status colors
export const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800',
  boarding: 'bg-purple-100 text-purple-800',
  departed: 'bg-indigo-100 text-indigo-800',
  in_air: 'bg-green-100 text-green-800',
  landed: 'bg-green-100 text-green-800',
  delayed: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
} as const;

// Flight status labels
export const STATUS_LABELS = {
  scheduled: 'Scheduled',
  boarding: 'Boarding',
  departed: 'Departed',
  in_air: 'In Air',
  landed: 'Landed',
  delayed: 'Delayed',
  cancelled: 'Cancelled',
} as const;

// Weather condition icons
export const WEATHER_ICONS = {
  clear: '☀️',
  cloudy: '☁️',
  rain: '🌧️',
  thunderstorm: '⛈️',
  snow: '❄️',
  fog: '🌫️',
} as const;

// Aircraft type icons
export const AIRCRAFT_ICONS = {
  narrowbody: '✈️',
  widebody: '🛫',
  regional: '🛩️',
  private: '🚁',
} as const;

// Default flight filters
export const DEFAULT_FILTERS = {
  status: ['scheduled', 'boarding', 'departed', 'in_air'],
  airline: [],
  aircraft: [],
  minPrice: 0,
  maxPrice: 10000,
  departureTime: {
    from: '00:00',
    to: '23:59',
  },
  arrivalTime: {
    from: '00:00',
    to: '23:59',
  },
} as const;

// API endpoints (mock for now)
export const API_ENDPOINTS = {
  flights: '/api/flights',
  search: '/api/flights/search',
  flightDetails: (flightId: string) => `/api/flights/${flightId}`,
  airports: '/api/airports',
  airlines: '/api/airlines',
  aircraft: '/api/aircraft',
} as const;

// Time formats
export const TIME_FORMATS = {
  time: 'HH:mm',
  date: 'MMM d, yyyy',
  dateTime: 'MMM d, yyyy HH:mm',
  dateTimeWithSeconds: 'MMM d, yyyy HH:mm:ss',
  timeWithSeconds: 'HH:mm:ss',
} as const;

// Flight list pagination
export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 25, 50],
} as const;
