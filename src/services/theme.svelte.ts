type Theme = "light" | "dark";

class ThemeService {
  theme = $state<Theme>("dark");

  constructor() {
    // Inicializar tema al crear el servicio
    this.initialize();
  }

  /**
   * initialize()
   * Carga el tema guardado o detecta la preferencia del sistema
   */
  private initialize() {
    const savedTheme = localStorage.getItem("theme") as Theme | null;

    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      this.setTheme(prefersDark ? "dark" : "light");
    }
  }

  /**
   * setTheme(theme: Theme)
   * Aplica el tema al documento y lo guarda en localStorage
   */
  private setTheme(theme: Theme) {
    this.theme = theme;

    if (theme === "dark") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }

    localStorage.setItem("theme", theme);
  }

  /**
   * toggleTheme()
   * Alterna entre tema claro y oscuro
   */
  toggleTheme() {
    this.setTheme(this.theme === "dark" ? "light" : "dark");
  }

}

export const themeService = new ThemeService();
