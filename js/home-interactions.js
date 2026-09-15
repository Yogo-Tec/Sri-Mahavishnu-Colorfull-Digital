"use strict";

/**
 * Sri Mahavishnu Colour Graphicz - Homepage Interactive Systems
 * 1. Interactive 3D Card Deck (Hero Section)
 * 2. Sticky Scroll-Stack Showcase with Eye View Follower Cursor
 * 3. Services Row Mouse-Following Floating Thumbnail Preview
 * 4. Pinned Horizontal Scroll Process System (7-Stage Timeline)
 */
document.addEventListener("DOMContentLoaded", () => {
  // ─── 1. INTERACTIVE 3-SECTION BIG CARD DECK SYSTEM ──────────────────────
  (function initHeroCardDeck() {
    const HERO_IMAGE_PATH = "assets/images/hero cards/UI- Card.png";

    const SECTIONS = [
      {
        id: 1,
        cards: [
          { bg: "linear-gradient(145deg, #f4264d, #861f89)" },
          { bg: "linear-gradient(145deg, #ffca1d, #f07128)" },
          { bg: "linear-gradient(145deg, #4ec5d7, #2771b8)" },
          { bg: "linear-gradient(145deg, #9fdf42, #4d8a27)" },
          { bg: "linear-gradient(145deg, #6c489e, #303d7e)" },
          { bg: "linear-gradient(145deg, #e65c00, #F9D423)" },
        ],
      },
      {
        id: 2,
        cards: [
          { bg: "linear-gradient(145deg, #ff4b1f, #ff9068)" },
          { bg: "linear-gradient(145deg, #11998e, #38ef7d)" },
          { bg: "linear-gradient(145deg, #8E2DE2, #4A00E0)" },
          { bg: "linear-gradient(145deg, #fc4a1a, #f7b733)" },
          { bg: "linear-gradient(145deg, #00c6ff, #0072ff)" },
          { bg: "linear-gradient(145deg, #d4145a, #fbb03b)" },
        ],
      },
      {
        id: 3,
        cards: [
          { bg: "linear-gradient(145deg, #a8ff78, #78ffd6)" },
          { bg: "linear-gradient(145deg, #ff0844, #ffb199)" },
          { bg: "linear-gradient(145deg, #b92b27, #1565C0)" },
          { bg: "linear-gradient(145deg, #3a1c71, #d76d77)" },
          { bg: "linear-gradient(145deg, #f8cf1f, #f1602c)" },
          { bg: "linear-gradient(145deg, #1f4037, #99f2c8)" },
        ],
      },
    ];

    const getCardPositions = () => {
      const w = window.innerWidth;
      if (w <= 575) {
        // Mobile (<= 575px): 6 cards fanned compactly within ~360px-400px width
        return [
          { x: -125, y: 15, r: -14 },
          { x: -75, y: 2, r: -8 },
          { x: -25, y: -10, r: -3 },
          { x: 25, y: -10, r: 3 },
          { x: 75, y: 2, r: 8 },
          { x: 125, y: 15, r: 14 },
        ];
      }
      if (w <= 991) {
        // Tablet (576px - 991px): 6 cards fanned neatly within ~768px width
        return [
          { x: -250, y: 22, r: -16 },
          { x: -150, y: 2, r: -9 },
          { x: -50, y: -16, r: -3 },
          { x: 50, y: -16, r: 3 },
          { x: 150, y: 2, r: 9 },
          { x: 250, y: 22, r: 16 },
        ];
      }
      // Desktop (>= 992px): 6 cards fanned out full width
      return [
        { x: -410, y: 25, r: -18 },
        { x: -246, y: -12, r: -10 },
        { x: -82, y: -30, r: -3 },
        { x: 82, y: -30, r: 3 },
        { x: 246, y: -12, r: 10 },
        { x: 410, y: 25, r: 18 },
      ];
    };

    const deckStage = document.getElementById("deckStage");
    const dots = document.querySelectorAll(".deck-dot");

    if (!deckStage) return;

    let currentSectionIndex = 0;
    let isTransitioning = false;
    let autoAdvanceTimer = null;
    let cardElements = [];

    const createCards = () => {
      deckStage.innerHTML = "";
      cardElements = [];

      for (let i = 0; i < 6; i++) {
        const card = document.createElement("article");
        card.className = "deck-card is-bundled";
        card.style.setProperty("--i", i);
        card.setAttribute("tabindex", "0");
        card.innerHTML = `
          <div class="card-img-frame">
            <img src="${HERO_IMAGE_PATH}" alt="Hero Card UI" class="card-hero-img">
          </div>
        `;
        deckStage.appendChild(card);
        cardElements.push(card);
        attachDragHandlers(card);
      }
    };

    const populateCardsData = (sectionIdx) => {
      const sectionData = SECTIONS[sectionIdx];
      cardElements.forEach((card, i) => {
        const data = sectionData.cards[i];
        card.style.background = data.bg;
      });
    };

    const applyCardPositions = (isBundled = false) => {
      const positions = getCardPositions();
      cardElements.forEach((card, i) => {
        if (isBundled) {
          card.classList.add("is-bundled");
          card.style.setProperty("--x", "0px");
          card.style.setProperty("--y", "0px");
          card.style.setProperty("--r", "0deg");
          card.style.zIndex = i + 1;
        } else {
          card.classList.remove("is-bundled");
          card.style.setProperty("--x", `${positions[i].x}px`);
          card.style.setProperty("--y", `${positions[i].y}px`);
          card.style.setProperty("--r", `${positions[i].r}deg`);
          card.style.zIndex = i + 1;
        }
      });
    };

    function attachDragHandlers(card) {
      let active = false;
      let startX = 0,
        startY = 0;

      const onPointerDown = (e) => {
        if (isTransitioning) return;
        active = true;
        startX = e.clientX;
        startY = e.clientY;
        card.classList.add("is-dragging");
        card.setPointerCapture(e.pointerId);
        stopAutoAdvance();
      };

      const onPointerMove = (e) => {
        if (!active) return;
        card.style.setProperty("--drag-x", `${e.clientX - startX}px`);
        card.style.setProperty("--drag-y", `${e.clientY - startY}px`);
      };

      const onPointerUp = () => {
        if (!active) return;
        active = false;
        card.classList.remove("is-dragging");
        card.style.setProperty("--drag-x", "0px");
        card.style.setProperty("--drag-y", "0px");
        startAutoAdvance();
      };

      card.addEventListener("pointerdown", onPointerDown);
      card.addEventListener("pointermove", onPointerMove);
      card.addEventListener("pointerup", onPointerUp);
      card.addEventListener("pointercancel", onPointerUp);
    }

    const goToSection = (targetIndex) => {
      if (isTransitioning || targetIndex === currentSectionIndex) return;
      isTransitioning = true;
      currentSectionIndex = targetIndex;

      dots.forEach((dot, idx) => {
        const isActive = idx === targetIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      applyCardPositions(true);

      setTimeout(() => {
        deckStage.classList.add("is-exit-right");
        setTimeout(() => {
          populateCardsData(targetIndex);
          deckStage.classList.remove("is-exit-right");
          deckStage.classList.add("is-enter-left");
          setTimeout(() => {
            deckStage.classList.remove("is-enter-left");
            deckStage.classList.add("is-entering");
            setTimeout(() => {
              deckStage.classList.remove("is-entering");
              applyCardPositions(false);
              isTransitioning = false;
            }, 420);
          }, 40);
        }, 400);
      }, 350);
    };

    const nextSection = () =>
      goToSection((currentSectionIndex + 1) % SECTIONS.length);

    const startAutoAdvance = () => {
      stopAutoAdvance();
      autoAdvanceTimer = setInterval(nextSection, 4000);
    };

    const stopAutoAdvance = () => {
      if (autoAdvanceTimer) {
        clearInterval(autoAdvanceTimer);
        autoAdvanceTimer = null;
      }
    };

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const index = parseInt(dot.getAttribute("data-index"), 10);
        stopAutoAdvance();
        goToSection(index);
        startAutoAdvance();
      });
    });

    createCards();
    populateCardsData(0);

    setTimeout(() => {
      deckStage.classList.remove("is-intro-sliding");
      applyCardPositions(false);
      startAutoAdvance();
    }, 1100);

    deckStage.addEventListener("mouseenter", stopAutoAdvance);
    deckStage.addEventListener("mouseleave", startAutoAdvance);

    window.addEventListener("resize", () => {
      if (!isTransitioning) {
        applyCardPositions(false);
      }
    });
  })();

  // ─── 2. SCROLL STACK ANIMATION & ACTIVE FOLLOWER VIEW CURSOR ───────────
  (function initScrollStack() {
    const stackCards = document.querySelectorAll(".stack-card");
    const viewFollower = document.getElementById("cardViewFollower");

    if (stackCards.length === 0) return;

    function handleScrollStack() {
      stackCards.forEach((card, idx) => {
        const rect = card.getBoundingClientRect();
        const topOffset = rect.top;
        if (topOffset <= 160 && idx < stackCards.length - 1) {
          const diff = Math.min(Math.max((160 - topOffset) / 320, 0), 1);
          const scale = 1 - diff * 0.05;
          const brightness = 1 - diff * 0.25;
          card.style.transform = `scale(${scale})`;
          card.style.filter = `brightness(${brightness})`;
        } else {
          card.style.transform = `scale(1)`;
          card.style.filter = `brightness(1)`;
        }
      });
    }

    window.addEventListener("scroll", handleScrollStack, { passive: true });

    stackCards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (viewFollower) {
          viewFollower.style.left = `${x}px`;
          viewFollower.style.top = `${y}px`;
          viewFollower.classList.add("is-active");
        }
      });

      card.addEventListener("mouseenter", () => {
        if (viewFollower) card.appendChild(viewFollower);
      });

      card.addEventListener("mouseleave", () => {
        if (viewFollower) viewFollower.classList.remove("is-active");
      });
    });
  })();

  // ─── 3. SERVICES ROW HOVER MOUSE-FOLLOWING PREVIEW ──────────────────────
  (function initServicesMouseFollower() {
    const servicesSection = document.getElementById("services");
    const serviceRows = document.querySelectorAll(".service-row");
    const previewContainer = document.getElementById("serviceMousePreview");
    const previewImg = document.getElementById("servicePreviewImg");

    if (!servicesSection || !previewContainer || !previewImg) return;

    let targetX = 0,
      targetY = 0;
    let currentX = 0,
      currentY = 0;
    let isHoveringRow = false;

    serviceRows.forEach((row) => {
      row.addEventListener("mouseenter", () => {
        const imageSrc = row.getAttribute("data-image");
        if (imageSrc) {
          previewImg.src = imageSrc;
        }
        isHoveringRow = true;
        previewContainer.classList.add("is-visible");
      });

      row.addEventListener("mousemove", (e) => {
        const sectionRect = servicesSection.getBoundingClientRect();
        targetX = e.clientX - sectionRect.left;
        targetY = e.clientY - sectionRect.top;
      });

      row.addEventListener("mouseleave", () => {
        isHoveringRow = false;
        previewContainer.classList.remove("is-visible");
      });
    });

    function animatePreviewFollower() {
      if (isHoveringRow) {
        currentX += (targetX - currentX) * 0.15;
        currentY += (targetY - currentY) * 0.15;
        previewContainer.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%) rotate(5deg)`;
      }
      requestAnimationFrame(animatePreviewFollower);
    }

    animatePreviewFollower();
  })();

  // ─── 4. PINNED HORIZONTAL SCROLL 7-STAGE PROCESS SECTION ────────────────
  (function initHorizontalScrollProcess() {
    const processSection = document.getElementById("howWeWorkSection");
    const track = document.getElementById("processHorizontalTrack");
    const lineFill = document.getElementById("processLineProgress");
    const centerBadge = document.getElementById("processCenterStageBadge");
    const centerStageNum = document.getElementById("centerStageNum");

    if (!processSection || !track) return;

    let currentActiveStageIndex = -1;

    function updateTrackPadding() {
      const cards = track.querySelectorAll(
        ".process-card, .process-promise-card"
      );
      if (cards.length > 0) {
        const firstCard = cards[0];
        const lastCard = cards[cards.length - 1];
        const padLeft = window.innerWidth / 2 - firstCard.offsetWidth / 2;
        const padRight = window.innerWidth / 2 - lastCard.offsetWidth / 2;
        track.style.paddingLeft = `${Math.max(padLeft, 20)}px`;
        track.style.paddingRight = `${Math.max(padRight, 20)}px`;
      }
    }

    function handleHorizontalScroll() {
      updateTrackPadding();
      const sectionRect = processSection.getBoundingClientRect();
      const sectionHeight = processSection.offsetHeight;
      const windowHeight = window.innerHeight;

      const scrollDistance = sectionHeight - windowHeight;
      const currentScroll = -sectionRect.top;

      let progress = 0;
      if (currentScroll >= 0 && currentScroll <= scrollDistance) {
        progress = currentScroll / scrollDistance;
      } else if (currentScroll > scrollDistance) {
        progress = 1;
      }

      const maxTranslateX = track.scrollWidth - window.innerWidth;
      const translateX = progress * maxTranslateX;
      track.style.transform = `translateX(-${translateX}px)`;
      if (lineFill) {
        lineFill.style.width = `${Math.min(progress * 100, 100)}%`;
      }

      // Find which card is closest to the horizontal center of the screen
      const cards = track.querySelectorAll(
        ".process-card, .process-promise-card"
      );
      const viewportCenter = window.innerWidth / 2;
      let closestIndex = 0;
      let minDistance = Infinity;

      cards.forEach((card, idx) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const dist = Math.abs(cardCenter - viewportCenter);

        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = idx;
        }
      });

      // Toggle active center popup state on cards
      cards.forEach((card, idx) => {
        if (idx === closestIndex) {
          card.classList.add("is-active-center");
        } else {
          card.classList.remove("is-active-center");
        }
      });

      // Update single center stage badge number when next stage reaches center of page
      if (closestIndex !== currentActiveStageIndex) {
        currentActiveStageIndex = closestIndex;
        let stageText = "";
        if (closestIndex < 7) {
          stageText = String(closestIndex + 1).padStart(2, "0");
        } else {
          stageText = "★";
        }

        if (centerStageNum) {
          centerStageNum.textContent = stageText;
        }

        if (centerBadge) {
          centerBadge.classList.add("is-popping");
          setTimeout(() => {
            centerBadge.classList.remove("is-popping");
          }, 300);
        }
      }
    }

    window.addEventListener("scroll", handleHorizontalScroll, { passive: true });
    window.addEventListener("resize", handleHorizontalScroll, { passive: true });
    updateTrackPadding();
    handleHorizontalScroll();
  })();
});
