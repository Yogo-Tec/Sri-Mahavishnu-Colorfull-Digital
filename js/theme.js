"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const themeBtn = document.querySelector(".theme-switcher-btn, #themeToggleBtn");

  const applyTheme = (isDark) => {
    document.body.classList.toggle("dark-mode", isDark);
    if (themeBtn) {
      const icon = themeBtn.querySelector("i");
      if (icon) icon.className = isDark ? "bi bi-sun-fill text-orange" : "bi bi-moon-stars-fill";
    }
  };

  const savedTheme = localStorage.getItem("theme-mode");
  if (savedTheme) {
    applyTheme(savedTheme === "dark");
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const isCurrentlyDark = document.body.classList.contains("dark-mode");
      const newDark = !isCurrentlyDark;
      applyTheme(newDark);
      localStorage.setItem("theme-mode", newDark ? "dark" : "light");
    });
  }
});
