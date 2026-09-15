"use strict";

/**
 * Sri Mahavishnu Colour Graphicz - Navbar & Header Controller
 * Handles header elevation/blur on scroll and mobile navigation collapse.
 */
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const navMenu = document.querySelector("#siteNavigation");
  const toggler = document.querySelector(".nav-toggle, .mobile-menu-btn");

  const setHeaderState = () => {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 10);
    }
  };

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  if (navMenu && toggler && window.bootstrap) {
    navMenu.addEventListener("show.bs.collapse", () => {
      toggler.setAttribute("aria-expanded", "true");
    });

    navMenu.addEventListener("hide.bs.collapse", () => {
      toggler.setAttribute("aria-expanded", "false");
    });

    navMenu.querySelectorAll(".nav-link, .quote-button").forEach((link) => {
      link.addEventListener("click", () => {
        const collapse = window.bootstrap.Collapse.getInstance(navMenu);
        if (collapse && window.innerWidth < 992) {
          collapse.hide();
        }
      });
    });
  }
});
