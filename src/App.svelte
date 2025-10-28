<script lang="ts">
  import Header from "./components/Header.svelte";
  import { onMount } from "svelte";
  import type { DataForRender, Measurements } from "./types/chart";
  import Chart from "./components/Chart.svelte";
  import Toast from "./components/Toast.svelte";
  import { DataService } from "./services/data.service.svelte";
  import {
    currentSecondsOfDay,
    getHour,
    timeToSeconds,
  } from "./utils/time.utils";
  import { CLOCK_INTERVAL_MS, DATA_REFRESH_INTERVAL_MS } from "./consts";
  import { toastService } from "./services/toast.service.svelte";

  // Estado principal de la app
  let measurements: DataForRender | null = $state<DataForRender | null>(null);
  let loading: boolean = $state(true);
  let loadingMsg: string = $state("Cargando datos...");
  let actualTime: string = $state("");
  let actualTemperature: number = $state(0);
  let actualPower: number = $state(0);
  let actualEnergy: number = $state(0);
  let dataInterval: number = $state(5);
  let lastRefresh: number = $state(Date.now());
  let lastRefreshStr: string | null = $state(null);

  // Variables para guardar los intervalos y liberarlos en el destroy del componente
  let clockInterval: ReturnType<typeof window.setInterval> | undefined;
  let countdownInterval: ReturnType<typeof window.setInterval> | undefined;
  let refreshInterval: ReturnType<typeof window.setInterval> | undefined;

  /**
   * onMount() Montaje del componente
   *
   * Se llama a una funcion ejecutada inmediatamente para usar asincronia y poder
   * hacer limpia del componente cuando se destruya.
   *
   * Llama a la carga y al proceso de los datos e inicializa el estado de measurements con
   * los datos ya prcoesados e inicia los intervalos tantos del reloj, countdown y refresco
   */
  onMount(() => {
    (async () => {
      try {
        let data: Measurements = await DataService.loadAndProcessYMLData();

        measurements = refreshData(data);
        actualTime = getHour();

        clockInterval = setInterval(() => {
          actualTime = getHour();
        }, CLOCK_INTERVAL_MS);

        countdownInterval = setInterval(() => {
          const elapsed = (Date.now() - lastRefresh) / 1000;
          dataInterval = 5 - Math.floor(elapsed % 5);
        }, CLOCK_INTERVAL_MS);

        refreshInterval = setInterval(() => {
          measurements = refreshData(data);
        }, DATA_REFRESH_INTERVAL_MS);

        toastService.show("Datos cargados correctamente", {
          title: "Exito",
          status: "ok",
        });

        loading = false;
      } catch (error: any) {
        loading = false;
        toastService.show("Error al cargas los datos", {
          title: "ERROR",
          status: "error",
        });
      }
    })();

    return () => {
      clearInterval(refreshInterval);
      clearInterval(clockInterval);
      clearInterval(countdownInterval);
    };
  });

  /*
   * refreshData();
   * Filtra todos los datos para obtener desde el principio del dìa
   * hasta el momento actual donde se ejecuta la función y actualiza
   * el estado de los datos
   */
  function refreshData(data: Measurements): DataForRender {
    lastRefresh = Date.now();
    const nowSeconds = currentSecondsOfDay();

    const powerFilter = data!.power.values.filter(
      (entry) => timeToSeconds(entry.time) <= nowSeconds
    );
    actualPower = Number(powerFilter.at(-1)?.value.toPrecision(7)) || 0;

    const temperatureFilter = data!.temperature.values.filter(
      (entry) => timeToSeconds(entry.time) <= nowSeconds
    );
    const temperatureSum = temperatureFilter.reduce(
      (sum, entry) => sum + entry.value,
      0
    );
	// Calculo de temperatura media
    actualTemperature =
      temperatureFilter.length > 0
        ? Number((temperatureSum / temperatureFilter.length).toFixed(2))
        : 0;

    const energyFilter = data!.accumulatedEnergy!.filter(
      (entry) => timeToSeconds(entry.time) <= nowSeconds
    );
    actualEnergy = Number(energyFilter.at(-1)?.value.toPrecision(7));

    // Crear un mapa de temperatura por timestamp para búsqueda rápida
    const tempMap = new Map<string, number>();
    temperatureFilter.forEach((dataPoint) => {
      tempMap.set(dataPoint.time, dataPoint.value);
    });

    // Usar power como referencia principal porque tiene todos los time.
    let timeLabels: string[] = [];
    let temperatureData: number[] = [];
    let powerData: number[] = [];
    let energyData: number[] = [];

    powerFilter.forEach((dataPoint) => {
      timeLabels.push(dataPoint.time);
      powerData.push(dataPoint.value);
      // Si existe temperatura para este timestamp, usarla
      if (tempMap.has(dataPoint.time)) {
        const temp = tempMap.get(dataPoint.time)!;
        temperatureData.push(temp);
      } else {
        // Si no existe,NaN.
        temperatureData.push(NaN);
      }
    });

    energyFilter.forEach((dataPoint) => {
      energyData.push(dataPoint.value);
    });

    lastRefreshStr = getHour();
    return {
      temperature: temperatureData,
      power: powerData,
      timeLabels,
      energy: energyData,
    };
  }
</script>

<Toast />
<Header />
<main>
  {#if loading}
    <div class="loader-wrapper">
      <div class="loader"></div>
      <p>{loadingMsg}</p>
    </div>
  {/if}
  {#if !loading}
    <div class="actual-info">
      <div class="info-card">
        <div class="info-card-title">
          <div class="icon-wrapper">
            <i class="fa-solid fa-temperature-half"></i>
          </div>
          <h3>Temperatura media</h3>
        </div>
        <span>{actualTemperature} ºC</span>
      </div>
      <div class="info-card">
        <div class="info-card-title">
          <div class="icon-wrapper">
            <i class="fa-solid fa-plug"></i>
          </div>
          <h3>Potencia Inmediata</h3>
        </div>
        <span>{actualPower} KW</span>
      </div>
      <div class="info-card">
        <div class="info-card-title">
          <div class="icon-wrapper">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <h3>Energía (Última hora)</h3>
        </div>
        <span>{actualEnergy} Kw/H</span>
      </div>
      <div class="info-card">
        <div class="info-card-title">
          <div class="icon-wrapper">
            <i class="fa-solid fa-clock"></i>
          </div>
          <h3>Hora actual</h3>
        </div>
        <span>{actualTime}</span>
      </div>
    </div>
    <Chart {measurements} />
    <div class="update-info">
      <p>Actualización en {dataInterval}s</p>
      <p>Ultima actualización: {lastRefreshStr}</p>
    </div>
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    padding: var(--spacing-md);
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  .actual-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
    gap: var(--spacing-lg);
    width: 100%;
    animation: fadeIn 0.6s;
  }

  .info-card {
    background: var(--bg-card);
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    transition:
      transform var(--transition),
      box-shadow var(--transition);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    position: relative;
    overflow: hidden;
  }

  .info-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--color-primary);
    opacity: 0;
    transition: opacity var(--transition);
  }

  .info-card:hover {
    transform: translateY(-4px);
  }

  .info-card:hover::before {
    opacity: 1;
  }

  .icon-wrapper {
    width: 35px;
    height: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--bg-elevated);
    border-radius: var(--radius-lg);
  }

  .info-card-title {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
  }

  .info-card h3 {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-secondary);
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .info-card span {
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    font-family: var(--font-mono);
    letter-spacing: -0.02em;
  }

  .loader-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: var(--spacing-2xl);
    gap: var(--spacing-sm);
  }

  .loader {
    width: 50px;
    padding: var(--spacing-xs);
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--color-primary);
    --_m: conic-gradient(#0000 10%, #000), linear-gradient(#000 0 0) content-box;
    -webkit-mask: var(--_m);
    mask: var(--_m);
    -webkit-mask-composite: source-out;
    mask-composite: subtract;
    animation: l3 1s infinite linear;
  }

  .update-info {
    display: flex;
    justify-content: space-between;
  }
  @keyframes l3 {
    to {
      transform: rotate(1turn);
    }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    main {
      padding: var(--spacing-sm);
      gap: var(--spacing-lg);
    }

    .actual-info {
      gap: var(--spacing-md);
    }

    .info-card {
      padding: var(--spacing-md);
    }

    .info-card h3 {
      font-size: var(--text-base);
    }

    .info-card span {
      font-size: var(--text-xl);
    }
  }

  @media (max-width: 480px) {
    main {
      padding: var(--spacing-xs);
    }

    .info-card {
      padding: var(--spacing-sm);
    }

    .info-card h3 {
      font-size: var(--text-sm);
    }

    .info-card span {
      font-size: var(--text-lg);
    }

    .icon-wrapper {
      width: 30px;
      height: 30px;
    }
  }

  @media (min-width: 1200px) {
    .actual-info {
      grid-template-columns: repeat(4, 1fr);
    }
  }
</style>
