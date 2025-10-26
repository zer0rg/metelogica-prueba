<script lang="ts">
  import { fly, fade } from "svelte/transition";
  import { toastService } from "../services/toast.service.svelte";
  import { type ToastItem } from "../types/toast";

  // Estado del toast
  let toastList = $state<ToastItem[]>([]);

  // Se actualiza cuando el estado global de toastService cambia.
  $effect(() => {
    toastList = toastService.toasts;
  });
</script>

<div class="toast-container" aria-live="polite" aria-atomic="true">
  {#each toastList as t (t.id)}
    <div class="toast {t.status}" transition:fly={{ x: 20, duration: 220 }}>
      <div class="meta">
        {#if t.title}
          <div class="title">{t.title}</div>
        {/if}
        <div class="msg">{t.message}</div>
      </div>
      <div class="actions">
        <button
          class="close"
          aria-label="Cerrar"
          onclick={() => toastService.remove(t.id)}
          ><i class="fa-solid fa-xmark"></i></button
        >
      </div>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: var(--spacing-sm);
    right: var(--spacing-sm);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    z-index: 9999;
    width: 320px;
    pointer-events: none;
  }
  .toast {
    pointer-events: auto;
    background: var(--bg-card);
    color: var(--text-primary);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    display: flex;
    gap: var(--spacing-sm);
    align-items: flex-start;
  }
  .toast .meta {
    flex: 1;
  }
  .toast .actions {
    margin-left: auto;
  }
  .toast.ok {
    border-left: 4px solid #4ade80;
  }
  .toast.error {
    border-left: 4px solid #ef4444;
  }
  .toast.info {
    border-left: 4px solid #60a5fa;
  }
  .toast.warn {
    border-left: 4px solid #f59e0b;
  }
  .title {
    font-weight: var(--font-semibold);
    font-size: var(--text-base);
  }
  .msg {
    font-size: var(--text-sm);
    opacity: 0.9;
  }
  .close {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: var(--spacing-xs);
    transition: transform var(--transition);
  }
  .close:hover {
    transform: scale(1.1);
  }
  .close:active {
    transform: scale(0.9);
  }
</style>
