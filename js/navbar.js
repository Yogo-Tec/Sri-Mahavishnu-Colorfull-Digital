"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const navMenu = document.querySelector("#siteNavigation");
  const toggler = document.querySelector(".nav-toggle");
  const themeToggle = document.querySelector(".theme-toggle");
  const clock = document.querySelector("#indiaClock");
  const meridiem = document.querySelector("#clockMeridiem");

  const setHeaderState = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  navMenu?.addEventListener("show.bs.collapse", () => toggler?.setAttribute("aria-expanded", "true"));
  navMenu?.addEventListener("hide.bs.collapse", () => toggler?.setAttribute("aria-expanded", "false"));

  navMenu?.querySelectorAll(".nav-link, .quote-button").forEach((link) => {
    link.addEventListener("click", () => {
      const collapse = bootstrap.Collapse.getInstance(navMenu);
      if (collapse && window.innerWidth < 1200) collapse.hide();
    });
  });

  const applyTheme = (mode) => {
    const dark = mode === "dark" || (mode === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.body.classList.toggle("dark-mode", dark);
    themeToggle?.setAttribute("aria-pressed", String(dark));
    themeToggle?.setAttribute("aria-label", dark ? "Use light colour mode" : "Use dark colour mode");
    themeToggle?.setAttribute("title", dark ? "Use light colour mode" : "Use dark colour mode");
    const icon = themeToggle?.querySelector("i");
    if (icon) icon.className = dark ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
  };

  let themeMode = localStorage.getItem("theme-mode") || "auto";
  applyTheme(themeMode);
  themeToggle?.addEventListener("click", () => {
    themeMode = document.body.classList.contains("dark-mode") ? "light" : "dark";
    localStorage.setItem("theme-mode", themeMode);
    applyTheme(themeMode);
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (themeMode === "auto") applyTheme("auto");
  });

  const renderIndiaClock = () => {
    if (!clock || !meridiem) return;
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const time = `${values.hour}${values.minute}${values.second}`;
    const previous = clock.dataset.value || "";
    clock.innerHTML = "";
    [...time].forEach((digit, index) => {
      const tile = document.createElement("span");
      tile.className = `clock-digit${previous[index] && previous[index] !== digit ? " is-changing" : ""}`;
      tile.textContent = digit;
      clock.append(tile);
      if (index === 1 || index === 3) {
        const separator = document.createElement("span");
        separator.className = "clock-separator";
        separator.textContent = ":";
        clock.append(separator);
      }
    });
    clock.dataset.value = time;
    meridiem.textContent = values.dayPeriod;
  };

  renderIndiaClock();
  setInterval(renderIndiaClock, 1000);
});
