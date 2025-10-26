import { writable } from "svelte/store";
import { MAX_TOASTS, TOAST_TIMEOUT } from "../consts";
import type { ToastItem,  ToastOptions } from "../types/toast";

/*
 * ToastService
 * Servicio para manejar el estado global de Toast.
 */
class ToastService  {
  toasts = $state<ToastItem[]>([]);

  /**
   * show(message: string, options: {title!, status!} ToastOptions)
   * Muestra una notificacion
   * Devuelve el ID del toast
   */
  show(message: string, options: ToastOptions) {
    const toast: ToastItem = {
      id: this.uid(),
      title: options.title,
      message,
      status: options.status,
    };

    this.toasts = [toast, ...this.toasts].slice(0, MAX_TOASTS);

    setTimeout(() => this.remove(toast.id), options?.timeout || TOAST_TIMEOUT);

    return toast.id;
  }

  /*
   * remove(id: string)
   * Elimina un toast
   */
  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  /*
   * clearAll()
   * Limpia todos los toast
   */
  clearAll() {
    this.toasts = [];
  }

  /*
   * uid()
   * Devuelve un ID random
   */
  private uid(): string {
    return Math.random().toString(36).slice(2, 9);
  }
}

export const toastService = new ToastService();
