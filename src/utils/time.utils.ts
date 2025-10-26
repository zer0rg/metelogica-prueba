/**
 * timeToSeconds(timeStr : string) :
 *  Devuelve la conversión de un string de hora completa (00:00:00) a segundos
 */
export function timeToSeconds(timeStr: string) {
  const [h, m, s] = timeStr.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

/**
 * currentSecondsOfDay()
 * Devuelve la hora actual en segundos
 */
export function currentSecondsOfDay() {
  const now = new Date();
  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
}

/**
 * getHour()
 * Devuelve la hora actual en una string formato HH:MM:SS
 */
export function getHour() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}
