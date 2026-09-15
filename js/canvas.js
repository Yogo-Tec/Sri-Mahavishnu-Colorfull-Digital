"use strict";

/**
 * Sri Mahavishnu Colour Graphicz - Global Interactive Dot-Grid Canvas Background
 * High-performance 2D particle simulation with mouse proximity glow and click ripple shockwaves.
 */
(function initGlobalDotGridCanvas() {
  function startCanvas() {
    const canvas = document.getElementById("globalDotGridCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const DARK_PALETTE = ["#00aeef", "#ec008c", "#ffd400", "#A0ED32"];
    const LIGHT_PALETTE = ["#0089b8", "#c2007f", "#c99400", "#5f9d2d"];

    const GRID = 36;
    const CURSOR_RADIUS = 180;
    const RIPPLE_SPEED = 10;
    const RIPPLE_WIDTH = 30;

    let w, h;
    let dots = [];
    let ripples = [];
    let mouse = { x: -9999, y: -9999 };

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      buildDots();
    }

    function buildDots() {
      dots = [];
      const isDark = document.body.classList.contains("dark-mode");
      const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;

      for (let y = 30; y < h; y += GRID) {
        for (let x = 30; x < w; x += GRID) {
          dots.push({
            x,
            y,
            power: 0,
            colorIdx: Math.floor(Math.random() * palette.length),
          });
        }
      }
    }

    window.addEventListener(
      "mousemove",
      (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      },
      { passive: true }
    );

    window.addEventListener(
      "mouseleave",
      () => {
        mouse.x = -9999;
        mouse.y = -9999;
      },
      { passive: true }
    );

    window.addEventListener("click", (e) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        r: 0,
      });
    });

    function renderLoop() {
      ctx.clearRect(0, 0, w, h);

      const isDark = document.body.classList.contains("dark-mode");
      const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;

      ripples.forEach((r) => (r.r += RIPPLE_SPEED));
      ripples = ripples.filter((r) => r.r < Math.max(w, h) * 0.9);

      dots.forEach((dot) => {
        let glow = 0;

        const cd = Math.hypot(dot.x - mouse.x, dot.y - mouse.y);
        if (cd < CURSOR_RADIUS) {
          glow = Math.max(glow, 1 - cd / CURSOR_RADIUS);
        }

        ripples.forEach((r) => {
          const d = Math.hypot(dot.x - r.x, dot.y - r.y);
          const ring = Math.abs(d - r.r);
          if (ring < RIPPLE_WIDTH) {
            glow = Math.max(glow, 1 - ring / RIPPLE_WIDTH);
          }
        });

        dot.power += (glow - dot.power) * 0.15;

        const dotColor = palette[dot.colorIdx % palette.length];

        ctx.beginPath();
        ctx.fillStyle = dotColor;
        ctx.shadowColor = dotColor;
        ctx.shadowBlur = dot.power * 25;

        if (isDark) {
          ctx.globalAlpha = 0.12 + dot.power * 0.85;
        } else {
          ctx.globalAlpha = 0.15 + dot.power * 0.75;
        }

        ctx.arc(dot.x, dot.y, 1.2 + dot.power * 3.4, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      requestAnimationFrame(renderLoop);
    }

    window.addEventListener("resize", resize);
    resize();
    renderLoop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startCanvas);
  } else {
    startCanvas();
  }
})();
