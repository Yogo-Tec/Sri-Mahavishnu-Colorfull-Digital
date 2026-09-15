"use strict";

/**
 * Sri Mahavishnu Colour Graphicz - Live IST Clock
 * Formats time in Asia/Kolkata timezone with flip digit animation and footer time string.
 */
(function initISTClock() {
  function renderClock() {
    const clock = document.getElementById("indiaClock");
    const meridiem = document.getElementById("clockMeridiem");
    const footerClock = document.getElementById("footerClockTime");

    if (!clock && !footerClock) return;

    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).formatToParts(now);

    const values = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const time = `${values.hour}${values.minute}${values.second}`;
    const formattedFull = `${values.hour}:${values.minute}:${values.second} ${values.dayPeriod.toUpperCase()}`;

    if (footerClock) {
      footerClock.textContent = formattedFull;
    }

    if (clock && meridiem) {
      const previous = clock.dataset.value || "";
      clock.innerHTML = "";
      [...time].forEach((digit, index) => {
        const tile = document.createElement("span");
        tile.className = `clock-digit${
          previous[index] && previous[index] !== digit ? " is-changing" : ""
        }`;
        tile.textContent = digit;
        clock.append(tile);
        if (index === 1 || index === 3) {
          const sep = document.createElement("span");
          sep.className = "clock-separator";
          sep.textContent = ":";
          clock.append(sep);
        }
      });
      clock.dataset.value = time;
      meridiem.textContent = values.dayPeriod;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      renderClock();
      setInterval(renderClock, 1000);
    });
  } else {
    renderClock();
    setInterval(renderClock, 1000);
  }
})();
