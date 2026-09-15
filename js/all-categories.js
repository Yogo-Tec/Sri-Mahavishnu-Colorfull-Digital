"use strict";

/**
 * Sri Mahavishnu Colour Graphicz - All Categories Catalogue Controller
 * Features:
 * - 3-Slide Auto Hero Banner Slider with pause on hover & dot indicators
 * - Multi-criteria filter engine (Search, Category, Product Type, Classification, Media, GSM, Printing Side, Finishing)
 * - Reset All Filters functionality
 * - Gallery View (1:1 Square) vs List View (2-Column Large Ratio)
 * - Quick-view Specs Modal
 * - Mobile Filter Bottom Sheet (popup modal with Apply/Reset)
 * - Navbar Cart Badge sync
 */

document.addEventListener("DOMContentLoaded", () => {
  const catalogueContainer = document.getElementById("catalogueContainer");
  const filterButtons = document.querySelectorAll(".filter-tab-btn");
  const mobileCategorySelect = document.getElementById("mobileCategorySelect");
  const productCards = document.querySelectorAll(".all-cat-card");
  const productCount = document.getElementById("productCount");
  const activeCategoryName = document.getElementById("activeCategoryName");
  const viewGalleryBtn = document.getElementById("viewGalleryBtn");
  const viewListBtn = document.getElementById("viewListBtn");

  // Sidebar Filter Elements (desktop)
  const filterSearchInput = document.getElementById("filterSearchInput");
  const filterProductType = document.getElementById("filterProductType");
  const filterClassification = document.getElementById("filterClassification");
  const filterMedia = document.getElementById("filterMedia");
  const filterGsm = document.getElementById("filterGsm");
  const filterSide = document.getElementById("filterSide");
  const filterFinishing = document.getElementById("filterFinishing");
  const btnResetFilters = document.getElementById("btnResetFilters");

  // Mobile Filter Sheet Elements
  const mobileFilterTrigger = document.getElementById("mobileFilterTriggerBtn");
  const mobileFilterOverlay = document.getElementById("mobileFilterOverlay");
  const mobileFilterCloseBtn = document.getElementById("mobileFilterCloseBtn");
  const mfsApplyBtn = document.getElementById("mfsApplyBtn");
  const mfsResetBtn = document.getElementById("mfsResetBtn");
  const mobileActiveFilterCount = document.getElementById("mobileActiveFilterCount");

  // Mobile Filter Sheet Inputs
  const mfsSearchInput = document.getElementById("mfsSearchInput");
  const mfsProductType = document.getElementById("mfsProductType");
  const mfsClassification = document.getElementById("mfsClassification");
  const mfsMedia = document.getElementById("mfsMedia");
  const mfsGsm = document.getElementById("mfsGsm");
  const mfsFinishing = document.getElementById("mfsFinishing");

  let currentCategory = "all";

  const categoryLabels = {
    all: "All Categories",
    bestseller: "Bestsellers",
    packaging: "Packaging Boxes & Cartons",
    stickers: "Stickers & Labels",
    business: "Business Cards & Publishing",
    signage: "Signage & Displays"
  };

  // 1. Hero Banner Auto Slider
  const heroSlider = document.getElementById("heroBannerSlider");
  if (heroSlider) {
    const slides = heroSlider.querySelectorAll(".banner-slide");
    const dots = heroSlider.querySelectorAll(".slider-dot");
    const prevBtn = document.getElementById("sliderPrevBtn");
    const nextBtn = document.getElementById("sliderNextBtn");
    let currentSlide = 0;
    let slideTimer = null;

    const goToSlide = (index) => {
      slides[currentSlide]?.classList.remove("active");
      dots[currentSlide]?.classList.remove("active");
      currentSlide = (index + slides.length) % slides.length;
      slides[currentSlide]?.classList.add("active");
      dots[currentSlide]?.classList.add("active");
    };

    const startTimer = () => {
      stopTimer();
      slideTimer = setInterval(() => goToSlide(currentSlide + 1), 4500);
    };
    const stopTimer = () => { if (slideTimer) { clearInterval(slideTimer); slideTimer = null; } };

    if (prevBtn) prevBtn.addEventListener("click", () => { goToSlide(currentSlide - 1); startTimer(); });
    if (nextBtn) nextBtn.addEventListener("click", () => { goToSlide(currentSlide + 1); startTimer(); });
    dots.forEach((dot) => dot.addEventListener("click", () => { goToSlide(parseInt(dot.getAttribute("data-slide"), 10) || 0); startTimer(); }));
    heroSlider.addEventListener("mouseenter", stopTimer);
    heroSlider.addEventListener("mouseleave", startTimer);
    startTimer();
  }

  // 2. Multi-Filter Engine
  const applyAllFilters = () => {
    const searchTerm = (filterSearchInput?.value || "").toLowerCase().trim();
    const selectedType = filterProductType?.value || "all";
    const selectedClass = filterClassification?.value || "all";
    const selectedMedia = filterMedia?.value || "all";
    const selectedGsm = filterGsm?.value || "all";
    const selectedSide = filterSide?.value || "all";
    const selectedFinishing = filterFinishing?.value || "all";
    let visibleCount = 0;

    productCards.forEach((card) => {
      const cardCategories = (card.getAttribute("data-category") || "").split(" ");
      const cardType = card.getAttribute("data-type") || "";
      const cardClass = card.getAttribute("data-class") || "";
      const cardMedia = card.getAttribute("data-media") || "";
      const cardGsm = card.getAttribute("data-gsm") || "";
      const cardSide = card.getAttribute("data-side") || "";
      const cardFinishing = card.getAttribute("data-finishing") || "";
      const cardTitle = (card.getAttribute("data-title") || "").toLowerCase();
      const cardDesc = (card.getAttribute("data-desc") || "").toLowerCase();
      const cardMaterial = (card.getAttribute("data-material") || "").toLowerCase();

      const matchesCategory = currentCategory === "all" || cardCategories.includes(currentCategory);
      const matchesSearch = !searchTerm || cardTitle.includes(searchTerm) || cardDesc.includes(searchTerm) || cardMaterial.includes(searchTerm);
      const matchesType = selectedType === "all" || cardType === selectedType;
      const matchesClass = selectedClass === "all" || cardClass.includes(selectedClass);
      const matchesMedia = selectedMedia === "all" || cardMedia === selectedMedia;
      const matchesGsm = selectedGsm === "all" || cardGsm === selectedGsm;
      const matchesSide = selectedSide === "all" || cardSide === selectedSide;
      const matchesFinishing = selectedFinishing === "all" || cardFinishing.includes(selectedFinishing);

      const isMatch = matchesCategory && matchesSearch && matchesType && matchesClass && matchesMedia && matchesGsm && matchesSide && matchesFinishing;

      if (isMatch) {
        card.classList.remove("is-hidden");
        card.classList.remove("animate-in");
        void card.offsetWidth;
        card.classList.add("animate-in");
        visibleCount++;
      } else {
        card.classList.add("is-hidden");
        card.classList.remove("animate-in");
      }
    });

    if (productCount) productCount.textContent = visibleCount;
    if (activeCategoryName) activeCategoryName.textContent = categoryLabels[currentCategory] || "Filtered Results";
    updateActiveFilterCount();
  };

  const countActiveFilters = () => {
    let count = 0;
    if ((filterSearchInput?.value || "").trim()) count++;
    if (filterProductType?.value !== "all") count++;
    if (filterClassification?.value !== "all") count++;
    if (filterMedia?.value !== "all") count++;
    if (filterGsm?.value !== "all") count++;
    if (filterSide?.value !== "all") count++;
    if (filterFinishing?.value !== "all") count++;
    if (currentCategory !== "all") count++;
    return count;
  };

  const updateActiveFilterCount = () => {
    const count = countActiveFilters();
    if (mobileActiveFilterCount) {
      mobileActiveFilterCount.textContent = count;
      mobileActiveFilterCount.classList.toggle("visible", count > 0);
    }
  };

  // 3. Category Tabs
  const setCategory = (targetCategory, updateHistory = true) => {
    currentCategory = targetCategory || "all";
    filterButtons.forEach((btn) => {
      const isActive = btn.getAttribute("data-filter") === currentCategory;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    if (mobileCategorySelect && mobileCategorySelect.value !== currentCategory) mobileCategorySelect.value = currentCategory;
    applyAllFilters();
    if (updateHistory) {
      const newUrl = currentCategory === "all" ? "all-categories.html" : `all-categories.html?category=${encodeURIComponent(currentCategory)}`;
      window.history.pushState({ category: currentCategory }, "", newUrl);
    }
  };

  filterButtons.forEach((btn) => btn.addEventListener("click", () => setCategory(btn.getAttribute("data-filter") || "all", true)));
  if (mobileCategorySelect) mobileCategorySelect.addEventListener("change", (e) => setCategory(e.target.value || "all", true));

  // 4. Sidebar Filter Listeners
  const sidebarSelects = [filterProductType, filterClassification, filterMedia, filterGsm, filterSide, filterFinishing];
  sidebarSelects.forEach((select) => { if (select) select.addEventListener("change", applyAllFilters); });
  if (filterSearchInput) filterSearchInput.addEventListener("input", applyAllFilters);

  const resetAllSidebarFilters = () => {
    if (filterSearchInput) filterSearchInput.value = "";
    sidebarSelects.forEach((sel) => { if (sel) sel.value = "all"; });
    if (mfsSearchInput) mfsSearchInput.value = "";
    if (mfsProductType) mfsProductType.value = "all";
    if (mfsClassification) mfsClassification.value = "all";
    if (mfsMedia) mfsMedia.value = "all";
    if (mfsGsm) mfsGsm.value = "all";
    if (mfsFinishing) mfsFinishing.value = "all";
    setCategory("all", true);
  };

  if (btnResetFilters) btnResetFilters.addEventListener("click", resetAllSidebarFilters);

  // 5. Mobile Filter Bottom Sheet
  const openMobileFilter = () => {
    if (!mobileFilterOverlay) return;
    if (mfsSearchInput && filterSearchInput) mfsSearchInput.value = filterSearchInput.value;
    if (mfsProductType && filterProductType) mfsProductType.value = filterProductType.value;
    if (mfsClassification && filterClassification) mfsClassification.value = filterClassification.value;
    if (mfsMedia && filterMedia) mfsMedia.value = filterMedia.value;
    if (mfsGsm && filterGsm) mfsGsm.value = filterGsm.value;
    if (mfsFinishing && filterFinishing) mfsFinishing.value = filterFinishing.value;
    mobileFilterOverlay.style.display = "block";
    requestAnimationFrame(() => mobileFilterOverlay.classList.add("open"));
    document.body.style.overflow = "hidden";
  };

  const closeMobileFilter = () => {
    if (!mobileFilterOverlay) return;
    mobileFilterOverlay.classList.remove("open");
    setTimeout(() => { mobileFilterOverlay.style.display = "none"; }, 340);
    document.body.style.overflow = "";
  };

  const applyMobileFilters = () => {
    if (filterSearchInput && mfsSearchInput) filterSearchInput.value = mfsSearchInput.value;
    if (filterProductType && mfsProductType) filterProductType.value = mfsProductType.value;
    if (filterClassification && mfsClassification) filterClassification.value = mfsClassification.value;
    if (filterMedia && mfsMedia) filterMedia.value = mfsMedia.value;
    if (filterGsm && mfsGsm) filterGsm.value = mfsGsm.value;
    if (filterFinishing && mfsFinishing) filterFinishing.value = mfsFinishing.value;
    applyAllFilters();
    closeMobileFilter();
  };

  const resetMobileFilters = () => {
    resetAllSidebarFilters();
    closeMobileFilter();
  };

  if (mobileFilterTrigger) mobileFilterTrigger.addEventListener("click", openMobileFilter);
  if (mobileFilterCloseBtn) mobileFilterCloseBtn.addEventListener("click", closeMobileFilter);
  if (mobileFilterOverlay) mobileFilterOverlay.addEventListener("click", (e) => { if (e.target === mobileFilterOverlay) closeMobileFilter(); });
  if (mfsApplyBtn) mfsApplyBtn.addEventListener("click", applyMobileFilters);
  if (mfsResetBtn) mfsResetBtn.addEventListener("click", resetMobileFilters);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && mobileFilterOverlay?.classList.contains("open")) closeMobileFilter(); });

  // 6. URL parameter on load
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get("category") || "all";
  setCategory(initialCategory, false);
  window.addEventListener("popstate", (e) => {
    const cat = (e.state && e.state.category) || new URLSearchParams(window.location.search).get("category") || "all";
    setCategory(cat, false);
  });

  // 7. View Mode Toggle
  const setViewMode = (mode) => {
    if (!catalogueContainer) return;
    if (mode === "list") {
      catalogueContainer.classList.remove("view-gallery");
      catalogueContainer.classList.add("view-list");
      if (viewListBtn) viewListBtn.classList.add("active");
      if (viewGalleryBtn) viewGalleryBtn.classList.remove("active");
    } else {
      catalogueContainer.classList.remove("view-list");
      catalogueContainer.classList.add("view-gallery");
      if (viewGalleryBtn) viewGalleryBtn.classList.add("active");
      if (viewListBtn) viewListBtn.classList.remove("active");
    }
    localStorage.setItem("smcg_view_mode", mode);
  };

  if (viewGalleryBtn) viewGalleryBtn.addEventListener("click", () => setViewMode("gallery"));
  if (viewListBtn) viewListBtn.addEventListener("click", () => setViewMode("list"));
  setViewMode(localStorage.getItem("smcg_view_mode") || "gallery");

  // 8. Spec Pills
  document.querySelectorAll(".spec-pill").forEach((pill) => {
    pill.addEventListener("click", (e) => {
      const parent = pill.closest(".spec-pills-wrap");
      if (parent) {
        parent.querySelectorAll(".spec-pill").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
      }
    });
  });

  // 9. Quick View Modal
  const productModal = document.getElementById("productDetailModal");
  if (productModal) {
    const modalTitle = document.getElementById("modalProductTitle");
    const modalImg = document.getElementById("modalProductImg");
    const modalBadge = document.getElementById("modalProductBadge");
    const modalDesc = document.getElementById("modalProductDesc");
    const modalMoq = document.getElementById("modalProductMoq");
    const modalMaterial = document.getElementById("modalProductMaterial");
    const modalFinishing2 = document.getElementById("modalProductFinishing");
    const modalTurnaround = document.getElementById("modalProductTurnaround");
    const modalQuoteBtn = document.getElementById("modalProductQuoteBtn");

    productModal.addEventListener("show.bs.modal", (event) => {
      const button = event.relatedTarget;
      if (!button) return;
      const card = button.closest(".all-cat-card");
      if (!card) return;

      const title = card.getAttribute("data-title") || "";
      const img = card.getAttribute("data-img") || "";
      const badge = card.getAttribute("data-badge") || "";
      const desc = card.getAttribute("data-desc") || "";
      const moq = card.getAttribute("data-moq") || "500 pcs";
      const material = card.getAttribute("data-material") || "Custom specified";
      const finishing = card.getAttribute("data-finishing-text") || "Spot UV, Foiling, Lamination";
      const turnaround = card.getAttribute("data-turnaround") || "3 - 5 Business Days";
      const price = card.getAttribute("data-price-val") || "0";
      const id = card.querySelector(".btn-add-to-cart")?.getAttribute("data-id") || `PROD-${Date.now()}`;

      if (modalTitle) modalTitle.textContent = title;
      if (modalImg) { modalImg.src = img; modalImg.alt = title; }
      if (modalBadge) {
        if (badge) { modalBadge.textContent = badge; modalBadge.style.display = "inline-block"; }
        else { modalBadge.style.display = "none"; }
      }
      if (modalDesc) modalDesc.textContent = desc;
      if (modalMoq) modalMoq.textContent = moq;
      if (modalMaterial) modalMaterial.textContent = material;
      if (modalFinishing2) modalFinishing2.textContent = finishing;
      if (modalTurnaround) modalTurnaround.textContent = turnaround;

      if (modalQuoteBtn) {
        modalQuoteBtn.innerHTML = `<i class="bi bi-cart-plus-fill"></i> Add to Cart`;
        modalQuoteBtn.setAttribute("data-id", id);
        modalQuoteBtn.setAttribute("data-title", title);
        modalQuoteBtn.setAttribute("data-price", price);
        modalQuoteBtn.setAttribute("data-img", img);
        modalQuoteBtn.setAttribute("data-moq", moq);
        modalQuoteBtn.classList.add("btn-add-to-cart");
      }
    });
  }

  // 10. Navbar Cart Badge Sync
  const syncNavCartBadge = () => {
    const navBadge = document.getElementById("navCartBadge");
    if (!navBadge) return;
    try {
      const cartData = localStorage.getItem("smcg_cart_items_v2");
      const items = cartData ? JSON.parse(cartData) : [];
      const count = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      navBadge.textContent = count;
      navBadge.classList.toggle("has-items", count > 0);
    } catch (e) {
      navBadge.classList.remove("has-items");
    }
  };

  syncNavCartBadge();
  window.addEventListener("storage", syncNavCartBadge);
  document.addEventListener("click", (e) => {
    if (e.target.closest(".btn-add-to-cart, [data-action='add-cart'], .cart-qty-btn, .cart-remove-btn")) {
      setTimeout(syncNavCartBadge, 100);
      setTimeout(syncNavCartBadge, 500);
    }
  });
});
