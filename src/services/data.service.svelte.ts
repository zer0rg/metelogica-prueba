import { DATA_SRC, INTERVAL_HOURS, SECONDS_PER_HOUR } from "../consts";
import type { DataForRender, DataPoint, Measurements } from "../types/chart";
import yaml from "js-yaml";
import { timeToSeconds } from "../utils/time.utils";
import { toastService } from "./toast.service.svelte";
import { LTTB } from "downsample";

export class DataService {
  /**
   * loadAndProcessYMLData();
   * Solicita los datos a DATA_SRC, los parsea, normaliza y los convierte
   * al tipo de dato pedido (KW, KW/H y ºC)
   * Devuelve los datos procesados en Measurements
   */
  static async loadAndProcessYMLData(): Promise<Measurements> {
    try {
      const res: Response = await fetch(DATA_SRC);
      if (!res.ok) {
        throw new Error("Fetch error");
      }

      const text = await res.text();
      const ymlData: Measurements = yaml.load(text) as Measurements;

      // Grados Kelvin a celsius
      ymlData.temperature.values.forEach((temperature) => {
        temperature.value = temperature.value * 0.1 - 273.15;
      });

      // Normalizacion de los values de power porque algunos venian con , en vez de . en el separador decimal.
      // y cambio de MW a KW
      ymlData.power.values.forEach((power) => {
        const normalizedValue = this.normalizeValue(power.value);
        power.value = normalizedValue * 1000;
      });

      // Calcular energia acumulada de la ultima hora (Kw/h) por cada DataValue
      ymlData.accumulatedEnergy = this.precalculateAccumulatedEnergy(
        ymlData.power.values
      );
      return ymlData;
    } catch (error) {
      toastService.show("Error al cargar los datos", {
        title: "ERROR",
        status: "error",
      });
      throw new Error("Error al cargar los datos");
    }
  }

  /**
   * precalculateAccumulatedEnergy(powerValues: DataPoint[])
   * Precalcula el consumo acumulado de la ultima hora desde el ultimo dato recorrido
   * y devuelve un DataPoint connel consumo acumulado en Kw/H
   */
  private static precalculateAccumulatedEnergy(
    powerValues: DataPoint[]
  ): DataPoint[] {
    const accumulated: DataPoint[] = [];

    powerValues.forEach((dataPoint, index) => {
      const currentSeconds = timeToSeconds(dataPoint.time);
      const oneHourAgoSeconds = currentSeconds - SECONDS_PER_HOUR; // 1 hora = 3600 segundos

      let hourlyEnergy = 0;

      // Recorrer hacia atrás y sumar a la acumulacion solo los ultimos 60 minutos
      for (let i = index; i >= 0; i--) {
        const pointSeconds = timeToSeconds(powerValues[i].time);
        // Se comparan los dos timeStamps en segundos
        if (pointSeconds >= oneHourAgoSeconds) {
          const energyInInterval = powerValues[i].value * INTERVAL_HOURS;
          hourlyEnergy += energyInInterval;
        } else {
          break;
        }
      }

      accumulated.push({
        time: dataPoint.time,
        value: hourlyEnergy,
      });
    });
    return accumulated;
  }

  /*
   * downsample(data: DataForRender, target: number): DataForRender
   * Reduce el número de puntos de datos aplicando el algoritmo LTTB (Largest Triangle Three Buckets)
   * manteniendo la forma visual de la gráfica. Se usa para optimizar perdiendo la menor precision.
   */
  static downsample(data: DataForRender, target: number): DataForRender {
    const tupleForDownsample: Array<[number, number]> = data.power.map(
      (p, i) => [i, p]
    );
    const lttbResult: Array<[number, number]> = LTTB(
      tupleForDownsample,
      target
    ) as Array<[number, number]>;

    const downSampleIndexes = lttbResult.map(([i, _]) => i);

    return {
      timeLabels: downSampleIndexes.map((idx) => data.timeLabels[idx]),
      power: downSampleIndexes.map((idx) => data.power[idx]),
      temperature: downSampleIndexes.map((idx) => data.temperature[idx]),
      energy: downSampleIndexes.map((idx) => data.energy[idx]),
    };
  }

  /**
   * normalizeValue(value:any) : number
   * Este metodo es necesario porque por alguna razón power tiene values separados
   * decimalmente por comas en vez de puntos en algunos casos...
   */
  private static normalizeValue(value: any): number {
    if (typeof value === "string") {
      return parseFloat(value.replace(",", "."));
    }
    return value;
  }
}
