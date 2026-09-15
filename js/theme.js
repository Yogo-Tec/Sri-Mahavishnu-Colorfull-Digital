"use strict";

/**
 * Sri Mahavishnu Colour Graphicz - Global Theme Management
 * Manages Dark Mode / Light Mode with localStorage persistence and system preference sync.
 */
(function initTheme() {
  const applyTheme = (mode) => {
    const isDark =
      mode === "dark" ||
      (mode === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.body.classList.toggle("dark-mode", isDark);

    const themeToggleBtns = document.querySelectorAll(
      ".theme-toggle, #themeToggleBtn, .theme-switcher-btn"
    );
    themeToggleBtns.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );
      btn.setAttribute(
        "title",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );
      const icon = btn.querySelector("i");
      if (icon) {
        icon.className = isDark ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
      }
    });
  };

  const getSavedTheme = () => localStorage.getItem("theme-mode") || "auto";

  // Apply immediately on DOMContentLoaded or script execution
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      applyTheme(getSavedTheme());
    });
  } else {
    applyTheme(getSavedTheme());
  }

  // Bind click handlers to all theme toggle buttons
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(
      ".theme-toggle, #themeToggleBtn, .theme-switcher-btn"
    );
    if (!btn) return;

    const isCurrentlyDark = document.body.classList.contains("dark-mode");
    const newTheme = isCurrentlyDark ? "light" : "dark";
    localStorage.setItem("theme-mode", newTheme);
    applyTheme(newTheme);
  });

  // Listen to OS system color scheme changes if set to auto
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (getSavedTheme() === "auto") {
        applyTheme("auto");
      }
    });
})();
