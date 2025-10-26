// Objeto toast
export type ToastItem = {
  id: string;
  title?: string;
  message: string;
  status: ToastStatus;
};

// Tipos de estado del toast
export type ToastStatus = "ok" | "error" | "info" | "warn";

// Opciones necesarias para mostrar un toast
export type ToastOptions = {
  title: string;
  status: ToastStatus;
  timeout?: number;
};

