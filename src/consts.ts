// ========== DATA SOURCE ==========
export const DATA_SRC = "/data/data.yml";

// ========== INTERVALOS DE TIEMPO ==========
export const CLOCK_INTERVAL_MS = 1000;
export const COUNTDOWN_INTERVAL_MS = 1000;
export const DATA_REFRESH_INTERVAL_MS = 5000;

// ========== CONVERSIONES DE TIEMPO =
export const MEASUREMENT_INTERVAL_SECONDS = 5;
export const SECONDS_PER_HOUR = 3600;
export const SECONDS_PER_MINUTE = 60;

// CONVERSIONES DE UNIDADES
export const KELVIN_SCALE_FACTOR = 0.1;
export const KELVIN_TO_CELSIUS_OFFSET = 273.15;
export const WATTS_TO_KILOWATTS = 1000;

// ========== CÁLCULOS DE ENERGÍA ==========
export const INTERVAL_HOURS = MEASUREMENT_INTERVAL_SECONDS / SECONDS_PER_HOUR;

// ========== TOASTS ==========
export const MAX_TOASTS = 5;
export const TOAST_TIMEOUT = 5000;

// ========== CHART ==========
export const DEFAULT_TIME_WINDOW_MINUTES = 60;
export const DOWNSAMPLING_TARGETS = {
  1: 12,
  5: 30,
  10: 60,
  30: 90,
  60: 120,
  default: 150,
} as const;