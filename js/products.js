"use strict";

/**
 * Sri Mahavishnu Colour Graphicz - Products Controller
 * Manages category tab filtering and product detail modal population.
 */
document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = document.querySelectorAll(".filter-tab-btn");
  const productCards = document.querySelectorAll(".product-card");
  const mobileCategorySelect = document.getElementById("mobileCategorySelect");

  // Core Category Filtering Function
  const filterProducts = (targetCategory) => {
    // 1. Sync Desktop Grid Buttons
    filterButtons.forEach((b) => {
      const btnFilter = b.getAttribute("data-filter");
      const isActive = btnFilter === targetCategory;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    // 2. Sync Mobile Dropdown Select
    if (mobileCategorySelect && mobileCategorySelect.value !== targetCategory) {
      mobileCategorySelect.value = targetCategory;
    }

    // 3. Filter Cards with Smooth Stagger
    productCards.forEach((card) => {
      const cardCategories = (card.getAttribute("data-category") || "").split(" ");
      const shouldShow = targetCategory === "all" || cardCategories.includes(targetCategory);

      if (shouldShow) {
        card.classList.remove("is-hidden");
        card.classList.remove("animate-in");
        void card.offsetWidth; // Force reflow to replay CSS animation
        card.classList.add("animate-in");
      } else {
        card.classList.add("is-hidden");
        card.classList.remove("animate-in");
      }
    });
  };

  // 1. Desktop & Tablet Buttons Click Listener: Redirects to All Categories page with filter
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetCategory = btn.getAttribute("data-filter") || "all";
      window.location.href = `all-categories.html?category=${encodeURIComponent(targetCategory)}`;
    });
  });

  // 2. Mobile Dropdown Change Listener: Redirects to All Categories page with filter
  if (mobileCategorySelect) {
    mobileCategorySelect.addEventListener("change", (e) => {
      const targetCategory = e.target.value || "all";
      window.location.href = `all-categories.html?category=${encodeURIComponent(targetCategory)}`;
    });
  }

  // 2. Product Detail Quick-View Modal Population
  const productModal = document.getElementById("productDetailModal");
  if (productModal) {
    const modalTitle = document.getElementById("modalProductTitle");
    const modalImg = document.getElementById("modalProductImg");
    const modalBadge = document.getElementById("modalProductBadge");
    const modalDesc = document.getElementById("modalProductDesc");
    const modalMoq = document.getElementById("modalProductMoq");
    const modalMaterial = document.getElementById("modalProductMaterial");
    const modalFinishing = document.getElementById("modalProductFinishing");
    const modalTurnaround = document.getElementById("modalProductTurnaround");
    const modalQuoteLink = document.getElementById("modalProductQuoteBtn");

    productModal.addEventListener("show.bs.modal", (event) => {
      const button = event.relatedTarget;
      if (!button) return;

      const card = button.closest(".product-card");
      if (!card) return;

      const title = card.getAttribute("data-title") || "";
      const img = card.getAttribute("data-img") || "";
      const badge = card.getAttribute("data-badge") || "";
      const desc = card.getAttribute("data-desc") || "";
      const moq = card.getAttribute("data-moq") || "500 pcs";
      const material = card.getAttribute("data-material") || "Custom specified";
      const finishing = card.getAttribute("data-finishing") || "Spot UV, Foiling, Lamination";
      const turnaround = card.getAttribute("data-turnaround") || "3 - 5 Business Days";

      if (modalTitle) modalTitle.textContent = title;
      if (modalImg) {
        modalImg.src = img;
        modalImg.alt = title;
      }
      if (modalBadge) {
        if (badge) {
          modalBadge.textContent = badge;
          modalBadge.style.display = "inline-block";
        } else {
          modalBadge.style.display = "none";
        }
      }
      if (modalDesc) modalDesc.textContent = desc;
      if (modalMoq) modalMoq.textContent = moq;
      if (modalMaterial) modalMaterial.textContent = material;
      if (modalFinishing) modalFinishing.textContent = finishing;
      if (modalTurnaround) modalTurnaround.textContent = turnaround;
      if (modalQuoteLink) {
        modalQuoteLink.href = `quotation.html?product=${encodeURIComponent(title)}`;
      }
    });
  }
});
