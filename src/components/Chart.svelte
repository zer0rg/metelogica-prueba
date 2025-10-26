<script lang="ts">
  import { onMount } from "svelte";
  import { Chart, registerables, type ChartConfiguration } from "chart.js";
  import type { DataForRender } from "../types/chart";
  import {
    DEFAULT_TIME_WINDOW_MINUTES,
    DOWNSAMPLING_TARGETS,
  } from "../consts";
  import { toastService } from "../services/toast.service.svelte";
  import { DataService } from "../services/data.service.svelte";

  Chart.register(...registerables);

  // Propiedas recibidas del padre
  let { measurements } = $props<{
    measurements: DataForRender | null;
    dataInterval: number;
  }>();

  // Estado principal del chart
  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let chart = $state<Chart<"line"> | null>(null);
  let MINUTES_SHOWN = $state(DEFAULT_TIME_WINDOW_MINUTES);

  // Variable para guardar el observador de resize del chart
  let ro: ResizeObserver | null = null;

  /**
   * onMount() Montaje del componente
   *
   * Llama a initChart y inicializa el observador del resize
   */
  onMount(() => {
    if (!canvasEl) {
      toastService.show("Error cargando el gráfico", {
        title: "ERROR",
        status: "error",
      });
      return;
    }
    initChart();
    // Observador para cuando el chart hace resize
    if (canvasEl) {
      const parent = canvasEl.parentElement!;
      ro = new ResizeObserver(() => {
        if (chart) {
          chart.resize();
        }
      });
      ro.observe(parent);
    }

    return () => {
      if (chart) {
        chart.destroy();
        chart = null;
      }
    };
  });

  /**
   *  Derivada del estado que se encarga de aplicar DownSampling
   *  dependendiendo del MINUTES_SHOWN elegido por el usuario para mostrar
   *  los puntos optimos dependindo del seleccionado.
   *
   * Se recalcula cuando el estado de measurements o MINUTES_SHOWN cambia
   */
  let windowed: DataForRender = $derived.by(() => {
    if (!measurements)
      return {
        timeLabels: [] as string[],
        power: [] as number[],
        temperature: [] as number[],
        energy: [] as number[],
      };

    // Numero total de puntos que queremos considerar segun los minutos que vamos a mostrar
    const totalPoints = Math.min(
      measurements.timeLabels.length,
      MINUTES_SHOWN * 12 + 1
    );
    const start = measurements.timeLabels.length - totalPoints;

    const sliced: DataForRender = {
      timeLabels: measurements.timeLabels.slice(start),
      power: measurements.power.map(Number).slice(start),
      temperature: measurements.temperature.map(Number).slice(start),
      energy: measurements.energy.map(Number).slice(start),
    };

    const targetPoints =
      DOWNSAMPLING_TARGETS[
        MINUTES_SHOWN as keyof typeof DOWNSAMPLING_TARGETS
      ] ?? DOWNSAMPLING_TARGETS.default;

    // Si tenemos menos puntos que targetPoints, no hacer downsampling
    if (sliced.timeLabels.length <= targetPoints) {
      return {
        timeLabels: sliced.timeLabels,
        temperature: sliced.temperature,
        power: sliced.power,
        energy: sliced.energy,
      };
    }

    const downSampledData: DataForRender = DataService.downsample(
      sliced,
      targetPoints
    );

    return downSampledData;
  });

  // Cuando la derivada windowed cambia, actualizamos el chart.
  $effect(() => {
    const w = windowed;
    if (!chart || !w || w.timeLabels!.length === 0) return;
    chart.data.labels = w.timeLabels;
    chart.data.datasets[0].data = w.power as any;
    chart.data.datasets[1].data = w.temperature as any;
    chart.data.datasets[2].data = w.energy as any;
    chart.update();
  });

  /**
   *  initChart()
   *  Inicializa el char con una nueva instancia
   */
  function initChart() {
    if (!canvasEl) return null;
    const ctx = canvasEl.getContext("2d")!;
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "POTENCIA INMEDIATA (KW)",
            data: [],
            borderColor:
              getComputedStyle(document.documentElement)
                .getPropertyValue("--chart-power")
                .trim() || "#FFD700",
            backgroundColor: "rgba(255, 215, 0, 0.1)",
            tension: 0.3,
            fill: false,
            yAxisID: "y0",
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor:
              getComputedStyle(document.documentElement)
                .getPropertyValue("--chart-power")
                .trim() || "#FFD700",
          },
          {
            label: "TEMPERATURA (°C)",
            data: [],
            borderColor:
              getComputedStyle(document.documentElement)
                .getPropertyValue("--chart-temperature")
                .trim() || "#00FFFF",
            backgroundColor: "rgba(0, 255, 255, 0.1)",
            fill: false,
            yAxisID: "y1",
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor:
              getComputedStyle(document.documentElement)
                .getPropertyValue("--chart-temperature")
                .trim() || "#00FFFF",
            spanGaps: true,
          },
          {
            label: "ENERGIA (Kw/H)",
            data: [],
            borderColor:
              getComputedStyle(document.documentElement)
                .getPropertyValue("--chart-energy")
                .trim() || "#00FFFF",
            backgroundColor: "rgba(0, 255, 255, 0.1)",
            fill: false,
            yAxisID: "y0",
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor:
              getComputedStyle(document.documentElement)
                .getPropertyValue("--chart-energy")
                .trim() || "#00FFFF",
            spanGaps: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: { y0: { beginAtZero: false }, y1: { position: "right" } },
      },
    });
  }
</script>

<div class="chart-component">
  <div class="chart-header">
    <h2>Gráfica en tiempo real</h2>
    <select bind:value={MINUTES_SHOWN}>
      <option value={1}>1 minuto</option>
      <option value={5}>5 minutos</option>
      <option value={10}>10 minutos</option>
      <option value={30}>30 minutos</option>
      <option value={60}>1 hora</option>
      <option value={350}>5 horas</option>
      <option value={720}>12 horas</option>
      <option value={1440}>24 horas</option>
    </select>
  </div>

  <div class="chart-wrapper">
    <canvas bind:this={canvasEl}></canvas>
  </div>
</div>

<style>
  .chart-component {
    background: var(--bg-card);
    padding: var(--spacing-xl);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    position: relative;
    overflow: hidden;
    transition: box-shadow var(--transition);
  }

  .chart-component::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--color-primary);
  }

  .chart-component:hover {
    box-shadow: var(--shadow-xl), var(--shadow-glow);
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-md);
  }

  .chart-header h2 {
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .chart-header select {
    background-color: var(--bg-main);
    color: var(--text-primary);
    border: 2px solid transparent;
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    box-shadow: var(--shadow-md);
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23fff' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right var(--spacing-sm) center;
    padding-right: var(--spacing-2xl);
  }

  .chart-header select:hover {
    background-color: var(--bg-hover);
    box-shadow: var(--shadow-lg);
  }

  .chart-header select:focus {
    outline: none;
    box-shadow: var(--shadow-lg);
  }

  .chart-header select option {
    background-color: var(--bg-main);
    color: var(--text-primary);
    padding: var(--spacing-sm);
  }

  .chart-wrapper {
    background-color: var(--bg-elevated);
    padding: var(--spacing-lg);
    border-radius: var(--radius-md); 
    height: 400px;
    position: relative;
    width: 100%;
  }

  .chart-wrapper canvas {
    position: absolute !important;
    top: var(--spacing-lg);
    left: var(--spacing-lg);
    right: var(--spacing-lg);
    bottom: var(--spacing-lg);
  }

  @media (max-width: 768px) {
    .chart-component {
      padding: var(--spacing-lg);
      gap: var(--spacing-lg);
    }

    .chart-header {
      flex-direction: column;
      align-items: stretch;
      gap: var(--spacing-sm);
    }

    .chart-header h2 {
      font-size: var(--text-xl);
      text-align: center;
    }

    .chart-header select {
      width: 100%;
      text-align: center;
    }

    .chart-wrapper {
      padding: var(--spacing-md);
      height: 350px;
    }

    .chart-wrapper canvas {
      top: var(--spacing-md);
      left: var(--spacing-md);
      right: var(--spacing-md);
      bottom: var(--spacing-md);
    }
  }

  @media (max-width: 480px) {
    .chart-component {
      padding: var(--spacing-md);
    }

    .chart-header h2 {
      font-size: var(--text-lg);
    }

    .chart-header select {
      font-size: var(--text-sm);
      padding: var(--spacing-xs) var(--spacing-md);
      padding-right: var(--spacing-xl);
    }

    .chart-wrapper {
      padding: var(--spacing-sm);
      height: 300px;
    }

    .chart-wrapper canvas {
      top: var(--spacing-sm);
      left: var(--spacing-sm);
      right: var(--spacing-sm);
      bottom: var(--spacing-sm);
    }
  }
</style>
