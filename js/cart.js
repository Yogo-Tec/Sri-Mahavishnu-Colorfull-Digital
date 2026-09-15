"use strict";

/**
 * Sri Mahavishnu Colour Graphicz - Shopping Cart & Order Engine v3
 * Features:
 * - Persistent cart with localStorage (smcg_cart_items_v2)
 * - Redesigned, ultra-clean Floating Cart Button (Pill FAB)
 * - Streamlined Offcanvas Cart Drawer with items list & subtotal
 * - Dedicated "Order Placement" Popup Modal (Name, Phone, Address, Coupon, WhatsApp)
 * - Interactive "Product Feature Customizer" Popup Modal (13x19, QTY, Side, Media, GSM, Lamination, Finishing, Book Binding)
 * - Direct WhatsApp integration with official number +91 84382 83441
 * - Automatic Standalone Invoice HTML Download upon Place Order
 */

const SMCG_WHATSAPP_NUMBER = "918438283441";
const SMCG_CART_STORAGE_KEY = "smcg_cart_items_v2";
const SMCG_CUSTOMER_STORAGE_KEY = "smcg_customer_info_v2";
const SMCG_COUPON_STORAGE_KEY = "smcg_applied_coupon_v2";

const SMCG_VALID_COUPONS = {
  "SMCG10": { code: "SMCG10", type: "percent", value: 10, label: "10% Discount" },
  "WELCOME50": { code: "WELCOME50", type: "flat", value: 50, label: "₹50 Welcome Voucher" },
  "PRINT500": { code: "PRINT500", type: "flat", value: 500, minOrder: 2000, label: "₹500 Rebate on ₹2,000+" },
  "FIRSTORDER": { code: "FIRSTORDER", type: "percent", value: 15, label: "15% First Order Special" },
  "SMCGFREE": { code: "SMCGFREE", type: "percent", value: 5, label: "5% Express Discount" }
};

class SMCGCart {
  constructor() {
    this.items = this.loadCart();
    this.customer = this.loadCustomer();
    this.appliedCoupon = this.loadCoupon();
    this.activeCustomizerProduct = null;
    this.init();
  }

  loadCart() {
    try {
      const stored = localStorage.getItem(SMCG_CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("Could not read cart from localStorage", e);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem(SMCG_CART_STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.warn("Could not save cart to localStorage", e);
    }
    this.updateBadge();
    this.renderDrawer();
  }

  loadCustomer() {
    try {
      const stored = localStorage.getItem(SMCG_CUSTOMER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : { name: "", phone: "", address: "", notes: "" };
    } catch (e) {
      return { name: "", phone: "", address: "", notes: "" };
    }
  }

  saveCustomer(info) {
    this.customer = { ...this.customer, ...info };
    try {
      localStorage.setItem(SMCG_CUSTOMER_STORAGE_KEY, JSON.stringify(this.customer));
    } catch (e) {
      console.warn("Could not save customer info", e);
    }
  }

  loadCoupon() {
    try {
      const stored = localStorage.getItem(SMCG_COUPON_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  saveCoupon(coupon) {
    this.appliedCoupon = coupon;
    try {
      if (coupon) {
        localStorage.setItem(SMCG_COUPON_STORAGE_KEY, JSON.stringify(coupon));
      } else {
        localStorage.removeItem(SMCG_COUPON_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Could not save coupon", e);
    }
    this.renderDrawer();
    this.updateOrderModalSummary();
  }

  applyCoupon(inputCode) {
    if (!inputCode) return;
    const cleanCode = inputCode.trim().toUpperCase();
    const statusEl = document.getElementById("cartCouponStatus");

    if (!cleanCode) {
      if (statusEl) {
        statusEl.style.display = "block";
        statusEl.className = "small mt-1 text-danger";
        statusEl.textContent = "Please enter a valid coupon code.";
      }
      return;
    }

    const matched = SMCG_VALID_COUPONS[cleanCode];
    if (!matched) {
      if (cleanCode.length >= 4 && cleanCode.startsWith("SMCG")) {
        const customCoupon = { code: cleanCode, type: "percent", value: 10, label: `${cleanCode} (10% Off)` };
        this.saveCoupon(customCoupon);
        if (statusEl) {
          statusEl.style.display = "block";
          statusEl.className = "small mt-1 text-success fw-bold";
          statusEl.textContent = `Coupon ${cleanCode} applied! 10% Discount.`;
        }
        this.showToast(`Coupon ${cleanCode} applied!`);
        return;
      }

      if (statusEl) {
        statusEl.style.display = "block";
        statusEl.className = "small mt-1 text-danger";
        statusEl.textContent = `Invalid code "${cleanCode}". Try SMCG10, WELCOME50, or PRINT500.`;
      }
      return;
    }

    const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (matched.minOrder && subtotal < matched.minOrder) {
      if (statusEl) {
        statusEl.style.display = "block";
        statusEl.className = "small mt-1 text-warning fw-semibold";
        statusEl.textContent = `Coupon ${matched.code} requires minimum order of ₹${matched.minOrder.toLocaleString("en-IN")}. Current: ₹${subtotal.toLocaleString("en-IN")}.`;
      }
      return;
    }

    this.saveCoupon(matched);
    if (statusEl) {
      statusEl.style.display = "block";
      statusEl.className = "small mt-1 text-success fw-bold";
      statusEl.textContent = `Coupon ${matched.code} applied! (${matched.label})`;
    }
    this.showToast(`Coupon ${matched.code} applied!`);
  }

  removeCoupon() {
    this.saveCoupon(null);
    const statusEl = document.getElementById("cartCouponStatus");
    const inputEl = document.getElementById("cartCouponInput");
    if (statusEl) {
      statusEl.style.display = "block";
      statusEl.className = "small mt-1 text-muted";
      statusEl.textContent = "Coupon removed.";
      setTimeout(() => { statusEl.style.display = "none"; }, 2000);
    }
    if (inputEl) inputEl.value = "";
    this.showToast("Coupon removed");
  }

  init() {
    this.ensureCartMarkup();
    this.bindGlobalEvents();
    this.updateBadge();
    this.renderDrawer();
  }

  getPathPrefix() {
    const path = window.location.pathname;
    return path.includes("/pages/") ? "" : "pages/";
  }

  getAssetPrefix() {
    const path = window.location.pathname;
    return path.includes("/pages/") ? "../" : "./";
  }

  /**
   * Injects Floating Cart Button, Offcanvas Drawer, Order Placement Modal, and Feature Customizer Modal
   */
  ensureCartMarkup() {
    // 1. Sleek Floating Cart Button (Unified Pill - Resolves Image 5)
    if (!document.getElementById("smcgCartTrigger")) {
      const triggerBtn = document.createElement("button");
      triggerBtn.id = "smcgCartTrigger";
      triggerBtn.className = "floating-cart-btn";
      triggerBtn.setAttribute("type", "button");
      triggerBtn.setAttribute("data-bs-toggle", "offcanvas");
      triggerBtn.setAttribute("data-bs-target", "#smcgCartOffcanvas");
      triggerBtn.setAttribute("aria-controls", "smcgCartOffcanvas");
      triggerBtn.setAttribute("title", "View Your Shopping Cart");
      triggerBtn.innerHTML = `
        <span class="floating-cart-icon-wrap">
          <i class="bi bi-bag-check-fill"></i>
          <span class="floating-cart-badge" id="cartBadgeCount">0</span>
        </span>
        <span class="floating-cart-text">Cart</span>
      `;
      document.body.appendChild(triggerBtn);
    }

    // 2. Offcanvas Cart Drawer (Streamlined for items & quick proceed)
    if (!document.getElementById("smcgCartOffcanvas")) {
      const offcanvas = document.createElement("div");
      offcanvas.className = "offcanvas offcanvas-end smcg-cart-drawer";
      offcanvas.tabIndex = -1;
      offcanvas.id = "smcgCartOffcanvas";
      offcanvas.setAttribute("aria-labelledby", "smcgCartLabel");

      offcanvas.innerHTML = `
        <div class="offcanvas-header smcg-cart-header">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-bag-check-fill fs-4 text-accent"></i>
            <div>
              <h5 class="offcanvas-title fw-bold mb-0" id="smcgCartLabel">Your Print Order Cart</h5>
              <small class="text-muted" id="cartHeaderCount">0 Items selected</small>
            </div>
          </div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>

        <div class="offcanvas-body smcg-cart-body d-flex flex-column p-0">
          <div class="cart-items-container flex-grow-1 p-3" id="cartItemsList">
            <!-- Dynamically rendered items -->
          </div>

          <!-- Drawer Footer: Subtotal & Proceed to Order Button -->
          <div class="cart-drawer-footer p-3 border-top" id="cartCheckoutBlock">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="small text-muted fw-bold">Cart Subtotal</span>
              <span id="cartSubtotal" class="fs-5 fw-bold text-accent">₹0.00</span>
            </div>
            <button type="button" id="btnOpenOrderModal" class="btn btn-primary w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2">
              <i class="bi bi-arrow-right-circle-fill fs-5"></i> Proceed to Order Placement
            </button>
            <p class="cart-drawer-note text-center mt-2 mb-0">
              <i class="bi bi-shield-check text-success"></i> Sivakasi Factory Direct • Free Proof Verification
            </p>
          </div>
        </div>
      `;
      document.body.appendChild(offcanvas);
    }

    // 3. Dedicated Order Placement Popup Modal (Matching Image 1)
    if (!document.getElementById("smcgOrderModal")) {
      const orderModal = document.createElement("div");
      orderModal.className = "modal fade smcg-order-modal";
      orderModal.id = "smcgOrderModal";
      orderModal.tabIndex = -1;
      orderModal.setAttribute("aria-labelledby", "smcgOrderModalLabel");
      orderModal.setAttribute("aria-hidden", "true");

      orderModal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 24px; overflow: hidden;">
            <div class="modal-header smcg-order-modal-header py-3 px-4" style="background: linear-gradient(135deg, #18191c 0%, #2b2e36 100%);">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-bag-check-fill fs-4 text-accent"></i>
                <div>
                  <h5 class="modal-title fw-bold mb-0 text-white" id="smcgOrderModalLabel">Complete Your Print Order</h5>
                  <small class="text-white-50">Direct Sivakasi Factory Production • Instant WhatsApp Confirmation</small>
                </div>
              </div>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body p-4">
              <div class="row g-4">
                <!-- Left: Order Items Summary & Promo Coupon -->
                <div class="col-lg-6 border-end-lg">
                  <h6 class="order-summary-title mb-3 fw-bold">
                    <i class="bi bi-receipt-cutoff text-accent me-1"></i> Order Items (<span id="modalOrderCount">0</span>)
                  </h6>
                  
                  <div class="order-items-scroll-wrap mb-3 p-2 rounded-3 border bg-light-subtle" id="modalOrderItemsList" style="max-height: 220px; overflow-y: auto;">
                    <!-- Dynamically populated items -->
                  </div>

                  <!-- Coupon Section inside Modal -->
                  <div class="cart-coupon-box mb-3 p-3 rounded-3 border">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="small fw-bold"><i class="bi bi-ticket-perforated-fill text-accent me-1"></i> Promo / Coupon Code</span>
                      <span class="text-muted" style="font-size: 11px;">e.g. SMCG10, WELCOME50</span>
                    </div>
                    <div class="input-group input-group-sm">
                      <input type="text" id="cartCouponInput" class="form-control cart-input text-uppercase fw-bold" 
                             placeholder="Enter coupon code" autocomplete="off" maxlength="15">
                      <button class="btn btn-outline-success btn-sm px-3 fw-bold" type="button" id="btnApplyCoupon">Apply</button>
                    </div>
                    <div id="cartCouponStatus" class="small mt-1" style="display: none;"></div>
                    <div id="appliedCouponBadge" class="mt-2" style="display: none;"></div>
                  </div>

                  <!-- Totals Summary -->
                  <div class="order-totals-box p-3 rounded-3 border bg-light-subtle">
                    <div class="d-flex justify-content-between align-items-center mb-1 small text-muted">
                      <span>Subtotal</span>
                      <span id="modalSubtotal" class="fw-semibold">₹0.00</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-1 small text-success" id="modalDiscountRow" style="display: none;">
                      <span id="modalDiscountLabel">Coupon Savings</span>
                      <span id="modalDiscount" class="fw-bold">- ₹0.00</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span class="fw-bold fs-6">Grand Total</span>
                      <span class="fs-4 fw-black text-accent" id="modalGrandTotal">₹0.00</span>
                    </div>
                  </div>
                </div>

                <!-- Right: Delivery & Contact Details Form (Reference Image 1) -->
                <div class="col-lg-6">
                  <div class="delivery-details-card p-3 rounded-3 border" style="background: rgba(160, 237, 50, 0.05); border-color: rgba(160, 237, 50, 0.3) !important;">
                    <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                      <i class="bi bi-person-lines-fill fs-5 text-accent"></i>
                      <h6 class="fw-bold mb-0 text-uppercase" style="letter-spacing: 0.03em;">DELIVERY &amp; CONTACT DETAILS</h6>
                    </div>

                    <div class="mb-3">
                      <input type="text" id="custNameInput" class="form-control form-control-sm cart-input" 
                             placeholder="Full Name / Company Name *" required>
                    </div>
                    <div class="mb-3">
                      <input type="tel" id="custPhoneInput" class="form-control form-control-sm cart-input" 
                             placeholder="WhatsApp Phone Number *" required>
                    </div>
                    <div class="mb-3">
                      <textarea id="custAddressInput" class="form-control form-control-sm cart-input" rows="3" 
                                placeholder="Delivery Address (Street, City, PIN) *" required></textarea>
                    </div>
                    <div class="mb-3">
                      <input type="text" id="custNotesInput" class="form-control form-control-sm cart-input" 
                             placeholder="Job Notes / Special Instructions (Optional)">
                    </div>

                    <button type="button" id="btnPlaceOrderWhatsApp" class="btn btn-primary w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%) !important; font-size: 15.5px !important; border-radius: 14px !important;">
                      <i class="bi bi-whatsapp fs-5"></i> Place Order via WhatsApp
                    </button>
                    <p class="cart-note text-center mt-2 mb-0" style="font-size: 11px;">
                      <i class="bi bi-file-earmark-arrow-down-fill text-success"></i> Auto-downloads invoice &amp; opens WhatsApp with verified specs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(orderModal);
    }

    // 4. Dedicated Product Feature Customizer Modal (Size 13x19, QTY, Media, GSM, Side, Lamination, Finishing, Binding)
    if (!document.getElementById("smcgCustomizerModal")) {
      const custModal = document.createElement("div");
      custModal.className = "modal fade smcg-customizer-modal";
      custModal.id = "smcgCustomizerModal";
      custModal.tabIndex = -1;
      custModal.setAttribute("aria-labelledby", "smcgCustomizerLabel");
      custModal.setAttribute("aria-hidden", "true");

      custModal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-xl">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 24px; overflow: hidden;">
            <div class="modal-header smcg-customizer-header py-3 px-4" style="background: linear-gradient(135deg, #18191c 0%, #2b2e36 100%);">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-sliders2-vertical fs-4 text-accent"></i>
                <div>
                  <h5 class="modal-title fw-bold mb-0 text-white" id="smcgCustomizerLabel">Customize Product Features &amp; Specifications</h5>
                  <small class="text-white-50">Precision Sivakasi Production • Instant Live Price Calculation</small>
                </div>
              </div>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body p-4">
              <div class="row g-4">
                <!-- Left: Product Preview & Live Price -->
                <div class="col-lg-4">
                  <div class="customizer-preview-card p-3 rounded-4 border bg-light-subtle text-center sticky-top" style="top: 15px;">
                    <div class="customizer-img-wrap rounded-3 overflow-hidden mb-3 border shadow-sm" style="max-height: 200px;">
                      <img id="custModalProductImg" src="../assets/images/products/custom-boxes.jpg" alt="Product Preview" style="width: 100%; height: 200px; object-fit: cover;">
                    </div>
                    <h5 class="fw-bold mb-1" id="custModalProductTitle">Custom Packaging Boxes</h5>
                    <span class="badge bg-dark text-accent px-3 py-1 rounded-pill mb-3" id="custModalProductBadge">Folding Cartons</span>

                    <!-- Live Config Summary -->
                    <div class="customizer-summary-chips p-2 rounded-3 border mb-3 text-start small" style="background: rgba(160,237,50,0.06); font-size: 11.5px;">
                      <div class="d-flex justify-content-between py-1 border-bottom">
                        <span class="text-muted">Size:</span> <strong id="sumSize">13 x 19 in</strong>
                      </div>
                      <div class="d-flex justify-content-between py-1 border-bottom">
                        <span class="text-muted">Quantity:</span> <strong id="sumQty">500 pcs</strong>
                      </div>
                      <div class="d-flex justify-content-between py-1 border-bottom">
                        <span class="text-muted">Side / Print:</span> <strong id="sumSide">Single Side (4+0)</strong>
                      </div>
                      <div class="d-flex justify-content-between py-1 border-bottom">
                        <span class="text-muted">Substrate:</span> <strong id="sumMedia">Imported Art Paper</strong>
                      </div>
                      <div class="d-flex justify-content-between py-1 border-bottom">
                        <span class="text-muted">GSM:</span> <strong id="sumGsm">300 GSM</strong>
                      </div>
                      <div class="d-flex justify-content-between py-1 border-bottom">
                        <span class="text-muted">Lamination:</span> <strong id="sumLam">Matte Thermal</strong>
                      </div>
                      <div class="d-flex justify-content-between py-1 border-bottom">
                        <span class="text-muted">Finishing:</span> <strong id="sumFinish">CUTTING, DIE-CUT</strong>
                      </div>
                      <div class="d-flex justify-content-between py-1" id="sumBindingRow" style="display: none;">
                        <span class="text-muted">Binding:</span> <strong id="sumBinding">Center Pin Book</strong>
                      </div>
                    </div>

                    <!-- Dynamic Price Preview -->
                    <div class="customizer-price-box p-3 rounded-3 border mb-3 text-start bg-white" style="box-shadow: 0 4px 14px rgba(0,0,0,0.05);">
                      <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="small text-muted">Estimated Unit Rate:</span>
                        <strong class="fs-6 text-dark" id="custModalUnitRate">₹3.50 / pc</strong>
                      </div>
                      <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                        <span class="fw-bold">Total Estimate:</span>
                        <span class="fs-4 fw-black text-accent" id="custModalGrandTotal">₹1,750.00</span>
                      </div>
                    </div>

                    <button type="button" id="btnAddCustomItemToCart" class="btn btn-primary w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 rounded-pill">
                      <i class="bi bi-cart-plus-fill fs-5"></i> Add Configured Item to Cart
                    </button>
                  </div>
                </div>

                <!-- Right: Interactive Feature Pickers -->
                <div class="col-lg-8">
                  <div class="customizer-options-wrapper pe-lg-2" style="max-height: 600px; overflow-y: auto;">
                    
                    <!-- 1. Size Selection (Searchable Typed Dropdown + Custom Dimensions Input + Quick Chips) -->
                    <div class="cust-feature-group mb-4">
                      <label class="cust-feature-title mb-2 fw-bold d-block"><i class="bi bi-aspect-ratio text-accent me-1"></i> 1. Size &amp; Dimensions</label>
                      <div class="cust-typed-select-box mb-2" data-group="size">
                        <div class="input-group input-group-sm">
                          <span class="input-group-text bg-dark-subtle text-accent"><i class="bi bi-search"></i></span>
                          <input type="text" class="form-control cust-typed-input" id="typedInputSize" 
                                 placeholder="Type to search Size or choose Custom..." autocomplete="off" value="13 x 19 in (Press Sheet)">
                          <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="View short list"></button>
                          <ul class="dropdown-menu dropdown-menu-end shadow cust-short-list" id="ddListSize">
                            <li><button type="button" class="dropdown-item active" data-val="13 x 19 in (Press Sheet)"><i class="bi bi-check2 me-1 text-accent"></i> 13 x 19 in (Press Sheet)</button></li>
                            <li><button type="button" class="dropdown-item" data-val="12 x 18 in (Digital)">12 x 18 in (Digital)</button></li>
                            <li><button type="button" class="dropdown-item" data-val="A4 (8.3 x 11.7 in)">A4 (8.3 x 11.7 in)</button></li>
                            <li><button type="button" class="dropdown-item" data-val="A3 (11.7 x 16.5 in)">A3 (11.7 x 16.5 in)</button></li>
                            <li><button type="button" class="dropdown-item" data-val="3.5 x 2 in (Card)">3.5 x 2 in (Card)</button></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><button type="button" class="dropdown-item text-success fw-bold" data-val="Custom Dimensions"><i class="bi bi-pencil-square me-1"></i> Custom Dimensions (Input Box)</button></li>
                          </ul>
                        </div>
                        <!-- Custom Size Input Box -->
                        <div class="cust-custom-input-box mt-2" id="boxCustomSize" style="display: none;">
                          <div class="input-group input-group-sm">
                            <span class="input-group-text bg-success-subtle text-success fw-bold"><i class="bi bi-aspect-ratio me-1"></i> Custom Size:</span>
                            <input type="text" class="form-control cust-custom-field" id="custFieldSize" placeholder="Enter custom dimensions (e.g. 10 x 14 in or 200 x 300 mm)...">
                          </div>
                        </div>
                      </div>
                      <div class="cust-chips-group d-flex flex-wrap gap-2" id="grpSize">
                        <button type="button" class="cust-chip active" data-val="13 x 19 in (Press Sheet)">13 x 19 in</button>
                        <button type="button" class="cust-chip" data-val="12 x 18 in (Digital)">12 x 18 in</button>
                        <button type="button" class="cust-chip" data-val="A4 (8.3 x 11.7 in)">A4 (8.3 x 11.7 in)</button>
                        <button type="button" class="cust-chip" data-val="A3 (11.7 x 16.5 in)">A3 (11.7 x 16.5 in)</button>
                        <button type="button" class="cust-chip" data-val="3.5 x 2 in (Card)">3.5 x 2 in (Card)</button>
                        <button type="button" class="cust-chip" data-val="Custom Dimensions">Custom Size</button>
                      </div>
                    </div>

                    <!-- 2. Quantity (QTY Box + Chips) -->
                    <div class="cust-feature-group mb-4">
                      <label class="cust-feature-title mb-2 fw-bold d-block"><i class="bi bi-box2-fill text-accent me-1"></i> 2. Quantity (QTY)</label>
                      <div class="d-flex align-items-center gap-3 mb-2">
                        <div class="input-group" style="width: 170px;">
                          <button class="btn btn-outline-secondary" type="button" id="btnQtyMinus"><i class="bi bi-dash"></i></button>
                          <input type="number" id="custQtyInput" class="form-control text-center fw-bold fs-6" value="500" min="1" step="25">
                          <button class="btn btn-outline-secondary" type="button" id="btnQtyPlus"><i class="bi bi-plus"></i></button>
                        </div>
                        <span class="text-muted small">Enter custom quantity or pick preset:</span>
                      </div>
                      <div class="cust-chips-group d-flex flex-wrap gap-2" id="grpQty">
                        <button type="button" class="cust-chip" data-val="25">25 pcs</button>
                        <button type="button" class="cust-chip" data-val="50">50 pcs</button>
                        <button type="button" class="cust-chip" data-val="100">100 pcs</button>
                        <button type="button" class="cust-chip" data-val="250">250 pcs</button>
                        <button type="button" class="cust-chip active" data-val="500">500 pcs</button>
                        <button type="button" class="cust-chip" data-val="1000">1000 pcs</button>
                        <button type="button" class="cust-chip" data-val="2500">2500 pcs</button>
                        <button type="button" class="cust-chip" data-val="5000">5000 pcs</button>
                      </div>
                    </div>

                    <!-- 3. Printing Side -->
                    <div class="cust-feature-group mb-4">
                      <label class="cust-feature-title mb-2 fw-bold d-block"><i class="bi bi-file-earmark-break text-accent me-1"></i> 3. Printing Side</label>
                      <div class="cust-chips-group d-flex flex-wrap gap-2" id="grpSide">
                        <button type="button" class="cust-chip active" data-val="Single Sided (4+0)" data-cost="0">Single Side (1 Side)</button>
                        <button type="button" class="cust-chip" data-val="Double Sided (4+4)" data-cost="0.35">Double Side (2 Sides)</button>
                      </div>
                    </div>

                    <!-- 4. Substrate / Media (Searchable Typed Dropdown + Custom Media Input + Quick Chips) -->
                    <div class="cust-feature-group mb-4">
                      <label class="cust-feature-title mb-2 fw-bold d-block"><i class="bi bi-card-image text-accent me-1"></i> 4. Substrate / Media</label>
                      <div class="cust-typed-select-box mb-2" data-group="media">
                        <div class="input-group input-group-sm">
                          <span class="input-group-text bg-dark-subtle text-accent"><i class="bi bi-search"></i></span>
                          <input type="text" class="form-control cust-typed-input" id="typedInputMedia" 
                                 placeholder="Type to search Media or choose Custom..." autocomplete="off" value="Imported Art Paper">
                          <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="View short list"></button>
                          <ul class="dropdown-menu dropdown-menu-end shadow cust-short-list" id="ddListMedia">
                            <li><button type="button" class="dropdown-item active" data-val="Imported Art Paper" data-cost="0"><i class="bi bi-check2 me-1 text-accent"></i> Imported Art Paper</button></li>
                            <li><button type="button" class="dropdown-item" data-val="Cyber X / Duplex Board" data-cost="0.40">Cyber X / Duplex Board</button></li>
                            <li><button type="button" class="dropdown-item" data-val="Waterproof Vinyl Film" data-cost="0.50">Waterproof Vinyl Film</button></li>
                            <li><button type="button" class="dropdown-item" data-val="Cotton Velvet Board" data-cost="0.90">Cotton Velvet Board</button></li>
                            <li><button type="button" class="dropdown-item" data-val="Virgin Kraft Paper" data-cost="0.30">Virgin Kraft Paper</button></li>
                            <li><button type="button" class="dropdown-item" data-val="Kappa / Grey Board" data-cost="1.20">Kappa / Grey Board</button></li>
                            <li><button type="button" class="dropdown-item" data-val="Metallic Chrome Film" data-cost="0.80">Metallic Chrome Film</button></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><button type="button" class="dropdown-item text-success fw-bold" data-val="Custom Substrate / Media" data-cost="0.50"><i class="bi bi-pencil-square me-1"></i> Custom Substrate / Media (Input Box)</button></li>
                          </ul>
                        </div>
                        <!-- Custom Media Input Box -->
                        <div class="cust-custom-input-box mt-2" id="boxCustomMedia" style="display: none;">
                          <div class="input-group input-group-sm">
                            <span class="input-group-text bg-success-subtle text-success fw-bold"><i class="bi bi-card-image me-1"></i> Custom Media:</span>
                            <input type="text" class="form-control cust-custom-field" id="custFieldMedia" placeholder="Enter custom substrate / paper specification...">
                          </div>
                        </div>
                      </div>
                      <div class="cust-chips-group d-flex flex-wrap gap-2" id="grpMedia">
                        <button type="button" class="cust-chip active" data-val="Imported Art Paper" data-cost="0">Imported Art Paper</button>
                        <button type="button" class="cust-chip" data-val="Cyber X / Duplex Board" data-cost="0.40">Cyber X / Duplex Board</button>
                        <button type="button" class="cust-chip" data-val="Waterproof Vinyl Film" data-cost="0.50">Waterproof Vinyl Film</button>
                        <button type="button" class="cust-chip" data-val="Cotton Velvet Board" data-cost="0.90">Cotton Velvet Board</button>
                        <button type="button" class="cust-chip" data-val="Virgin Kraft Paper" data-cost="0.30">Virgin Kraft Paper</button>
                        <button type="button" class="cust-chip" data-val="Kappa / Grey Board" data-cost="1.20">Kappa / Grey Board</button>
                        <button type="button" class="cust-chip" data-val="Metallic Chrome Film" data-cost="0.80">Metallic Chrome Film</button>
                      </div>
                    </div>

                    <!-- 5. GSM / Caliper (Searchable Typed Dropdown + Custom GSM Input + Quick Chips) -->
                    <div class="cust-feature-group mb-4">
                      <label class="cust-feature-title mb-2 fw-bold d-block"><i class="bi bi-speedometer text-accent me-1"></i> 5. GSM / Caliper</label>
                      <div class="cust-typed-select-box mb-2" data-group="gsm">
                        <div class="input-group input-group-sm">
                          <span class="input-group-text bg-dark-subtle text-accent"><i class="bi bi-search"></i></span>
                          <input type="text" class="form-control cust-typed-input" id="typedInputGsm" 
                                 placeholder="Type to search GSM / Caliper..." autocomplete="off" value="300 GSM">
                          <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="View short list"></button>
                          <ul class="dropdown-menu dropdown-menu-end shadow cust-short-list" id="ddListGsm">
                            <li><button type="button" class="dropdown-item" data-val="80 GSM">80 GSM (Lightweight)</button></li>
                            <li><button type="button" class="dropdown-item" data-val="130 GSM">130 GSM (Flyer / Brochure)</button></li>
                            <li><button type="button" class="dropdown-item" data-val="170 GSM">170 GSM (Premium Leaflet)</button></li>
                            <li><button type="button" class="dropdown-item" data-val="250 GSM">250 GSM (Card / Cover)</button></li>
                            <li><button type="button" class="dropdown-item active" data-val="300 GSM"><i class="bi bi-check2 me-1 text-accent"></i> 300 GSM (Heavyweight)</button></li>
                            <li><button type="button" class="dropdown-item" data-val="350 GSM">350 GSM (Luxury Card)</button></li>
                            <li><button type="button" class="dropdown-item" data-val="400 GSM">400 GSM (Ultra Heavy)</button></li>
                            <li><button type="button" class="dropdown-item" data-val="Rigid Board">Rigid Board (1.5mm - 3mm Kappa)</button></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><button type="button" class="dropdown-item text-success fw-bold" data-val="Custom GSM / Caliper"><i class="bi bi-pencil-square me-1"></i> Custom GSM / Caliper (Input Box)</button></li>
                          </ul>
                        </div>
                        <!-- Custom GSM Input Box -->
                        <div class="cust-custom-input-box mt-2" id="boxCustomGsm" style="display: none;">
                          <div class="input-group input-group-sm">
                            <span class="input-group-text bg-success-subtle text-success fw-bold"><i class="bi bi-speedometer me-1"></i> Custom GSM:</span>
                            <input type="text" class="form-control cust-custom-field" id="custFieldGsm" placeholder="Enter custom GSM or Caliper (e.g. 220 GSM or 2.5mm)...">
                          </div>
                        </div>
                      </div>
                      <div class="cust-chips-group d-flex flex-wrap gap-2" id="grpGsm">
                        <button type="button" class="cust-chip" data-val="80 GSM">80 GSM</button>
                        <button type="button" class="cust-chip" data-val="130 GSM">130 GSM</button>
                        <button type="button" class="cust-chip" data-val="170 GSM">170 GSM</button>
                        <button type="button" class="cust-chip" data-val="250 GSM">250 GSM</button>
                        <button type="button" class="cust-chip active" data-val="300 GSM">300 GSM</button>
                        <button type="button" class="cust-chip" data-val="350 GSM">350 GSM</button>
                        <button type="button" class="cust-chip" data-val="400 GSM">400 GSM</button>
                        <button type="button" class="cust-chip" data-val="Rigid Board">Rigid Board</button>
                      </div>
                    </div>

                    <!-- 6. Lamination (Searchable Typed Dropdown + Custom Lamination Input + Quick Chips) -->
                    <div class="cust-feature-group mb-4">
                      <label class="cust-feature-title mb-2 fw-bold d-block"><i class="bi bi-shield-shaded text-accent me-1"></i> 6. Lamination Finish</label>
                      <div class="cust-typed-select-box mb-2" data-group="lam">
                        <div class="input-group input-group-sm">
                          <span class="input-group-text bg-dark-subtle text-accent"><i class="bi bi-search"></i></span>
                          <input type="text" class="form-control cust-typed-input" id="typedInputLam" 
                                 placeholder="Type to search Lamination..." autocomplete="off" value="Matte Thermal">
                          <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="View short list"></button>
                          <ul class="dropdown-menu dropdown-menu-end shadow cust-short-list" id="ddListLam">
                            <li><button type="button" class="dropdown-item" data-val="None" data-cost="0">None (Raw Surface)</button></li>
                            <li><button type="button" class="dropdown-item" data-val="Gloss Thermal" data-cost="0.25">Gloss Thermal Lamination</button></li>
                            <li><button type="button" class="dropdown-item active" data-val="Matte Thermal" data-cost="0.25"><i class="bi bi-check2 me-1 text-accent"></i> Matte Thermal Lamination</button></li>
                            <li><button type="button" class="dropdown-item" data-val="Soft-Touch / Velvet" data-cost="0.60">Soft-Touch / Velvet Lamination</button></li>
                            <li><button type="button" class="dropdown-item" data-val="Anti-Scratch Matte" data-cost="0.45">Anti-Scratch Matte Lamination</button></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><button type="button" class="dropdown-item text-success fw-bold" data-val="Custom Lamination Finish" data-cost="0.30"><i class="bi bi-pencil-square me-1"></i> Custom Lamination Finish (Input Box)</button></li>
                          </ul>
                        </div>
                        <!-- Custom Lamination Input Box -->
                        <div class="cust-custom-input-box mt-2" id="boxCustomLam" style="display: none;">
                          <div class="input-group input-group-sm">
                            <span class="input-group-text bg-success-subtle text-success fw-bold"><i class="bi bi-shield-shaded me-1"></i> Custom Lamination:</span>
                            <input type="text" class="form-control cust-custom-field" id="custFieldLam" placeholder="Enter custom lamination finish (e.g. Sand Matte, Leather Texture)...">
                          </div>
                        </div>
                      </div>
                      <div class="cust-chips-group d-flex flex-wrap gap-2" id="grpLam">
                        <button type="button" class="cust-chip" data-val="None" data-cost="0">None</button>
                        <button type="button" class="cust-chip" data-val="Gloss Thermal" data-cost="0.25">Gloss Thermal</button>
                        <button type="button" class="cust-chip active" data-val="Matte Thermal" data-cost="0.25">Matte Thermal</button>
                        <button type="button" class="cust-chip" data-val="Soft-Touch / Velvet" data-cost="0.60">Soft-Touch / Velvet</button>
                        <button type="button" class="cust-chip" data-val="Anti-Scratch Matte" data-cost="0.45">Anti-Scratch Matte</button>
                      </div>
                    </div>

                    <!-- 7. Finishing Effects (Searchable Typed Dropdown + Custom Finishing Input + Multi-select Chips) -->
                    <div class="cust-feature-group mb-4">
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <label class="cust-feature-title mb-0 fw-bold"><i class="bi bi-magic text-accent me-1"></i> 7. Finishing Types &amp; Effects</label>
                        <small class="text-muted">(Multi-select)</small>
                      </div>
                      <div class="cust-typed-select-box mb-2" data-group="finish">
                        <div class="input-group input-group-sm">
                          <span class="input-group-text bg-dark-subtle text-accent"><i class="bi bi-search"></i></span>
                          <input type="text" class="form-control cust-typed-input" id="typedInputFinish" 
                                 placeholder="Type to search or add Finishing Effects..." autocomplete="off" value="CUTTING, DIE-CUT">
                          <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="View short list"></button>
                          <ul class="dropdown-menu dropdown-menu-end shadow cust-short-list" id="ddListFinish">
                            <li><button type="button" class="dropdown-item" data-val="CUTTING" data-cost="0"><i class="bi bi-scissors me-1"></i> CUTTING</button></li>
                            <li><button type="button" class="dropdown-item" data-val="CREASING" data-cost="0.15"><i class="bi bi-border-style me-1"></i> CREASING</button></li>
                            <li><button type="button" class="dropdown-item" data-val="PERFORATION" data-cost="0.20"><i class="bi bi-dash-lg me-1"></i> PERFORATION</button></li>
                            <li><button type="button" class="dropdown-item active" data-val="DIE-CUT" data-cost="0.30"><i class="bi bi-stars me-1"></i> DIE-CUT</button></li>
                            <li><button type="button" class="dropdown-item" data-val="Spot UV Gloss" data-cost="0.45"><i class="bi bi-sun-fill me-1"></i> Spot UV Gloss</button></li>
                            <li><button type="button" class="dropdown-item" data-val="Gold Foil Stamping" data-cost="0.55"><i class="bi bi-award-fill me-1"></i> Gold Foil Stamping</button></li>
                            <li><button type="button" class="dropdown-item" data-val="3D Embossing" data-cost="0.40"><i class="bi bi-layers-half me-1"></i> 3D Embossing</button></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><button type="button" class="dropdown-item text-success fw-bold" data-val="Custom Finishing Effect" data-cost="0.35"><i class="bi bi-pencil-square me-1"></i> Custom Finishing Effect (Input Box)</button></li>
                          </ul>
                        </div>
                        <!-- Custom Finishing Input Box -->
                        <div class="cust-custom-input-box mt-2" id="boxCustomFinish" style="display: none;">
                          <div class="input-group input-group-sm">
                            <span class="input-group-text bg-success-subtle text-success fw-bold"><i class="bi bi-magic me-1"></i> Custom Finishing:</span>
                            <input type="text" class="form-control cust-custom-field" id="custFieldFinish" placeholder="Enter custom finishing / special embellishment...">
                          </div>
                        </div>
                      </div>
                      <div class="cust-chips-group d-flex flex-wrap gap-2" id="grpFinish">
                        <button type="button" class="cust-chip cust-chip-multi active" data-val="CUTTING" data-cost="0">CUTTING</button>
                        <button type="button" class="cust-chip cust-chip-multi" data-val="CREASING" data-cost="0.15">CREASING</button>
                        <button type="button" class="cust-chip cust-chip-multi" data-val="PERFORATION" data-cost="0.20">PERFORATION</button>
                        <button type="button" class="cust-chip cust-chip-multi active" data-val="DIE-CUT" data-cost="0.30">DIE-CUT</button>
                        <button type="button" class="cust-chip cust-chip-multi" data-val="Spot UV Gloss" data-cost="0.45">Spot UV Gloss</button>
                        <button type="button" class="cust-chip cust-chip-multi" data-val="Gold Foil Stamping" data-cost="0.55">Gold Foil Stamping</button>
                        <button type="button" class="cust-chip cust-chip-multi" data-val="3D Embossing" data-cost="0.40">3D Embossing</button>
                      </div>
                    </div>

                    <!-- 8. Book Binding (Spiral, Wiro, Center Pin Book) -->
                    <div class="cust-feature-group mb-3" id="grpBindingSection">
                      <label class="cust-feature-title mb-2 fw-bold d-block"><i class="bi bi-book-half text-accent me-1"></i> 8. Book &amp; Publication Binding</label>
                      <div class="cust-chips-group d-flex flex-wrap gap-2" id="grpBinding">
                        <button type="button" class="cust-chip active" data-val="None" data-cost="0">None (Standard Flat)</button>
                        <button type="button" class="cust-chip" data-val="Spiral Binding" data-cost="8">Spiral Binding</button>
                        <button type="button" class="cust-chip" data-val="Wiro Binding" data-cost="12">Wiro Binding</button>
                        <button type="button" class="cust-chip" data-val="Center Pin Book (Saddle Stitch)" data-cost="5">Center Pin Book</button>
                        <button type="button" class="cust-chip" data-val="Perfect Book Binding" data-cost="15">Perfect Book Binding</button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(custModal);
    }
  }

  /**
   * Listen for user interactions across the page
   */
  bindGlobalEvents() {
    document.addEventListener("click", (e) => {
      // 1. Open Feature Customizer Modal when clicking Add to Cart, Customize Specs, or any Spec Pill on a card
      const customTrigger = e.target.closest(".btn-add-to-cart, [data-action='add-cart'], .btn-card-customize, [data-action='open-customizer'], .spec-pill");
      if (customTrigger) {
        e.preventDefault();
        e.stopPropagation();

        const card = customTrigger.closest(".all-cat-card");
        if (card) {
          // If clicking a spec pill directly, toggle active class on card first
          if (customTrigger.classList.contains("spec-pill")) {
            card.querySelectorAll(".spec-pill").forEach(p => p.classList.remove("active"));
            customTrigger.classList.add("active");
          }

          const productData = {
            id: card.getAttribute("data-id") || card.querySelector(".btn-add-to-cart")?.getAttribute("data-id") || "PROD-01",
            title: card.getAttribute("data-title") || card.querySelector(".card-title")?.textContent.trim() || "Custom Printed Product",
            basePrice: parseFloat(card.getAttribute("data-price-val")) || parseFloat(card.querySelector(".btn-add-to-cart")?.getAttribute("data-price")) || 3.5,
            img: card.getAttribute("data-img") || card.querySelector(".card-media img")?.getAttribute("src") || "",
            badge: card.getAttribute("data-badge") || "Precision Print",
            category: card.getAttribute("data-category") || "general",
            unit: card.querySelector(".btn-add-to-cart")?.getAttribute("data-unit") || "pc",
            initialPill: card.querySelector(".spec-pill.active")?.textContent.trim() || customTrigger.textContent.trim() || ""
          };

          this.openCustomizer(productData);
          return;
        }
      }

      // 2. Open Order Placement Modal from drawer button
      if (e.target.closest("#btnOpenOrderModal")) {
        e.preventDefault();
        const drawerEl = document.getElementById("smcgCartOffcanvas");
        if (drawerEl && typeof bootstrap !== "undefined" && bootstrap.Offcanvas) {
          const bsDrawer = bootstrap.Offcanvas.getInstance(drawerEl);
          if (bsDrawer) bsDrawer.hide();
        }
        this.openOrderModal();
      }

      // 3. Click on any dropdown short-list item
      const ddItem = e.target.closest(".cust-short-list .dropdown-item");
      if (ddItem) {
        e.preventDefault();
        const wrapper = ddItem.closest(".cust-typed-select-box");
        const val = ddItem.getAttribute("data-val");
        const group = wrapper?.getAttribute("data-group");
        const typedInput = wrapper?.querySelector(".cust-typed-input");
        if (typedInput) typedInput.value = val;

        wrapper.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
        ddItem.classList.add("active");

        // Sync corresponding chip
        if (group) {
          const chipGroupId = this.getChipGroupId(group);
          const chipGroup = document.getElementById(chipGroupId);
          if (chipGroup) {
            chipGroup.querySelectorAll(".cust-chip").forEach(c => {
              const cVal = c.getAttribute("data-val");
              c.classList.toggle("active", cVal === val || (val.toLowerCase().includes("custom") && cVal.toLowerCase().includes("custom")));
            });
          }
        }

        // Toggle custom input box
        const isCustom = val.toLowerCase().includes("custom");
        const customBox = wrapper?.querySelector(".cust-custom-input-box");
        if (customBox) {
          customBox.style.display = isCustom ? "block" : "none";
          if (isCustom) {
            const field = customBox.querySelector(".cust-custom-field");
            if (field) field.focus();
          }
        }

        this.updateCustomizerLiveCalculation();
      }

      // 4. Quantity Stepper in Drawer
      const qtyBtn = e.target.closest(".cart-qty-btn");
      if (qtyBtn) {
        const id = qtyBtn.getAttribute("data-id");
        const action = qtyBtn.getAttribute("data-step");
        if (action === "plus") {
          this.changeQuantity(id, 1);
        } else if (action === "minus") {
          this.changeQuantity(id, -1);
        }
      }

      // 5. Remove Item from Drawer
      const removeBtn = e.target.closest(".cart-remove-btn");
      if (removeBtn) {
        const id = removeBtn.getAttribute("data-id");
        this.removeItem(id);
      }

      // 6. Apply Coupon
      if (e.target.closest("#btnApplyCoupon")) {
        const input = document.getElementById("cartCouponInput");
        if (input) this.applyCoupon(input.value);
      }

      // 7. Remove Coupon
      if (e.target.closest(".cart-coupon-remove-btn")) {
        this.removeCoupon();
      }

      // 8. Place Order via WhatsApp
      if (e.target.closest("#btnPlaceOrderWhatsApp")) {
        this.handlePlaceOrderWhatsApp();
      }

      // 9. Customizer Single-select chips
      const singleChip = e.target.closest("#grpSize .cust-chip, #grpQty .cust-chip, #grpSide .cust-chip, #grpMedia .cust-chip, #grpGsm .cust-chip, #grpLam .cust-chip, #grpBinding .cust-chip");
      if (singleChip) {
        const parent = singleChip.parentElement;
        parent.querySelectorAll(".cust-chip").forEach(c => c.classList.remove("active"));
        singleChip.classList.add("active");

        const val = singleChip.getAttribute("data-val");
        const isCustom = val.toLowerCase().includes("custom");

        // Sync typed input and custom box for that group
        const groupName = this.getGroupFromChipId(parent.id);
        if (groupName) {
          const wrapper = document.querySelector(`.cust-typed-select-box[data-group='${groupName}']`);
          if (wrapper) {
            const typedInput = wrapper.querySelector(".cust-typed-input");
            if (typedInput && !isCustom) typedInput.value = val;

            wrapper.querySelectorAll(".dropdown-item").forEach(i => {
              const iVal = i.getAttribute("data-val");
              i.classList.toggle("active", iVal === val || (isCustom && iVal.toLowerCase().includes("custom")));
            });

            const customBox = wrapper.querySelector(".cust-custom-input-box");
            if (customBox) {
              customBox.style.display = isCustom ? "block" : "none";
              if (isCustom) {
                const field = customBox.querySelector(".cust-custom-field");
                if (field) field.focus();
              }
            }
          }
        }

        // Sync QTY input if clicked on QTY preset chip
        if (parent.id === "grpQty") {
          const qtyInput = document.getElementById("custQtyInput");
          if (qtyInput) qtyInput.value = val;
        }

        this.updateCustomizerLiveCalculation();
      }

      // 10. Customizer Multi-select chips (Finishing)
      const multiChip = e.target.closest("#grpFinish .cust-chip-multi");
      if (multiChip) {
        multiChip.classList.toggle("active");
        this.updateCustomizerLiveCalculation();
      }

      // 11. Customizer QTY Stepper Plus/Minus
      if (e.target.closest("#btnQtyPlus")) {
        const input = document.getElementById("custQtyInput");
        if (input) {
          input.value = Math.max(1, (parseInt(input.value) || 0) + 50);
          this.updateCustomizerLiveCalculation();
        }
      }
      if (e.target.closest("#btnQtyMinus")) {
        const input = document.getElementById("custQtyInput");
        if (input) {
          input.value = Math.max(1, (parseInt(input.value) || 50) - 50);
          this.updateCustomizerLiveCalculation();
        }
      }

      // 12. Add Configured Product to Cart from Customizer
      if (e.target.closest("#btnAddCustomItemToCart")) {
        this.handleAddCustomProductToCart();
      }
    });

    // Enter key in Coupon input
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target && e.target.id === "cartCouponInput") {
        e.preventDefault();
        this.applyCoupon(e.target.value);
      }
    });

    // Handle Customer Info inputs change and customizer live typing
    document.addEventListener("input", (e) => {
      if (["custNameInput", "custPhoneInput", "custAddressInput", "custNotesInput"].includes(e.target.id)) {
        this.saveCustomer({
          name: document.getElementById("custNameInput")?.value.trim() || "",
          phone: document.getElementById("custPhoneInput")?.value.trim() || "",
          address: document.getElementById("custAddressInput")?.value.trim() || "",
          notes: document.getElementById("custNotesInput")?.value.trim() || ""
        });
      }

      if (e.target && e.target.id === "custQtyInput") {
        this.updateCustomizerLiveCalculation();
      }

      // Search / type filtering inside dropdowns
      if (e.target && e.target.classList.contains("cust-typed-input")) {
        const wrapper = e.target.closest(".cust-typed-select-box");
        const query = e.target.value.toLowerCase().trim();
        const ddList = wrapper?.querySelector(".cust-short-list");
        const customBox = wrapper?.querySelector(".cust-custom-input-box");

        if (ddList) {
          ddList.querySelectorAll(".dropdown-item").forEach(item => {
            const text = item.textContent.toLowerCase();
            const matches = !query || text.includes(query);
            item.parentElement.style.display = matches ? "block" : "none";
          });
        }

        const isCustom = query.includes("custom");
        if (customBox) {
          customBox.style.display = isCustom ? "block" : "none";
        }

        this.updateCustomizerLiveCalculation();
      }

      // Live update on typing in custom fields
      if (e.target && e.target.classList.contains("cust-custom-field")) {
        this.updateCustomizerLiveCalculation();
      }
    });
  }

  getChipGroupId(group) {
    switch (group) {
      case "size": return "grpSize";
      case "media": return "grpMedia";
      case "gsm": return "grpGsm";
      case "lam": return "grpLam";
      case "finish": return "grpFinish";
      default: return "";
    }
  }

  getGroupFromChipId(id) {
    switch (id) {
      case "grpSize": return "size";
      case "grpMedia": return "media";
      case "grpGsm": return "gsm";
      case "grpLam": return "lam";
      case "grpFinish": return "finish";
      default: return "";
    }
  }

  /**
   * Opens the dedicated Feature Customizer Modal for a product
   */
  openCustomizer(product) {
    this.activeCustomizerProduct = product;

    const titleEl = document.getElementById("custModalProductTitle");
    const badgeEl = document.getElementById("custModalProductBadge");
    const imgEl = document.getElementById("custModalProductImg");

    if (titleEl) titleEl.textContent = product.title;
    if (badgeEl) badgeEl.textContent = product.badge || "Precision Product";
    if (imgEl && product.img) imgEl.src = product.img;

    // Show/hide book binding section based on product type
    const bindingSection = document.getElementById("grpBindingSection");
    const sumBindingRow = document.getElementById("sumBindingRow");
    const isBook = product.category && (product.category.includes("business") || product.category.includes("book") || product.title.toLowerCase().includes("book") || product.title.toLowerCase().includes("diary") || product.title.toLowerCase().includes("brochure") || product.title.toLowerCase().includes("catalog"));
    
    if (bindingSection) bindingSection.style.display = isBook ? "block" : "none";
    if (sumBindingRow) sumBindingRow.style.display = isBook ? "flex" : "none";

    // Reset custom inputs and hide custom boxes on each open
    ["Size", "Media", "Gsm", "Lam", "Finish"].forEach(key => {
      const customField = document.getElementById(`custField${key}`);
      if (customField) customField.value = "";
      const box = document.getElementById(`boxCustom${key}`);
      if (box) box.style.display = "none";
    });

    // Set initial active state based on clicked pill if it matches quantity, size, or shape
    if (product.initialPill) {
      const pillText = product.initialPill.toLowerCase();
      // Match in QTY
      const numMatch = pillText.match(/\d+/);
      if (numMatch && (pillText.includes("pc") || pillText.includes("unit") || pillText.includes("copy") || pillText.includes("label"))) {
        const qtyVal = numMatch[0];
        const qtyInput = document.getElementById("custQtyInput");
        if (qtyInput) qtyInput.value = qtyVal;

        const qtyChips = document.querySelectorAll("#grpQty .cust-chip");
        qtyChips.forEach(chip => {
          chip.classList.toggle("active", chip.getAttribute("data-val") === qtyVal);
        });
      } else if (pillText.includes("a1") || pillText.includes("a2") || pillText.includes("a3") || pillText.includes("a4") || pillText.includes("13") || pillText.includes("12") || pillText.includes("card") || pillText.includes("size")) {
        const typedInputSize = document.getElementById("typedInputSize");
        if (typedInputSize) typedInputSize.value = product.initialPill;
      }
    }

    this.updateCustomizerLiveCalculation();

    // Show Modal
    const modalEl = document.getElementById("smcgCustomizerModal");
    if (modalEl && typeof bootstrap !== "undefined" && bootstrap.Modal) {
      const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
      bsModal.show();
    }
  }

  /**
   * Live computes the custom unit rate and grand total in the customizer modal
   */
  updateCustomizerLiveCalculation() {
    if (!this.activeCustomizerProduct) return;

    const basePrice = this.activeCustomizerProduct.basePrice || 3.5;
    const qtyInput = document.getElementById("custQtyInput");
    const qty = Math.max(1, parseInt(qtyInput?.value) || 100);

    // 1. Size Selection (Custom field, Typed input, or Active Chip)
    const customSizeVal = document.getElementById("custFieldSize")?.value.trim();
    const typedSizeVal = document.getElementById("typedInputSize")?.value.trim();
    const activeSizeChip = document.querySelector("#grpSize .cust-chip.active")?.getAttribute("data-val") || "13 x 19 in";
    let finalSize = activeSizeChip;
    if (customSizeVal) {
      finalSize = `${customSizeVal} (Custom Size)`;
    } else if (typedSizeVal && !typedSizeVal.toLowerCase().includes("custom")) {
      finalSize = typedSizeVal;
    }

    // 2. Printing Side
    const activeSideChip = document.querySelector("#grpSide .cust-chip.active");
    const activeSide = activeSideChip?.getAttribute("data-val") || "Single Sided (4+0)";
    const sideCost = parseFloat(activeSideChip?.getAttribute("data-cost")) || 0;

    // 3. Substrate / Media (Custom field, Typed input, or Active Chip)
    const customMediaVal = document.getElementById("custFieldMedia")?.value.trim();
    const typedMediaVal = document.getElementById("typedInputMedia")?.value.trim();
    const activeMediaChip = document.querySelector("#grpMedia .cust-chip.active");
    let activeMedia = activeMediaChip?.getAttribute("data-val") || "Imported Art Paper";
    let mediaCost = parseFloat(activeMediaChip?.getAttribute("data-cost")) || 0;
    if (customMediaVal) {
      activeMedia = `${customMediaVal} (Custom Media)`;
      mediaCost = 0.50;
    } else if (typedMediaVal && !typedMediaVal.toLowerCase().includes("custom")) {
      activeMedia = typedMediaVal;
    }

    // 4. GSM / Caliper (Custom field, Typed input, or Active Chip)
    const customGsmVal = document.getElementById("custFieldGsm")?.value.trim();
    const typedGsmVal = document.getElementById("typedInputGsm")?.value.trim();
    let activeGsm = document.querySelector("#grpGsm .cust-chip.active")?.getAttribute("data-val") || "300 GSM";
    if (customGsmVal) {
      activeGsm = `${customGsmVal} (Custom GSM)`;
    } else if (typedGsmVal && !typedGsmVal.toLowerCase().includes("custom")) {
      activeGsm = typedGsmVal;
    }

    // 5. Lamination (Custom field, Typed input, or Active Chip)
    const customLamVal = document.getElementById("custFieldLam")?.value.trim();
    const typedLamVal = document.getElementById("typedInputLam")?.value.trim();
    const activeLamChip = document.querySelector("#grpLam .cust-chip.active");
    let activeLam = activeLamChip?.getAttribute("data-val") || "Matte Thermal";
    let lamCost = parseFloat(activeLamChip?.getAttribute("data-cost")) || 0;
    if (customLamVal) {
      activeLam = `${customLamVal} (Custom Lam)`;
      lamCost = 0.35;
    } else if (typedLamVal && !typedLamVal.toLowerCase().includes("custom")) {
      activeLam = typedLamVal;
    }

    // 6. Finishing Effects (Multi-select Chips + Custom Finishing Field)
    let finishingCost = 0;
    const activeFinishArr = [];
    document.querySelectorAll("#grpFinish .cust-chip-multi.active").forEach(chip => {
      activeFinishArr.push(chip.getAttribute("data-val"));
      finishingCost += parseFloat(chip.getAttribute("data-cost")) || 0;
    });
    const customFinishVal = document.getElementById("custFieldFinish")?.value.trim();
    if (customFinishVal) {
      activeFinishArr.push(`${customFinishVal} (Custom)`);
      finishingCost += 0.35;
    }
    const finishStr = activeFinishArr.length > 0 ? activeFinishArr.join(", ") : "Standard Cut";

    // 7. Book Binding
    const activeBindingChip = document.querySelector("#grpBinding .cust-chip.active");
    const activeBinding = activeBindingChip?.getAttribute("data-val") || "None";
    const bindingCost = parseFloat(activeBindingChip?.getAttribute("data-cost")) || 0;

    // Unit Price Calculation
    let unitRate = basePrice + sideCost + mediaCost + lamCost + finishingCost + bindingCost;
    // Quantity scaling discount
    if (qty >= 1000) unitRate *= 0.88;
    else if (qty >= 500) unitRate *= 0.94;

    const totalEstimate = unitRate * qty;

    // Update Summary labels in preview card
    document.getElementById("sumSize").textContent = finalSize;
    document.getElementById("sumQty").textContent = `${qty} pcs`;
    document.getElementById("sumSide").textContent = activeSide;
    document.getElementById("sumMedia").textContent = activeMedia;
    document.getElementById("sumGsm").textContent = activeGsm;
    document.getElementById("sumLam").textContent = activeLam;
    document.getElementById("sumFinish").textContent = finishStr;
    const sumBindingEl = document.getElementById("sumBinding");
    if (sumBindingEl) sumBindingEl.textContent = activeBinding;

    // Update Rates
    const unitRateStr = unitRate < 10 ? `₹${unitRate.toFixed(2)}` : `₹${unitRate.toFixed(1)}`;
    const totalStr = `₹${totalEstimate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    document.getElementById("custModalUnitRate").textContent = `${unitRateStr} / ${this.activeCustomizerProduct.unit || 'pc'}`;
    document.getElementById("custModalGrandTotal").textContent = totalStr;

    // Store computed state on active product
    this.activeCustomizerProduct._calculatedUnitRate = unitRate;
    this.activeCustomizerProduct._calculatedQty = qty;
    this.activeCustomizerProduct._calculatedTotal = totalEstimate;
    this.activeCustomizerProduct._summaryVariant = `${finalSize} • ${qty} pcs • ${activeSide} • ${activeMedia} (${activeGsm}) • ${activeLam} • ${finishStr}${activeBinding !== 'None' ? ' • ' + activeBinding : ''}`;
  }

  /**
   * Adds the customized product from the modal to the cart
   */
  handleAddCustomProductToCart() {
    if (!this.activeCustomizerProduct) return;

    const p = this.activeCustomizerProduct;
    const unitRate = p._calculatedUnitRate || p.basePrice || 3.5;
    const qty = p._calculatedQty || 100;
    const variantStr = p._summaryVariant || "Custom Factory Specs";
    const customItemId = `${p.id}-CUSTOM-${Date.now()}`;
    const totalPrice = p._calculatedTotal || (unitRate * qty);

    this.addItem({
      id: customItemId,
      title: p.title,
      price: Math.round(totalPrice * 100) / 100,
      img: p.img,
      moq: `${qty} pcs`,
      variant: `${variantStr} [₹${unitRate.toFixed(2)}/pc]`,
      category: p.category,
      unit: `lot (${qty} pcs)`,
      quantity: 1
    });

    // Close Customizer Modal
    const modalEl = document.getElementById("smcgCustomizerModal");
    if (modalEl && typeof bootstrap !== "undefined" && bootstrap.Modal) {
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();
    }

    this.showToast(`Customized "${p.title}" added to order cart!`);

    // Optionally open the cart drawer to show customer the customized item
    const drawerEl = document.getElementById("smcgCartOffcanvas");
    if (drawerEl && typeof bootstrap !== "undefined" && bootstrap.Offcanvas) {
      const bsDrawer = bootstrap.Offcanvas.getOrCreateInstance(drawerEl);
      bsDrawer.show();
    }
  }

  /**
   * Opens the Order Placement Modal and syncs all customer info & item lists
   */
  openOrderModal() {
    if (this.items.length === 0) {
      alert("Your order cart is empty. Please add items before placing an order.");
      return;
    }

    // Pre-fill inputs with saved customer info
    const nameInput = document.getElementById("custNameInput");
    const phoneInput = document.getElementById("custPhoneInput");
    const addrInput = document.getElementById("custAddressInput");
    const notesInput = document.getElementById("custNotesInput");

    if (nameInput) nameInput.value = this.customer.name || "";
    if (phoneInput) phoneInput.value = this.customer.phone || "";
    if (addrInput) addrInput.value = this.customer.address || "";
    if (notesInput) notesInput.value = this.customer.notes || "";

    this.updateOrderModalSummary();

    const orderModalEl = document.getElementById("smcgOrderModal");
    if (orderModalEl && typeof bootstrap !== "undefined" && bootstrap.Modal) {
      const bsModal = bootstrap.Modal.getOrCreateInstance(orderModalEl);
      bsModal.show();
    }
  }

  /**
   * Updates order item list & totals in the Order Placement Modal
   */
  updateOrderModalSummary() {
    const listEl = document.getElementById("modalOrderItemsList");
    const countEl = document.getElementById("modalOrderCount");
    const subtotalEl = document.getElementById("modalSubtotal");
    const discountRow = document.getElementById("modalDiscountRow");
    const discountEl = document.getElementById("modalDiscount");
    const grandTotalEl = document.getElementById("modalGrandTotal");

    if (!listEl) return;

    let subtotal = 0;
    let html = "";

    this.items.forEach((item) => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;

      const rateStr = item.price < 10 ? `₹${item.price.toFixed(2)}` : `₹${item.price.toLocaleString("en-IN")}`;
      const totStr = lineTotal < 10 ? `₹${lineTotal.toFixed(2)}` : `₹${lineTotal.toLocaleString("en-IN")}`;

      html += `
        <div class="d-flex justify-content-between align-items-start py-2 border-bottom">
          <div class="pe-2">
            <strong class="d-block small text-dark">${item.title}</strong>
            <small class="text-muted d-block" style="font-size: 11px;">${item.variant || item.moq}</small>
            <span class="badge bg-secondary-subtle text-dark-emphasis" style="font-size: 10px;">${item.quantity} × ${rateStr}</span>
          </div>
          <strong class="text-accent small text-nowrap">${totStr}</strong>
        </div>
      `;
    });

    listEl.innerHTML = html;
    if (countEl) countEl.textContent = this.items.length;

    // Discount
    let discountAmount = 0;
    if (this.appliedCoupon) {
      const c = this.appliedCoupon;
      if (c.type === "percent") {
        discountAmount = (subtotal * c.value) / 100;
      } else if (c.type === "flat") {
        discountAmount = c.value;
      }
      discountAmount = Math.min(discountAmount, subtotal);
      discountAmount = Math.round(discountAmount * 100) / 100;
    }

    const grandTotal = Math.max(0, subtotal - discountAmount);

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    if (grandTotalEl) grandTotalEl.textContent = `₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    if (discountRow && discountEl) {
      if (discountAmount > 0 && this.appliedCoupon) {
        discountRow.style.display = "flex";
        discountEl.textContent = `- ₹${discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
      } else {
        discountRow.style.display = "none";
      }
    }
  }

  addItem(item) {
    const existingIndex = this.items.findIndex(
      (i) => i.id === item.id && i.variant === item.variant
    );

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += 1;
    } else {
      this.items.push(item);
    }

    this.saveCart();
  }

  changeQuantity(id, delta) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.removeItem(id);
      return;
    }
    this.saveCart();
  }

  removeItem(id) {
    this.items = this.items.filter((i) => i.id !== id);
    this.saveCart();
    this.updateOrderModalSummary();
  }

  clearCart() {
    this.items = [];
    this.saveCart();
    this.updateOrderModalSummary();
  }

  updateBadge() {
    const count = this.items.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById("cartBadgeCount");
    const headerCount = document.getElementById("cartHeaderCount");

    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    }

    if (headerCount) {
      headerCount.textContent = `${count} Item${count === 1 ? "" : "s"} selected`;
    }

    // Sync all navbar cart button badges (desktop + mobile)
    const allNavBadges = document.querySelectorAll(".nav-cart-badge, #navCartBadge");
    allNavBadges.forEach((nb) => {
      nb.textContent = count;
      nb.classList.toggle("has-items", count > 0);
      nb.style.display = count > 0 ? "inline-flex" : "none";
    });
  }

  renderDrawer() {
    const container = document.getElementById("cartItemsList");
    const subtotalEl = document.getElementById("cartSubtotal");
    const checkoutBlock = document.getElementById("cartCheckoutBlock");

    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty-state text-center py-5">
          <div class="empty-icon-wrap mb-3">
            <i class="bi bi-bag-x fs-1 text-muted"></i>
          </div>
          <h6 class="fw-bold mb-1">Your Order Cart is Empty</h6>
          <p class="text-muted small mb-4">Browse our manufactured print categories and add products with custom finishing.</p>
          <button type="button" class="btn btn-primary btn-sm px-4 rounded-pill" data-bs-dismiss="offcanvas">
            Explore All Categories
          </button>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = "₹0.00";
      if (checkoutBlock) checkoutBlock.style.display = "none";
      return;
    }

    if (checkoutBlock) checkoutBlock.style.display = "block";

    let subtotal = 0;
    let html = "";

    this.items.forEach((item) => {
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;

      const displayPrice = item.price < 10 
        ? `₹${item.price.toFixed(2)}` 
        : `₹${item.price.toLocaleString("en-IN")}`;

      const displaySubtotal = itemSubtotal < 10 
        ? `₹${itemSubtotal.toFixed(2)}` 
        : `₹${itemSubtotal.toLocaleString("en-IN")}`;

      html += `
        <div class="cart-item-card d-flex gap-3 align-items-center mb-3 pb-3 border-bottom">
          <div class="cart-item-thumb">
            <img src="${item.img || '../assets/images/products/custom-boxes.jpg'}" alt="${item.title}">
          </div>
          <div class="cart-item-info flex-grow-1 min-w-0">
            <div class="d-flex justify-content-between align-items-start">
              <h6 class="cart-item-title mb-0 text-truncate" title="${item.title}">${item.title}</h6>
              <button type="button" class="btn btn-link text-danger p-0 cart-remove-btn" data-id="${item.id}" title="Remove item">
                <i class="bi bi-trash"></i>
              </button>
            </div>
            <div class="cart-item-meta text-muted small mt-1">
              <span>${item.variant ? item.variant : item.moq}</span> • <span>${displayPrice} / ${item.unit || 'unit'}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <div class="cart-stepper d-flex align-items-center">
                <button type="button" class="cart-qty-btn" data-step="minus" data-id="${item.id}">-</button>
                <span class="cart-qty-num px-2 fw-bold">${item.quantity}</span>
                <button type="button" class="cart-qty-btn" data-step="plus" data-id="${item.id}">+</button>
              </div>
              <span class="fw-bold cart-item-total text-accent">${displaySubtotal}</span>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    const subtotalFormatted = subtotal < 10 
      ? `₹${subtotal.toFixed(2)}` 
      : `₹${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    if (subtotalEl) subtotalEl.textContent = subtotalFormatted;
  }

  generateInvoiceUrl(invoiceId, customer, items, grandTotal, couponData) {
    const prefix = this.getPathPrefix();
    const invoicePath = `${prefix}invoice.html`;

    const invoicePayload = {
      id: invoiceId,
      date: new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric"
      }),
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        notes: customer.notes || ""
      },
      items: items.map((i) => ({
        name: `${i.title} (${i.variant || i.moq})`,
        qty: i.quantity,
        rate: i.price,
        unit: i.unit || "unit",
        total: i.price * i.quantity
      })),
      coupon: couponData || null,
      grandTotal: grandTotal,
      gstin: "33AAHCS1234M1Z5",
      state: "Tamil Nadu (33)"
    };

    try {
      const jsonStr = JSON.stringify(invoicePayload);
      const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
      const origin = window.location.origin;
      const pathname = window.location.pathname.replace(/\/[^/]*$/, "/");
      return `${origin}${pathname}${invoicePath}?id=${invoiceId}&data=${encodeURIComponent(base64)}`;
    } catch (e) {
      console.warn("Could not encode invoice payload:", e);
      return `${window.location.origin}/pages/invoice.html?id=${invoiceId}`;
    }
  }

  generateStandaloneInvoiceHtml(invoiceId, customer, items, subtotal, discount, grandTotal, coupon) {
    const dateStr = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const rows = items.map((item, index) => {
      const lineTotal = item.price * item.quantity;
      const rateStr = item.price < 10 ? `₹${item.price.toFixed(2)}` : `₹${item.price.toLocaleString("en-IN")}`;
      const totStr = lineTotal < 10 ? `₹${lineTotal.toFixed(2)}` : `₹${lineTotal.toLocaleString("en-IN")}`;
      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">${index + 1}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">
            <strong style="color: #111827;">${item.title}</strong><br>
            <span style="color: #6b7280; font-size: 12px;">Specs: ${item.variant || item.moq}</span>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity} ${item.unit || "unit"}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${rateStr}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #111827;">${totStr}</td>
        </tr>
      `;
    }).join("");

    const discountRowHtml = (discount > 0 && coupon) ? `
      <tr>
        <td colspan="4" style="padding: 10px 12px; text-align: right; color: #15803d; font-weight: 600;">Coupon Discount (${coupon.code}):</td>
        <td style="padding: 10px 12px; text-align: right; color: #15803d; font-weight: bold;">- ₹${discount.toLocaleString("en-IN")}</td>
      </tr>
    ` : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Invoice #${invoiceId} - Sri Mahavishnu Colour Graphicz</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 30px; background: #f9fafb; color: #1f2937; }
    .invoice-card { max-width: 820px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 25px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111827; padding-bottom: 20px; margin-bottom: 25px; }
    .brand h1 { margin: 0 0 5px; font-size: 22px; color: #111827; }
    .brand p { margin: 0; font-size: 13px; color: #6b7280; }
    .inv-details { text-align: right; }
    .inv-details h2 { margin: 0 0 5px; font-size: 20px; color: #15803d; }
    .customer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f3f4f6; padding: 18px 24px; border-radius: 12px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    .items-table th { background: #111827; color: #ffffff; padding: 12px; font-size: 13px; text-align: left; }
    .grand-total-row td { background: #f0fdf4; font-size: 18px; font-weight: 800; color: #15803d; border-top: 2px solid #22c55e; }
    .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="brand">
        <h1>Sri Mahavishnu Colour Graphicz</h1>
        <p>1073/3 P.K.N. Road, Sivakasi - 626189 | GSTIN: 33AAHCS1234M1Z5</p>
        <p>Phone: +91 84382 83441 | colourgraphiczdesigner@gmail.com</p>
      </div>
      <div class="inv-details">
        <h2>TAX INVOICE</h2>
        <p><strong>Invoice No:</strong> ${invoiceId}</p>
        <p><strong>Date:</strong> ${dateStr}</p>
      </div>
    </div>
    <div class="customer-grid">
      <div>
        <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: bold;">Bill To:</p>
        <strong style="font-size: 15px; color: #111827;">${customer.name}</strong><br>
        <span style="font-size: 13px; color: #4b5563;">Phone: ${customer.phone}</span>
      </div>
      <div>
        <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: bold;">Delivery Address:</p>
        <span style="font-size: 13px; color: #4b5563;">${customer.address}</span>
      </div>
    </div>
    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align: center; width: 40px;">#</th>
          <th>Description &amp; Customized Specifications</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Rate</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr>
          <td colspan="4" style="padding: 12px; text-align: right; font-weight: 600; color: #4b5563;">Subtotal:</td>
          <td style="padding: 12px; text-align: right; font-weight: bold;">₹${subtotal.toLocaleString("en-IN")}</td>
        </tr>
        ${discountRowHtml}
        <tr class="grand-total-row">
          <td colspan="4" style="text-align: right;">Grand Total:</td>
          <td style="text-align: right; color: #15803d;">₹${grandTotal.toLocaleString("en-IN")}</td>
        </tr>
      </tbody>
    </table>
    <div class="footer">
      <p>Thank you for choosing Sri Mahavishnu Colour Graphicz Sivakasi. Direct factory support: +91 84382 83441</p>
    </div>
  </div>
</body>
</html>`;
  }

  downloadStandaloneInvoice(invoiceId, customer, items, subtotal, discount, grandTotal, coupon) {
    try {
      const htmlContent = this.generateStandaloneInvoiceHtml(invoiceId, customer, items, subtotal, discount, grandTotal, coupon);
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `Invoice-${invoiceId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      return true;
    } catch (err) {
      console.warn("Could not auto-download invoice file:", err);
      return false;
    }
  }

  handlePlaceOrderWhatsApp() {
    if (this.items.length === 0) {
      alert("Your cart is empty. Please add products before checking out.");
      return;
    }

    const name = document.getElementById("custNameInput")?.value.trim();
    const phone = document.getElementById("custPhoneInput")?.value.trim();
    const address = document.getElementById("custAddressInput")?.value.trim();
    const notes = document.getElementById("custNotesInput")?.value.trim() || "";

    if (!name || !phone || !address) {
      alert("Please enter your Full Name, WhatsApp Number, and Delivery Address to proceed.");
      if (!name) document.getElementById("custNameInput")?.focus();
      else if (!phone) document.getElementById("custPhoneInput")?.focus();
      else document.getElementById("custAddressInput")?.focus();
      return;
    }

    this.saveCustomer({ name, phone, address, notes });

    let subtotal = 0;
    const itemLines = this.items.map((item, index) => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;
      const rateStr = item.price < 10 ? `₹${item.price.toFixed(2)}` : `₹${item.price}`;
      const totStr = lineTotal < 10 ? `₹${lineTotal.toFixed(2)}` : `₹${lineTotal.toLocaleString("en-IN")}`;
      return `${index + 1}. *${item.title}*\n   • Specs: ${item.variant || item.moq}\n   • Qty: ${item.quantity} ${item.unit || "unit"} @ ${rateStr} = ${totStr}`;
    });

    let discountAmount = 0;
    if (this.appliedCoupon) {
      const c = this.appliedCoupon;
      if (c.type === "percent") {
        discountAmount = (subtotal * c.value) / 100;
      } else if (c.type === "flat") {
        discountAmount = c.value;
      }
      discountAmount = Math.min(discountAmount, subtotal);
      discountAmount = Math.round(discountAmount * 100) / 100;
    }

    const grandTotal = Math.max(0, subtotal - discountAmount);
    const invoiceId = `SMCG-${Date.now().toString().slice(-6)}`;

    // Generate Invoice link & download standalone file
    const invoiceUrl = this.generateInvoiceUrl(invoiceId, { name, phone, address }, this.items, grandTotal, this.appliedCoupon);
    this.downloadStandaloneInvoice(invoiceId, { name, phone, address }, this.items, subtotal, discountAmount, grandTotal, this.appliedCoupon);

    // Build WhatsApp message
    const msg = 
`*NEW PRINT ORDER - SRI MAHAVISHNU COLOUR GRAPHICZ*
----------------------------------------
*Invoice No:* #${invoiceId}
*Date:* ${new Date().toLocaleDateString("en-IN")}

*CUSTOMER DETAILS:*
• Name: ${name}
• Phone: ${phone}
• Address: ${address}${notes ? `\n• Notes: ${notes}` : ""}

*ORDER ITEMS & SPECIFICATIONS:*
${itemLines.join("\n")}

----------------------------------------
*Subtotal:* ₹${subtotal.toLocaleString("en-IN")}${discountAmount > 0 ? `\n*Coupon (${this.appliedCoupon.code}):* -₹${discountAmount.toLocaleString("en-IN")}` : ""}
*ESTIMATED TOTAL:* ₹${grandTotal.toLocaleString("en-IN")}

*DIGITAL INVOICE LINK:*
${invoiceUrl}

_Please confirm production schedule and dispatch details._`;

    const encodedMsg = encodeURIComponent(msg);
    const waUrl = `https://wa.me/${SMCG_WHATSAPP_NUMBER}?text=${encodedMsg}`;

    // Close Order Placement Modal
    const orderModalEl = document.getElementById("smcgOrderModal");
    if (orderModalEl && typeof bootstrap !== "undefined" && bootstrap.Modal) {
      const bsModal = bootstrap.Modal.getInstance(orderModalEl);
      if (bsModal) bsModal.hide();
    }

    // Launch WhatsApp
    window.open(waUrl, "_blank");

    this.showToast(`Order #${invoiceId} created! Opening WhatsApp...`);
    this.clearCart();
  }

  showToast(message) {
    let toast = document.getElementById("smcgCartToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "smcgCartToast";
      toast.className = "cart-toast-notification";
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="bi bi-check-circle-fill text-accent"></i> <span>${message}</span>`;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  }
}

// Global initialization
document.addEventListener("DOMContentLoaded", () => {
  window.smcgCart = new SMCGCart();
});
