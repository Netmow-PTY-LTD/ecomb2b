/**
 * RTE Food Wholesale B2B Demo Application - Buyer Portal Controller
 * Left Sidebar Navigation, Responsive Off-Canvas Drawer, Dashboard, Cart, Checkout, Orders, Quotes & Profile.
 */

const BuyerPortal = {
  currentTab: "dashboard",

  init() {
    this.checkAccess();
    this.parseTabFromUrl();
    this.bindSidebarNavigation();
    this.initMobileSidebar();
    this.updateSidebarInfo();
    this.renderCurrentTab();

    // Listen to cart and auth events
    window.addEventListener("rte_cart_changed", () => {
      this.updateSidebarInfo();
      if (this.currentTab === "cart") {
        this.renderCartTab();
      }
    });

    window.addEventListener("rte_auth_changed", () => {
      this.checkAccess();
      this.updateSidebarInfo();
      this.renderCurrentTab();
    });
  },

  checkAccess() {
    const session = AuthDemo.getSession();
    const guestNotice = document.getElementById("buyer-guest-notice");

    if (!session || session.role !== "buyer") {
      if (guestNotice) guestNotice.style.display = "block";
    } else {
      if (guestNotice) guestNotice.style.display = "none";
    }

    this.renderAccountStatusBanner();
  },

  updateSidebarInfo() {
    const session = AuthDemo.getSession();
    const buyer = session && session.buyerId ? StorageEngine.getBuyerById(session.buyerId) : null;

    const companyEl = document.getElementById("buyer-sidebar-company");
    const ssmEl = document.getElementById("buyer-sidebar-ssm");
    const statusEl = document.getElementById("buyer-sidebar-status");
    const creditEl = document.getElementById("buyer-sidebar-credit");
    const topbarStatusEl = document.getElementById("topbar-status-badge");
    const cartBadge = document.getElementById("sidebar-cart-badge");
    const topCartBadge = document.getElementById("topbar-cart-badge");
    const quotesBadge = document.getElementById("sidebar-quotes-badge");

    const cartCount = Cart.getItemCount();
    if (cartBadge) {
      cartBadge.textContent = cartCount;
      cartBadge.style.display = cartCount > 0 ? "inline-flex" : "none";
    }
    if (topCartBadge) {
      topCartBadge.textContent = cartCount;
      topCartBadge.style.display = cartCount > 0 ? "inline-flex" : "none";
    }

    const allQuotes = StorageEngine.getQuotes();
    const buyerId = session ? session.buyerId : null;
    const buyerQuotes = buyerId ? allQuotes.filter(q => q.buyerId === buyerId) : allQuotes;
    if (quotesBadge) {
      quotesBadge.textContent = buyerQuotes.length;
      quotesBadge.style.display = buyerQuotes.length > 0 ? "inline-flex" : "none";
    }

    if (buyer) {
      if (companyEl) companyEl.textContent = buyer.companyName;
      if (ssmEl) ssmEl.textContent = `SSM: ${buyer.ssmNumber || 'Verified'}`;

      const isApproved = buyer.status === "approved";
      if (statusEl) {
        statusEl.textContent = isApproved ? "Approved" : (buyer.status === "pending" ? "Pending" : "Rejected");
        statusEl.className = `status-badge ${isApproved ? 'status-delivered' : (buyer.status === 'pending' ? 'status-pending' : 'status-rejected')}`;
      }
      if (topbarStatusEl) {
        topbarStatusEl.textContent = isApproved ? "Approved Partner" : "Pending Verification";
        topbarStatusEl.className = `badge ${isApproved ? 'badge-success' : 'badge-warning'}`;
      }
      if (creditEl) {
        creditEl.innerHTML = `<i data-lucide="credit-card" class="icon-xs"></i> ${buyer.creditTerm || 'Net 30'} (${buyer.creditLimit ? App.formatCurrency(buyer.creditLimit) : 'Standard'})`;
      }
    } else if (session) {
      if (companyEl) companyEl.textContent = session.companyName || "B2B Guest Buyer";
      if (ssmEl) ssmEl.textContent = "Demo Session";
      if (statusEl) {
        statusEl.textContent = session.status === "approved" ? "Approved" : "Pending";
        statusEl.className = `status-badge ${session.status === 'approved' ? 'status-delivered' : 'status-pending'}`;
      }
    }

    App.initIcons();
  },

  parseTabFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("tab")) {
      const tab = params.get("tab");
      if (["dashboard", "cart", "orders", "quotes", "profile"].includes(tab)) {
        this.currentTab = tab;
      }
    }
  },

  bindSidebarNavigation() {
    const navItems = document.querySelectorAll(".buyer-nav-item");
    navItems.forEach(item => {
      item.addEventListener("click", (e) => {
        const tab = item.getAttribute("data-tab");
        if (tab) {
          e.preventDefault();
          this.switchTab(tab);
          // If on mobile, close sidebar automatically
          this.closeMobileSidebar();
        }
      });
    });
  },

  initMobileSidebar() {
    const toggleBtn = document.getElementById("buyer-sidebar-toggle");
    const closeBtn = document.getElementById("buyer-sidebar-close");
    const backdrop = document.getElementById("buyer-sidebar-backdrop");
    const sidebar = document.getElementById("buyer-sidebar");

    const openSidebar = () => {
      if (sidebar) sidebar.classList.add("open");
      if (backdrop) backdrop.classList.add("active");
      document.body.style.overflow = "hidden";
    };

    const closeSidebar = () => {
      if (sidebar) sidebar.classList.remove("open");
      if (backdrop) backdrop.classList.remove("active");
      document.body.style.overflow = "";
    };

    this.closeMobileSidebar = closeSidebar;

    if (toggleBtn) toggleBtn.addEventListener("click", openSidebar);
    if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
    if (backdrop) backdrop.addEventListener("click", closeSidebar);
  },

  switchTab(tab) {
    this.currentTab = tab;

    // Update active sidebar nav item
    document.querySelectorAll(".buyer-nav-item").forEach(item => {
      item.classList.toggle("active", item.getAttribute("data-tab") === tab);
    });

    // Update topbar header title
    const titleEl = document.getElementById("buyer-topbar-title");
    if (titleEl) {
      const titles = {
        dashboard: "Dashboard Overview",
        cart: "Wholesale Cart & Checkout",
        orders: "Purchase Order History",
        quotes: "Custom Volume Quotations",
        profile: "Commercial Business Profile"
      };
      titleEl.textContent = titles[tab] || "Buyer Portal";
    }

    // Update URL without full refresh
    const url = new URL(window.location);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url);

    this.renderCurrentTab();
  },

  renderAccountStatusBanner() {
    const banner = document.getElementById("buyer-status-banner");
    if (!banner) return;

    const session = AuthDemo.getSession();
    if (!session || session.role !== "buyer") {
      banner.innerHTML = `
        <div class="alert-box alert-info">
          <div class="alert-icon"><i data-lucide="info"></i></div>
          <div class="alert-content">
            <strong>Viewing as Guest Demo Mode:</strong> You can explore cart ordering and catalogue prices. To experience full corporate credit terms,
            <button class="btn btn-xs btn-primary ml-1" onclick="AuthDemo.loginAs('approved'); location.reload();">Switch to Approved Buyer (Sunway Bistro)</button> or
            <button class="btn btn-xs btn-outline ml-1" onclick="AuthDemo.loginAs('pending'); location.reload();">Switch to Pending Buyer (Melaka Kopitiam)</button>.
          </div>
        </div>
      `;
      App.initIcons();
      return;
    }

    if (session.status === "pending") {
      banner.innerHTML = `
        <div class="alert-box alert-warning">
          <div class="alert-icon"><i data-lucide="clock"></i></div>
          <div class="alert-content">
            <h4>B2B Account Verification in Progress</h4>
            <p>Your business application for <strong>${session.companyName}</strong> is pending review by our Supply Chain Admin. Credit terms and wholesale pricing are unlocked once verified.</p>
            <div class="alert-actions">
              <span class="status-pill status-pending">Pending Approval</span>
              <a href="admin.html?tab=buyers" class="btn btn-xs btn-primary">Switch to Admin to Approve this Account</a>
            </div>
          </div>
        </div>
      `;
    } else if (session.status === "rejected") {
      banner.innerHTML = `
        <div class="alert-box alert-danger">
          <div class="alert-icon"><i data-lucide="alert-octagon"></i></div>
          <div class="alert-content">
            <h4>Business Application Requires Updated SSM Documentation</h4>
            <p>Your account trade license verification failed or expired. Please update your profile or contact our wholesale desk via WhatsApp.</p>
          </div>
        </div>
      `;
    } else {
      // Approved
      banner.innerHTML = `
        <div class="account-verified-strip">
          <div class="verified-left">
            <span class="verified-badge"><i data-lucide="check-circle-2"></i> Verified B2B Partner</span>
            <span class="verified-company"><strong>${session.companyName}</strong></span>
          </div>
          <div class="verified-right">
            <span class="term-pill"><i data-lucide="credit-card"></i> ${session.creditTerm || 'Net 30 Days'}</span>
            <span class="credit-pill">Credit Line: ${session.creditLimit ? App.formatCurrency(session.creditLimit) : 'RM 25,000.00'}</span>
          </div>
        </div>
      `;
    }

    App.initIcons();
  },

  renderCurrentTab() {
    // Hide all view panes
    document.querySelectorAll(".portal-view-pane").forEach(pane => pane.style.display = "none");

    const targetPane = document.getElementById(`view-${this.currentTab}`);
    if (targetPane) {
      targetPane.style.display = "block";
    }

    switch (this.currentTab) {
      case "dashboard":
        this.renderDashboardTab();
        break;
      case "cart":
        this.renderCartTab();
        break;
      case "orders":
        this.renderOrdersTab();
        break;
      case "quotes":
        this.renderQuotesTab();
        break;
      case "profile":
        this.renderProfileTab();
        break;
    }

    App.initIcons();
  },

  // ===================== 1. DASHBOARD TAB =====================
  renderDashboardTab() {
    const session = AuthDemo.getSession();
    const buyerId = session ? session.buyerId : null;

    const allOrders = StorageEngine.getOrders();
    const buyerOrders = buyerId ? allOrders.filter(o => o.buyerId === buyerId) : allOrders.slice(0, 3);
    const pendingOrders = buyerOrders.filter(o => o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled");

    const allQuotes = StorageEngine.getQuotes();
    const buyerQuotes = buyerId ? allQuotes.filter(q => q.buyerId === buyerId) : allQuotes.slice(0, 2);

    // Metric counts
    const totalOrdersEl = document.getElementById("dash-total-orders");
    const pendingOrdersEl = document.getElementById("dash-pending-orders");
    const activeQuotesEl = document.getElementById("dash-active-quotes");
    const totalSpendEl = document.getElementById("dash-total-spend");

    const totalSpend = buyerOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    if (totalOrdersEl) totalOrdersEl.textContent = buyerOrders.length;
    if (pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders.length;
    if (activeQuotesEl) activeQuotesEl.textContent = buyerQuotes.length;
    if (totalSpendEl) totalSpendEl.textContent = App.formatCurrency(totalSpend);

    // Recent orders table
    const ordersTbody = document.getElementById("dash-recent-orders-tbody");
    if (ordersTbody) {
      if (buyerOrders.length === 0) {
        ordersTbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No wholesale orders recorded yet.</td></tr>`;
      } else {
        ordersTbody.innerHTML = buyerOrders.slice(0, 5).map(o => `
          <tr>
            <td><strong>${o.id}</strong></td>
            <td>${App.formatDate(o.createdAt)}</td>
            <td>${o.items ? o.items.length : 0} items</td>
            <td><strong>${App.formatCurrency(o.total)}</strong></td>
            <td><span class="status-badge status-${o.orderStatus.toLowerCase().replace(/[^a-z]/g, '-')}">${o.orderStatus}</span></td>
            <td>
              <div class="table-actions">
                <button class="btn btn-xs btn-outline" onclick="BuyerPortal.viewOrderDetail('${o.id}')">View</button>
                <button class="btn btn-xs btn-primary" onclick="BuyerPortal.reorderItems('${o.id}')">Reorder</button>
              </div>
            </td>
          </tr>
        `).join("");
      }
    }

    // Recommended RTE products grid for fast ordering
    const recGrid = document.getElementById("dash-recommended-products");
    if (recGrid) {
      const products = StorageEngine.getProducts().filter(p => p.featured || p.stock > 50).slice(0, 4);
      recGrid.innerHTML = products.map(p => `
        <div class="quick-reorder-card">
          <img src="${p.image}" alt="${p.name}" class="quick-img" onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80'">
          <div class="quick-info">
            <h5>${p.name}</h5>
            <div class="quick-meta">MOQ: ${p.moq} | <strong>${App.formatCurrency(p.price)}</strong>/${p.unit || 'pack'}</div>
            <button class="btn btn-xs btn-primary btn-block mt-2" onclick="ProductsController.quickAddToCart('${p.id}', ${p.moq})">
              + Add ${p.moq} to Cart
            </button>
          </div>
        </div>
      `).join("");
    }
  },

  // ===================== 2. CART & CHECKOUT TAB =====================
  renderCartTab() {
    const items = Cart.getItems();
    const summary = Cart.getCartSummary();
    const container = document.getElementById("cart-view-container");
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon"><i data-lucide="shopping-bag"></i></div>
          <h3>Your Wholesale Cart is Empty</h3>
          <p>Explore our wholesale food catalogue to add ready-to-eat meals, smoked meats, and central kitchen pastes.</p>
          <a href="products.html" class="btn btn-primary mt-3">Browse RTE Catalogue</a>
        </div>
      `;
      App.initIcons();
      return;
    }

    const freeDeliveryNotice = summary.remainingForFreeDelivery > 0
      ? `<div class="free-delivery-progress-box">
           <i data-lucide="truck" class="icon-sm"></i>
           <span>Add <strong>${App.formatCurrency(summary.remainingForFreeDelivery)}</strong> more to unlock <strong>Free Cold-Chain Logistics</strong> across Klang Valley & JB!</span>
         </div>`
      : `<div class="free-delivery-progress-box success">
           <i data-lucide="check-circle" class="icon-sm"></i>
           <span><strong>Free Cold-Chain Delivery Unlocked!</strong> Standard RM 50 freight fee waived.</span>
         </div>`;

    container.innerHTML = `
      <div class="cart-layout-grid">
        <!-- Cart Items List -->
        <div class="cart-items-column">
          <div class="cart-header-row">
            <h3>Wholesale Order Items (${items.length} products, ${summary.totalUnits} units)</h3>
            <button class="btn btn-sm btn-outline-danger" onclick="BuyerPortal.clearCartAction()">
              <i data-lucide="trash-2" class="icon-xs"></i> Clear Cart
            </button>
          </div>

          ${freeDeliveryNotice}

          <div class="table-responsive">
            <table class="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Wholesale Rate</th>
                  <th>Quantity & MOQ</th>
                  <th>Line Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => this.buildCartRowHtml(item)).join("")}
              </tbody>
            </table>
          </div>

          <div class="cart-b2b-tips">
            <i data-lucide="info" class="icon-xs"></i>
            <span>Tiered pricing is applied automatically based on total unit volume. Minimum Order Quantity (MOQ) per item is enforced to maintain commercial packaging integrity.</span>
          </div>
        </div>

        <!-- Checkout Summary & Submission Column -->
        <div class="checkout-summary-column">
          <div class="summary-card">
            <h3 class="summary-title">Order Summary</h3>

            <div class="summary-line">
              <span>Standard Catalogue Value</span>
              <span>${App.formatCurrency(summary.standardSubtotal)}</span>
            </div>

            ${summary.tieredSavings > 0 ? `
            <div class="summary-line text-success">
              <span><i data-lucide="sparkles" class="icon-xs"></i> Bulk Volume Savings</span>
              <span>-${App.formatCurrency(summary.tieredSavings)}</span>
            </div>
            ` : ''}

            <div class="summary-line">
              <span>Wholesale Subtotal</span>
              <strong class="text-primary">${App.formatCurrency(summary.subtotal)}</strong>
            </div>

            <div class="summary-line">
              <span>Refrigerated Freight (Cold-Truck)</span>
              <span>${summary.shippingFee === 0 ? '<span class="badge-success">FREE</span>' : App.formatCurrency(summary.shippingFee)}</span>
            </div>

            <div class="summary-line summary-total">
              <span>Total Payable</span>
              <span class="total-amount">${App.formatCurrency(summary.total)}</span>
            </div>

            ${!summary.isMinOrderMet ? `
            <div class="min-order-alert">
              <i data-lucide="alert-triangle" class="icon-xs"></i>
              Minimum wholesale order value is ${App.formatCurrency(summary.minOrderValue)}. Current deficit: ${App.formatCurrency(summary.minOrderValue - summary.subtotal)}.
            </div>
            ` : ''}

            <!-- Checkout Form -->
            <form id="wholesale-checkout-form" class="checkout-form mt-4">
              <h4 class="form-section-title"><i data-lucide="map-pin" class="icon-xs"></i> Cold-Chain Delivery Details</h4>

              <div class="form-group">
                <label for="chk-company">Company / Business Name *</label>
                <input type="text" id="chk-company" class="form-control" required placeholder="e.g. Sunway Bistro F&B Sdn Bhd">
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="chk-email">Work Email *</label>
                  <input type="email" id="chk-email" class="form-control" required placeholder="orders@company.my">
                </div>
                <div class="form-group">
                  <label for="chk-phone">Contact Number *</label>
                  <input type="tel" id="chk-phone" class="form-control" required placeholder="+60 12-491 8832">
                </div>
              </div>

              <div class="form-group">
                <label for="chk-address">Central Kitchen / Restaurant Delivery Address *</label>
                <textarea id="chk-address" class="form-control" rows="2" required placeholder="Full street address, building, loading bay notes..."></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="chk-delivery-date">Preferred Delivery Date *</label>
                  <input type="date" id="chk-delivery-date" class="form-control" required>
                  <small class="form-hint">Cold-truck schedule requires min 48-hr lead time.</small>
                </div>
                <div class="form-group">
                  <label for="chk-po-number">PO Number / Internal Ref (Optional)</label>
                  <input type="text" id="chk-po-number" class="form-control" placeholder="e.g. PO-2026-NOV-09">
                </div>
              </div>

              <h4 class="form-section-title mt-3"><i data-lucide="credit-card" class="icon-xs"></i> Commercial Payment Method</h4>
              <div class="payment-method-selector">
                <label class="payment-option">
                  <input type="radio" name="chk-payment" value="Net 30 Terms" checked>
                  <div class="option-content">
                    <strong>Commercial Credit Terms (Net 30 Days)</strong>
                    <span>For approved corporate accounts with active credit line.</span>
                  </div>
                </label>

                <label class="payment-option">
                  <input type="radio" name="chk-payment" value="Direct Bank Transfer (Instant DuitNow)">
                  <div class="option-content">
                    <strong>Direct Bank Transfer / DuitNow Corporate QR</strong>
                    <span>Instant order confirmation. Bank details generated on invoice.</span>
                  </div>
                </label>

                <label class="payment-option">
                  <input type="radio" name="chk-payment" value="Cheque upon Cold-Truck Delivery">
                  <div class="option-content">
                    <strong>Commercial Cheque upon Delivery (COD)</strong>
                    <span>Hand cheque to certified cold-chain driver on drop-off.</span>
                  </div>
                </label>
              </div>

              <div class="form-group mt-3">
                <label for="chk-notes">Cold-Chain Delivery Notes (Optional)</label>
                <input type="text" id="chk-notes" class="form-control" placeholder="e.g. Loading bay entrance B, delivery between 10am-2pm">
              </div>

              <button type="submit" class="btn btn-primary btn-lg btn-block mt-4" id="submit-order-btn" ${!summary.isMinOrderMet ? 'disabled' : ''}>
                <i data-lucide="check-circle-2"></i> Submit Wholesale Purchase Order (${App.formatCurrency(summary.total)})
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    App.initIcons();
    this.populateCheckoutForm();
    this.bindCheckoutEvents();
  },

  buildCartRowHtml(item) {
    const isTierApplied = item.unitPrice < item.basePrice;

    return `
      <tr class="cart-item-row" data-id="${item.productId}">
        <td>
          <div class="cart-product-cell">
            <img src="${item.image}" alt="${item.name}" class="cart-prod-thumb" onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80'">
            <div>
              <div class="cart-prod-name">${item.name}</div>
              <div class="cart-prod-sku">SKU: ${item.sku}</div>
              <div class="cart-moq-tag">MOQ: ${item.moq} ${item.unit || 'units'} | Stock: ${item.stock}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="cart-price-cell">
            <strong>${App.formatCurrency(item.unitPrice)}</strong>
            ${isTierApplied ? `<span class="tier-saved-badge">Tier Rate Applied</span>` : ''}
          </div>
        </td>
        <td>
          <div class="cart-qty-control">
            <button class="cart-qty-btn" onclick="BuyerPortal.changeCartQty('${item.productId}', ${item.quantity - 1})">-</button>
            <input type="number" class="cart-qty-input" value="${item.quantity}" min="${item.moq}" max="${item.stock}" onchange="BuyerPortal.changeCartQty('${item.productId}', this.value)">
            <button class="cart-qty-btn" onclick="BuyerPortal.changeCartQty('${item.productId}', ${item.quantity + 1})">+</button>
          </div>
        </td>
        <td>
          <strong class="cart-line-total">${App.formatCurrency(item.totalPrice)}</strong>
        </td>
        <td>
          <button class="cart-remove-btn" title="Remove" onclick="BuyerPortal.removeCartItem('${item.productId}')">
            <i data-lucide="trash" class="icon-xs"></i>
          </button>
        </td>
      </tr>
    `;
  },

  populateCheckoutForm() {
    const session = AuthDemo.getSession();
    const buyer = session && session.buyerId ? StorageEngine.getBuyerById(session.buyerId) : null;

    const companyInput = document.getElementById("chk-company");
    const emailInput = document.getElementById("chk-email");
    const phoneInput = document.getElementById("chk-phone");
    const addressInput = document.getElementById("chk-address");
    const dateInput = document.getElementById("chk-delivery-date");

    if (buyer) {
      if (companyInput) companyInput.value = buyer.companyName || "";
      if (emailInput) emailInput.value = buyer.email || "";
      if (phoneInput) phoneInput.value = buyer.phone || "";
      if (addressInput) addressInput.value = `${buyer.address || ''}, ${buyer.postcode || ''} ${buyer.state || ''}`.trim();
    } else if (session) {
      if (companyInput) companyInput.value = session.companyName || "";
      if (emailInput) emailInput.value = session.email || "";
    }

    // Set minimum delivery date to today + 2 days
    if (dateInput) {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 2);
      dateInput.min = minDate.toISOString().split("T")[0];
      dateInput.value = minDate.toISOString().split("T")[0];
    }
  },

  bindCheckoutEvents() {
    const form = document.getElementById("wholesale-checkout-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const paymentRadio = document.querySelector('input[name="chk-payment"]:checked');
      const checkoutData = {
        companyName: document.getElementById("chk-company").value.trim(),
        email: document.getElementById("chk-email").value.trim(),
        phone: document.getElementById("chk-phone").value.trim(),
        deliveryAddress: document.getElementById("chk-address").value.trim(),
        deliveryDate: document.getElementById("chk-delivery-date").value,
        poNumber: document.getElementById("chk-po-number").value.trim(),
        paymentMethod: paymentRadio ? paymentRadio.value : "Net 30 Terms",
        notes: document.getElementById("chk-notes").value.trim()
      };

      const res = Cart.checkout(checkoutData);
      if (res.success) {
        App.toast(res.message, "success", 5000);
        this.showOrderConfirmationModal(res.order);
        this.switchTab("orders");
      } else {
        App.toast(res.message, "error");
      }
    });
  },

  changeCartQty(productId, newQty) {
    const res = Cart.updateQuantity(productId, newQty);
    if (!res.success) {
      App.toast(res.message, "warning");
      this.renderCartTab();
    }
  },

  removeCartItem(productId) {
    Cart.removeItem(productId);
    App.toast("Product removed from wholesale cart.", "info");
    this.renderCartTab();
  },

  clearCartAction() {
    App.confirmModal({
      title: "Clear Wholesale Cart?",
      message: "Are you sure you want to remove all items from your current cart?",
      confirmText: "Clear Cart",
      onConfirm: () => {
        Cart.clearCart();
        App.toast("Cart cleared.", "info");
        this.renderCartTab();
      }
    });
  },

  showOrderConfirmationModal(order) {
    const existing = document.getElementById("order-success-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "order-success-modal";
    modal.className = "modal-overlay active";
    modal.innerHTML = `
      <div class="modal-card animate-pop-in">
        <div class="order-success-header text-center">
          <div class="success-icon-badge"><i data-lucide="check-circle-2"></i></div>
          <h3>Wholesale Order Confirmed!</h3>
          <p class="order-id-highlight">Order ID: <strong>${order.id}</strong></p>
          <span class="status-badge status-processing">Status: Pending Admin Fulfillment</span>
        </div>

        <div class="order-success-body">
          <div class="success-info-grid">
            <div>
              <span class="label">Bill To:</span>
              <strong>${order.buyerCompany}</strong>
            </div>
            <div>
              <span class="label">Cold-Chain Delivery Date:</span>
              <strong>${App.formatDate(order.deliveryDate)}</strong>
            </div>
            <div>
              <span class="label">Payment Terms:</span>
              <strong>${order.paymentMethod}</strong>
            </div>
            <div>
              <span class="label">Order Total:</span>
              <strong class="text-primary">${App.formatCurrency(order.total)}</strong>
            </div>
          </div>

          <div class="order-items-preview">
            <h5>Items in this Delivery (${order.items.length})</h5>
            <ul class="preview-item-list">
              ${order.items.map(i => `
                <li>
                  <span>${i.name} &times; ${i.quantity}</span>
                  <strong>${App.formatCurrency(i.total)}</strong>
                </li>
              `).join("")}
            </ul>
          </div>

          <div class="alert-box alert-info mt-3">
            <div class="alert-icon"><i data-lucide="truck"></i></div>
            <div class="alert-content">
              Your order has been logged into the Admin supply chain system. Temperature-controlled delivery will be coordinated with your receiving bay.
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('order-success-modal').remove()">Close</button>
          <a href="admin.html?tab=orders" class="btn btn-outline">View in Admin Console</a>
          <button class="btn btn-primary" onclick="BuyerPortal.printOrderInvoice('${order.id}')">
            <i data-lucide="printer" class="icon-xs"></i> Print Commercial Invoice
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    App.initIcons();
  },

  // ===================== 3. ORDERS TAB =====================
  renderOrdersTab() {
    const tbody = document.getElementById("orders-table-tbody");
    if (!tbody) return;

    const session = AuthDemo.getSession();
    const buyerId = session ? session.buyerId : null;
    const allOrders = StorageEngine.getOrders();
    const orders = buyerId ? allOrders.filter(o => o.buyerId === buyerId) : allOrders;

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">No wholesale orders found.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td>${App.formatDate(o.createdAt, true)}</td>
        <td>${App.formatDate(o.deliveryDate)}</td>
        <td>${o.items ? o.items.length : 0} items</td>
        <td><strong>${App.formatCurrency(o.total)}</strong></td>
        <td><span class="status-badge status-${o.orderStatus.toLowerCase().replace(/[^a-z]/g, '-')}">${o.orderStatus}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-xs btn-outline" onclick="BuyerPortal.viewOrderDetail('${o.id}')">View</button>
            <button class="btn btn-xs btn-primary" onclick="BuyerPortal.reorderItems('${o.id}')" title="Add all items to cart again">Reorder</button>
            <button class="btn btn-xs btn-secondary" onclick="BuyerPortal.printOrderInvoice('${o.id}')" title="Print Invoice"><i data-lucide="printer" class="icon-xs"></i></button>
          </div>
        </td>
      </tr>
    `).join("");

    App.initIcons();
  },

  viewOrderDetail(orderId) {
    const order = StorageEngine.getOrderById(orderId);
    if (!order) return;

    const existing = document.getElementById("order-detail-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "order-detail-modal";
    modal.className = "modal-overlay active";
    modal.innerHTML = `
      <div class="modal-card modal-lg animate-pop-in">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Wholesale Order ${order.id}</h3>
            <span class="text-muted" style="font-size:0.85rem;">Placed on ${App.formatDate(order.createdAt, true)}</span>
          </div>
          <button class="modal-close-btn" onclick="document.getElementById('order-detail-modal').remove()">&times;</button>
        </div>

        <div class="modal-body">
          <div class="order-detail-top-grid">
            <div class="detail-block">
              <h5>Customer & Delivery Info</h5>
              <p><strong>${order.buyerCompany}</strong><br>
              ${order.buyerEmail || ''} | ${order.buyerPhone || ''}<br>
              <strong>Delivery Address:</strong> ${order.deliveryAddress || '-'}<br>
              <strong>Scheduled Date:</strong> ${App.formatDate(order.deliveryDate)}</p>
            </div>
            <div class="detail-block">
              <h5>Fulfillment & Billing</h5>
              <p><strong>Order Status:</strong> <span class="status-badge status-${order.orderStatus.toLowerCase().replace(/[^a-z]/g, '-')}">${order.orderStatus}</span><br>
              <strong>Payment Method:</strong> ${order.paymentMethod}<br>
              <strong>Payment Status:</strong> ${order.paymentStatus || 'Pending'}<br>
              <strong>Notes:</strong> ${order.notes || 'None'}</p>
            </div>
          </div>

          <h5 class="mt-4">Itemized Breakdown</h5>
          <div class="table-responsive">
            <table class="detail-items-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${(order.items || []).map(i => `
                  <tr>
                    <td><strong>${i.name}</strong></td>
                    <td class="text-right">${App.formatCurrency(i.price)}</td>
                    <td class="text-center">${i.quantity}</td>
                    <td class="text-right"><strong>${App.formatCurrency(i.total)}</strong></td>
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="text-right">Subtotal:</td>
                  <td class="text-right"><strong>${App.formatCurrency(order.subtotal || order.total)}</strong></td>
                </tr>
                <tr>
                  <td colspan="3" class="text-right">Refrigerated Logistics:</td>
                  <td class="text-right">${order.shippingFee === 0 ? 'FREE' : App.formatCurrency(order.shippingFee || 0)}</td>
                </tr>
                <tr class="grand-total-row">
                  <td colspan="3" class="text-right">Grand Total (MYR):</td>
                  <td class="text-right"><strong>${App.formatCurrency(order.total)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('order-detail-modal').remove()">Close</button>
          <button class="btn btn-outline" onclick="BuyerPortal.printOrderInvoice('${order.id}')">
            <i data-lucide="printer" class="icon-xs"></i> Print Commercial Invoice
          </button>
          <button class="btn btn-primary" onclick="document.getElementById('order-detail-modal').remove(); BuyerPortal.reorderItems('${order.id}')">
            <i data-lucide="rotate-ccw" class="icon-xs"></i> Reorder All Items
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    App.initIcons();
  },

  reorderItems(orderId) {
    const order = StorageEngine.getOrderById(orderId);
    if (!order || !order.items) return;

    let addedCount = 0;
    order.items.forEach(item => {
      const res = Cart.addItem(item.productId, item.quantity);
      if (res.success) addedCount++;
    });

    App.toast(`Reordered items from ${order.id}. Added to your wholesale cart!`, "success");
    this.switchTab("cart");
  },

  printOrderInvoice(orderId) {
    if (!orderId) return;
    App.openInvoice(orderId);
  },

  // ===================== 4. QUOTATIONS TAB =====================
  renderQuotesTab() {
    const tbody = document.getElementById("quotes-table-tbody");
    if (!tbody) return;

    const session = AuthDemo.getSession();
    const buyerId = session ? session.buyerId : null;
    const allQuotes = StorageEngine.getQuotes();
    const quotes = buyerId ? allQuotes.filter(q => q.buyerId === buyerId) : allQuotes;

    if (quotes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">No quotation requests found. You can request custom bulk rates from product pages.</td></tr>`;
      return;
    }

    tbody.innerHTML = quotes.map(q => {
      let statusBadge = "";
      let actionBtn = "";

      if (q.status === "pending") {
        statusBadge = `<span class="status-badge status-pending">Pending Review</span>`;
        actionBtn = `<span class="text-muted" style="font-size:0.8rem;">Awaiting Admin Rate</span>`;
      } else if (q.status === "quoted") {
        statusBadge = `<span class="status-badge status-quoted">Quote Received!</span>`;
        actionBtn = `<button class="btn btn-xs btn-success" onclick="BuyerPortal.acceptQuoteModal('${q.id}')">Review & Accept</button>`;
      } else if (q.status === "accepted") {
        statusBadge = `<span class="status-badge status-delivered">Accepted</span>`;
        actionBtn = `<span class="text-success" style="font-size:0.8rem;">Ready for Order</span>`;
      } else if (q.status === "ordered") {
        statusBadge = `<span class="status-badge status-delivered">Converted to Order</span>`;
        actionBtn = `<span class="text-primary" style="font-size:0.8rem;">Order Active</span>`;
      }

      return `
        <tr>
          <td><strong>${q.id}</strong></td>
          <td>${App.formatDate(q.createdAt)}</td>
          <td><strong>${q.productName}</strong></td>
          <td>${q.requestedQty} units</td>
          <td>${q.quotedPricePerUnit ? `<strong>${App.formatCurrency(q.quotedPricePerUnit)}</strong> <small>(${App.formatCurrency(q.quotedTotal)})</small>` : '<span class="text-muted">-</span>'}</td>
          <td>${statusBadge}</td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join("");

    App.initIcons();
  },

  acceptQuoteModal(quoteId) {
    const quote = StorageEngine.getQuoteById(quoteId);
    if (!quote) return;

    const existing = document.getElementById("quote-accept-modal");
    if (existing) existing.remove();

    const session = AuthDemo.getSession();

    const modal = document.createElement("div");
    modal.id = "quote-accept-modal";
    modal.className = "modal-overlay active";
    modal.innerHTML = `
      <div class="modal-card animate-pop-in">
        <div class="modal-header">
          <h3 class="modal-title"><i data-lucide="tag" class="icon-sm"></i> Review & Accept Custom Quotation</h3>
          <button class="modal-close-btn" onclick="document.getElementById('quote-accept-modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="quote-offer-card">
            <h4>${quote.productName}</h4>
            <div class="offer-pricing-row">
              <div class="offer-rate">
                <span class="label">Approved Custom Rate:</span>
                <span class="rate-val">${App.formatCurrency(quote.quotedPricePerUnit)}</span>
                <span class="unit">/ unit</span>
              </div>
              <div class="offer-total">
                <span class="label">Contract Order Total:</span>
                <span class="total-val">${App.formatCurrency(quote.quotedTotal)}</span>
              </div>
            </div>
            <p class="validity-note">Valid until: <strong>${App.formatDate(quote.validUntil)}</strong></p>
            ${quote.adminRemarks ? `<div class="admin-remarks-box"><strong>Admin Note:</strong> ${quote.adminRemarks}</div>` : ''}
          </div>

          <form id="quote-convert-order-form" class="mt-3">
            <div class="form-group">
              <label for="q-order-date">Preferred Delivery Date *</label>
              <input type="date" id="q-order-date" class="form-control" required>
            </div>
            <div class="form-group">
              <label for="q-order-address">Delivery Address *</label>
              <textarea id="q-order-address" class="form-control" rows="2" required>${session ? session.address || 'Registered B2B Facility Address' : ''}</textarea>
            </div>
            <div class="form-group">
              <label for="q-order-terms">Billing Terms</label>
              <select id="q-order-terms" class="form-control">
                <option value="Net 30 Terms">Net 30 Commercial Credit Terms</option>
                <option value="Direct Bank Transfer (Instant DuitNow)">Direct Bank Transfer / DuitNow</option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('quote-accept-modal').remove()">Cancel</button>
              <button type="submit" class="btn btn-success">
                <i data-lucide="check" class="icon-xs"></i> Accept & Convert to Order Now
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    App.initIcons();

    const dateInput = document.getElementById("q-order-date");
    if (dateInput) {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 3);
      dateInput.min = minDate.toISOString().split("T")[0];
      dateInput.value = minDate.toISOString().split("T")[0];
    }

    document.getElementById("quote-convert-order-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const deliveryDate = document.getElementById("q-order-date").value;
      const deliveryAddress = document.getElementById("q-order-address").value;
      const terms = document.getElementById("q-order-terms").value;

      const createdOrder = StorageEngine.convertQuoteToOrder(quoteId, deliveryDate, deliveryAddress, terms);
      modal.remove();

      if (createdOrder) {
        App.toast(`Quotation ${quoteId} accepted and converted to Order ${createdOrder.id}!`, "success", 5000);
        this.switchTab("orders");
      } else {
        App.toast("Failed to convert quote. Please try again.", "error");
      }
    });
  },

  // ===================== 5. PROFILE TAB =====================
  renderProfileTab() {
    const session = AuthDemo.getSession();
    const buyer = session && session.buyerId ? StorageEngine.getBuyerById(session.buyerId) : null;

    const companyInput = document.getElementById("prof-company");
    const ssmInput = document.getElementById("prof-ssm");
    const picInput = document.getElementById("prof-pic");
    const phoneInput = document.getElementById("prof-phone");
    const emailInput = document.getElementById("prof-email");
    const typeSelect = document.getElementById("prof-type");
    const addressInput = document.getElementById("prof-address");
    const stateSelect = document.getElementById("prof-state");
    const postcodeInput = document.getElementById("prof-postcode");

    if (buyer) {
      if (companyInput) companyInput.value = buyer.companyName || "";
      if (ssmInput) ssmInput.value = buyer.ssmNumber || "";
      if (picInput) picInput.value = buyer.contactPerson || "";
      if (phoneInput) phoneInput.value = buyer.phone || "";
      if (emailInput) emailInput.value = buyer.email || "";
      if (typeSelect) typeSelect.value = buyer.businessType || "Restaurant / Cafe Chain";
      if (addressInput) addressInput.value = buyer.address || "";
      if (stateSelect) stateSelect.value = buyer.state || "Selangor";
      if (postcodeInput) postcodeInput.value = buyer.postcode || "";
    }

    const form = document.getElementById("buyer-profile-form");
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        if (!buyer) {
          App.toast("Please log in as a registered buyer to save profile.", "warning");
          return;
        }

        buyer.companyName = companyInput.value.trim();
        buyer.ssmNumber = ssmInput.value.trim();
        buyer.contactPerson = picInput.value.trim();
        buyer.phone = phoneInput.value.trim();
        buyer.businessType = typeSelect.value;
        buyer.address = addressInput.value.trim();
        buyer.state = stateSelect.value;
        buyer.postcode = postcodeInput.value.trim();

        StorageEngine.saveBuyer(buyer);
        this.updateSidebarInfo();
        App.toast("Company business profile updated successfully!", "success");
      };
    }
  }
};
