// Tipo para cada valor individual
export interface DataPoint {
  time: string;
  value: number;
}

// Tipo para cada serie de datos
export interface Series {
  unit: string;
  values: DataPoint[];
}

// Tipo del objeto parseado desde el YAML completo
export interface Measurements {
  temperature: Series;
  power: Series;
  accumulatedEnergy?: DataPoint[];
}

// Interfaz con los datos listo para renderizar en el chart.
export interface DataForRender {
  temperature: number[];
  power: number[];
  energy: number[];
  timeLabels: string[];
}
