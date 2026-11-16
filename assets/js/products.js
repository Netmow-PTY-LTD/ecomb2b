/**
 * RTE Food Wholesale B2B Demo Application - Products Controller
 * Catalogue filtering, search, sorting, tiered pricing, and single product view.
 */

const ProductsController = {
  // Current filters state
  state: {
    search: "",
    category: "all",
    sort: "featured",
    inStockOnly: false
  },

  // Initialize Catalogue Page (products.html)
  initCatalogue() {
    this.parseUrlParams();
    this.renderCategoryPills();
    this.bindCatalogueEvents();
    this.renderCatalogueGrid();
  },

  parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("cat")) {
      this.state.category = params.get("cat");
    }
    if (params.has("search")) {
      this.state.search = params.get("search");
    }
  },

  renderCategoryPills() {
    const container = document.getElementById("category-pills-container");
    if (!container) return;

    const categories = StorageEngine.getCategories();
    const allProducts = StorageEngine.getProducts();

    let pillsHtml = `
      <button class="filter-pill ${this.state.category === 'all' ? 'active' : ''}" data-cat="all">
        All Products <span class="pill-count">(${allProducts.length})</span>
      </button>
    `;

    categories.forEach(cat => {
      const count = allProducts.filter(p => p.category === cat.id && p.status !== 'inactive').length;
      pillsHtml += `
        <button class="filter-pill ${this.state.category === cat.id ? 'active' : ''}" data-cat="${cat.id}">
          ${cat.name} <span class="pill-count">(${count})</span>
        </button>
      `;
    });

    container.innerHTML = pillsHtml;

    container.querySelectorAll(".filter-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".filter-pill").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.state.category = btn.getAttribute("data-cat");
        this.renderCatalogueGrid();
      });
    });
  },

  bindCatalogueEvents() {
    const searchInput = document.getElementById("product-search-input");
    if (searchInput) {
      if (this.state.search) searchInput.value = this.state.search;
      searchInput.addEventListener("input", (e) => {
        this.state.search = e.target.value.trim().toLowerCase();
        this.renderCatalogueGrid();
      });
    }

    const sortSelect = document.getElementById("product-sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this.state.sort = e.target.value;
        this.renderCatalogueGrid();
      });
    }

    const stockCheckbox = document.getElementById("filter-in-stock");
    if (stockCheckbox) {
      stockCheckbox.addEventListener("change", (e) => {
        this.state.inStockOnly = e.target.checked;
        this.renderCatalogueGrid();
      });
    }
  },

  getFilteredProducts() {
    let list = StorageEngine.getProducts().filter(p => p.status !== "inactive");

    // Category filter
    if (this.state.category && this.state.category !== "all") {
      list = list.filter(p => p.category === this.state.category);
    }

    // Search query
    if (this.state.search) {
      const query = this.state.search.toLowerCase();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.packaging && p.packaging.toLowerCase().includes(query))
      );
    }

    // In stock only
    if (this.state.inStockOnly) {
      list = list.filter(p => p.stock > 0);
    }

    // Sorting
    switch (this.state.sort) {
      case "price-low":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        list.sort((a, b) => b.price - a.price);
        break;
      case "name-az":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "stock-high":
        list.sort((a, b) => b.stock - a.stock);
        break;
      case "featured":
      default:
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return list;
  },

  renderCatalogueGrid() {
    const grid = document.getElementById("product-catalogue-grid");
    const countDisplay = document.getElementById("catalogue-result-count");
    if (!grid) return;

    const products = this.getFilteredProducts();

    if (countDisplay) {
      countDisplay.textContent = `Showing ${products.length} wholesale products`;
    }

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="empty-state-box col-span-full">
          <div class="empty-icon"><i data-lucide="package-search"></i></div>
          <h3>No wholesale products found</h3>
          <p>Try clearing your search query or choosing a different category.</p>
          <button class="btn btn-primary btn-sm" onclick="ProductsController.resetFilters()">Clear Filters</button>
        </div>
      `;
      App.initIcons();
      return;
    }

    grid.innerHTML = products.map(prod => this.buildProductCardHtml(prod)).join("");
    App.initIcons();
  },

  resetFilters() {
    this.state.search = "";
    this.state.category = "all";
    this.state.inStockOnly = false;
    const searchInput = document.getElementById("product-search-input");
    if (searchInput) searchInput.value = "";
    this.renderCategoryPills();
    this.renderCatalogueGrid();
  },

  buildProductCardHtml(product) {
    const categories = StorageEngine.getCategories();
    const cat = categories.find(c => c.id === product.category);
    const catName = cat ? cat.name : "Ready-to-Eat";

    // Clean, short unit for card display (e.g. "box" instead of "box (50 skewers + 500g sauce)")
    let shortUnit = "pack";
    if (product.unit) {
      if (product.unit.includes("(")) {
        shortUnit = product.unit.split("(")[0].trim().toLowerCase();
      } else {
        shortUnit = product.unit.split(" ")[0].trim().toLowerCase();
      }
      if (shortUnit.includes("/")) shortUnit = shortUnit.split("/")[0];
    }
    const pluralUnit = (product.moq > 1 && !shortUnit.endsWith("s")) ? `${shortUnit}s` : shortUnit;

    // Clean shelf life (e.g. "18 Months" or "12 Months")
    const shelfMatch = (product.shelfLife || "").match(/\d+\s*(?:Months|Month|Mo)/i);
    const cleanShelf = shelfMatch ? shelfMatch[0] : "12 Months";

    let stockBadgeClass = "stock-good";
    let stockBadgeText = `In Stock (${product.stock})`;

    if (product.stock <= 0) {
      stockBadgeClass = "stock-out";
      stockBadgeText = "Out of Stock";
    } else if (product.stock <= (product.lowStockThreshold || 20)) {
      stockBadgeClass = "stock-low";
      stockBadgeText = `Low Stock (${product.stock})`;
    }

    // Tier pricing snippet
    let tierSnippet = "";
    if (product.tier1Qty && product.tier1Price) {
      tierSnippet = `<div class="card-tier-pill">Bulk ${product.tier1Qty}+ units: <strong>${App.formatCurrency(product.tier1Price)}</strong></div>`;
    }

    return `
      <div class="product-card">
        <div class="product-card-img-wrap">
          <a href="product.html?id=${product.id}">
            <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'">
          </a>
          ${product.featured ? '<span class="badge-featured">Bestseller</span>' : ''}
          <span class="stock-status-tag ${stockBadgeClass}">${stockBadgeText}</span>
        </div>

        <div class="product-card-content">
          <div class="product-cat-tag">${catName}</div>
          <h3 class="product-name">
            <a href="product.html?id=${product.id}">${product.name}</a>
          </h3>
          <div class="product-sku">SKU: ${product.sku}</div>
          <p class="product-desc-snippet">${product.description ? product.description.substring(0, 85) + '...' : ''}</p>

          <div class="product-specs-mini">
            <span class="spec-moq-badge"><i data-lucide="package" class="icon-xs"></i> MOQ: <strong>${product.moq} ${pluralUnit}</strong></span>
            <span class="spec-shelf-badge"><i data-lucide="clock" class="icon-xs"></i> <strong>${cleanShelf}</strong></span>
          </div>

          ${tierSnippet}

          <div class="product-card-footer">
            <div class="price-box">
              <span class="price-label">Wholesale Price</span>
              <span class="price-amount">${App.formatCurrency(product.price)}</span>
              <span class="price-unit">/${shortUnit}</span>
            </div>

            <div class="card-action-btns">
              <a href="product.html?id=${product.id}" class="btn btn-outline btn-sm" title="View Specifications">Details</a>
              <button class="btn btn-primary btn-sm" onclick="ProductsController.quickAddToCart('${product.id}', ${product.moq})" ${product.stock <= 0 ? 'disabled' : ''}>
                <i data-lucide="plus" class="icon-xs"></i> Add
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // Quick Add To Cart from Card
  quickAddToCart(productId, moq) {
    const res = Cart.addItem(productId, moq);
    if (res.success) {
      App.toast(res.message, "success");
    } else {
      App.toast(res.message, "warning");
    }
  },

  // ===================== SINGLE PRODUCT PAGE (product.html) =====================
  initProductDetails() {
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get("id");
    const products = StorageEngine.getProducts();

    let product = products.find(p => p.id === prodId);
    if (!product && products.length > 0) {
      product = products[0]; // Fallback to first product
    }

    if (!product) {
      const container = document.getElementById("product-detail-container");
      if (container) {
        container.innerHTML = `
          <div class="empty-state-box">
            <h3>Product not found</h3>
            <a href="products.html" class="btn btn-primary">Return to Catalogue</a>
          </div>
        `;
      }
      return;
    }

    this.renderProductDetailsView(product);
  },

  renderProductDetailsView(product) {
    const container = document.getElementById("product-detail-container");
    if (!container) return;

    const categories = StorageEngine.getCategories();
    const cat = categories.find(c => c.id === product.category);
    const catName = cat ? cat.name : "Ready-to-Eat Wholesale";

    // Build Tier Table HTML
    let tierTableHtml = `
      <div class="tier-pricing-table-wrapper">
        <h4 class="tier-table-title"><i data-lucide="trending-down" class="icon-sm"></i> Volume Wholesale Pricing Tiers</h4>
        <table class="tier-table">
          <thead>
            <tr>
              <th>Order Volume</th>
              <th>Unit Wholesale Price</th>
              <th>Discount</th>
            </tr>
          </thead>
          <tbody>
            <tr class="active-tier" id="tier-row-base">
              <td>Standard (${product.moq} – ${(product.tier1Qty ? product.tier1Qty - 1 : '99')} units)</td>
              <td><strong>${App.formatCurrency(product.price)}</strong></td>
              <td>Base Wholesale</td>
            </tr>
            ${product.tier1Qty ? `
            <tr id="tier-row-1">
              <td>Tier 1 Bulk (${product.tier1Qty} – ${(product.tier2Qty ? product.tier2Qty - 1 : '+')} units)</td>
              <td><strong>${App.formatCurrency(product.tier1Price)}</strong></td>
              <td><span class="save-tag">Save ${(100 - (product.tier1Price / product.price * 100)).toFixed(0)}%</span></td>
            </tr>
            ` : ''}
            ${product.tier2Qty ? `
            <tr id="tier-row-2">
              <td>Tier 2 Master Case (${product.tier2Qty}+ units)</td>
              <td><strong>${App.formatCurrency(product.tier2Price)}</strong></td>
              <td><span class="save-tag highlight">Save ${(100 - (product.tier2Price / product.price * 100)).toFixed(0)}%</span></td>
            </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = `
      <!-- Breadcrumb -->
      <nav class="breadcrumb-nav">
        <a href="index.html">Home</a> &rsaquo;
        <a href="products.html">Catalogue</a> &rsaquo;
        <a href="products.html?cat=${product.category}">${catName}</a> &rsaquo;
        <span>${product.name}</span>
      </nav>

      <div class="product-detail-grid">
        <!-- Gallery Column -->
        <div class="product-gallery-col">
          <div class="main-image-display">
            <img src="${product.image}" id="product-main-img" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80'">
            ${product.featured ? '<span class="badge-featured-large">Commercial Bestseller</span>' : ''}
          </div>
          <div class="quality-badges-row">
            <div class="q-badge"><i data-lucide="shield-check"></i> Halal Facility</div>
            <div class="q-badge"><i data-lucide="snowflake"></i> Cold-Chain Integrity</div>
            <div class="q-badge"><i data-lucide="clock"></i> Zero Wastage Prep</div>
          </div>
        </div>

        <!-- Info & Order Form Column -->
        <div class="product-info-col">
          <div class="product-cat-label">${catName}</div>
          <h1 class="product-title-large">${product.name}</h1>
          <div class="product-meta-strip">
            <span class="meta-item">SKU: <strong>${product.sku}</strong></span>
            <span class="meta-item">Pack Format: <strong>${product.packaging || 'Retort Heavy Pouch'}</strong></span>
            <span class="meta-item">Stock: <strong>${product.stock > 0 ? product.stock + ' ' + (product.unit || 'units') : '<span class="text-danger">Out of Stock</span>'}</strong></span>
          </div>

          <div class="product-pricing-hero">
            <div class="price-display">
              <span class="currency-label">RM</span>
              <span class="computed-price" id="live-unit-price">${product.price.toFixed(2)}</span>
              <span class="unit-text">/${product.unit || 'pack'}</span>
            </div>
            <div class="moq-callout">
              <i data-lucide="alert-circle" class="icon-xs"></i> Minimum Order Quantity (MOQ): <strong>${product.moq} ${product.unit || 'units'}</strong>
            </div>
          </div>

          <p class="product-description-full">${product.description}</p>

          ${tierTableHtml}

          <!-- Order Calculator Box -->
          <div class="wholesale-order-calculator">
            <div class="calc-header">
              <label for="detail-qty-input">Select Wholesale Order Quantity:</label>
              <span class="tier-indicator-badge" id="active-tier-badge">Standard Rate</span>
            </div>
            <div class="qty-control-row">
              <div class="qty-input-group">
                <button type="button" class="qty-btn" id="qty-minus-btn">-</button>
                <input type="number" id="detail-qty-input" value="${product.moq}" min="${product.moq}" max="${product.stock}" step="1">
                <button type="button" class="qty-btn" id="qty-plus-btn">+</button>
              </div>
              <div class="calc-subtotal-display">
                <span class="subtotal-label">Estimated Line Subtotal:</span>
                <span class="subtotal-val" id="computed-subtotal">${App.formatCurrency(product.price * product.moq)}</span>
              </div>
            </div>

            <div class="order-action-buttons">
              <button class="btn btn-primary btn-lg btn-block" id="detail-add-to-cart-btn" ${product.stock <= 0 ? 'disabled' : ''}>
                <i data-lucide="shopping-cart"></i> Add to Wholesale Cart
              </button>
              <button class="btn btn-outline btn-lg btn-block" id="detail-request-quote-btn">
                <i data-lucide="file-text"></i> Request High-Volume Custom Quote (500+ Units)
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Technical Specifications Tabbed / Detailed Section -->
      <div class="product-specifications-section">
        <h3 class="section-title"><i data-lucide="clipboard-list" class="icon-sm"></i> Commercial Foodservice Specifications</h3>
        <div class="specs-grid">
          <div class="spec-card">
            <h4><i data-lucide="soup"></i> Ingredients & Composition</h4>
            <p>${product.ingredients || 'Prime Halal meat cuts, authentic spice blend, shallots, garlic, chili, cooking oil, seasonings.'}</p>
          </div>
          <div class="spec-card">
            <h4><i data-lucide="alert-triangle"></i> Allergen Information</h4>
            <p>${product.allergens || 'None. Processed in an audited Halal central kitchen adhering to GMP standards.'}</p>
          </div>
          <div class="spec-card">
            <h4><i data-lucide="thermometer"></i> Storage & Shelf Life</h4>
            <p><strong>Shelf Life:</strong> ${product.shelfLife || '12 Months'}<br>Store according to package specification. Do not refreeze once thawed.</p>
          </div>
          <div class="spec-card">
            <h4><i data-lucide="flame"></i> Preparation & Reconstitution</h4>
            <p>${product.prepTime || 'Boil in bag: 8 minutes. Microwave (cut pouch corner): 3 minutes on high. Combi steam: 10 minutes at 100°C.'}</p>
          </div>
        </div>
      </div>
    `;

    App.initIcons();
    this.bindDetailEvents(product);
  },

  bindDetailEvents(product) {
    const qtyInput = document.getElementById("detail-qty-input");
    const minusBtn = document.getElementById("qty-minus-btn");
    const plusBtn = document.getElementById("qty-plus-btn");
    const livePriceEl = document.getElementById("live-unit-price");
    const subtotalEl = document.getElementById("computed-subtotal");
    const tierBadge = document.getElementById("active-tier-badge");
    const addBtn = document.getElementById("detail-add-to-cart-btn");
    const quoteBtn = document.getElementById("detail-request-quote-btn");

    const updateCalculations = () => {
      let qty = parseInt(qtyInput.value) || product.moq;
      if (qty < product.moq) qty = product.moq;
      if (qty > product.stock && product.stock > 0) qty = product.stock;
      qtyInput.value = qty;

      const unitPrice = StorageEngine.calculateProductPrice(product, qty);
      const lineSubtotal = unitPrice * qty;

      livePriceEl.textContent = unitPrice.toFixed(2);
      subtotalEl.textContent = App.formatCurrency(lineSubtotal);

      // Highlight active table row
      document.querySelectorAll(".tier-table tbody tr").forEach(tr => tr.classList.remove("active-tier"));
      if (product.tier2Qty && qty >= product.tier2Qty) {
        tierBadge.textContent = "Tier 2 Master Case Rate Applied";
        tierBadge.className = "tier-indicator-badge tier-2";
        const row = document.getElementById("tier-row-2");
        if (row) row.classList.add("active-tier");
      } else if (product.tier1Qty && qty >= product.tier1Qty) {
        tierBadge.textContent = "Tier 1 Bulk Rate Applied";
        tierBadge.className = "tier-indicator-badge tier-1";
        const row = document.getElementById("tier-row-1");
        if (row) row.classList.add("active-tier");
      } else {
        tierBadge.textContent = "Standard Wholesale Rate";
        tierBadge.className = "tier-indicator-badge";
        const row = document.getElementById("tier-row-base");
        if (row) row.classList.add("active-tier");
      }
    };

    if (qtyInput) {
      qtyInput.addEventListener("input", updateCalculations);
      qtyInput.addEventListener("change", updateCalculations);
    }

    if (minusBtn) {
      minusBtn.addEventListener("click", () => {
        let current = parseInt(qtyInput.value) || product.moq;
        if (current > product.moq) {
          qtyInput.value = current - 1;
          updateCalculations();
        }
      });
    }

    if (plusBtn) {
      plusBtn.addEventListener("click", () => {
        let current = parseInt(qtyInput.value) || product.moq;
        if (current < product.stock) {
          qtyInput.value = current + 1;
          updateCalculations();
        }
      });
    }

    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const qty = parseInt(qtyInput.value) || product.moq;
        const res = Cart.addItem(product.id, qty);
        if (res.success) {
          App.toast(`Added ${qty} ${product.unit || 'units'} of ${product.name} to wholesale cart!`, "success");
        } else {
          App.toast(res.message, "warning");
        }
      });
    }

    if (quoteBtn) {
      quoteBtn.addEventListener("click", () => {
        this.openQuoteModal(product);
      });
    }

    updateCalculations();
  },

  // Open custom quotation request modal for this product
  openQuoteModal(product) {
    const session = AuthDemo.getSession();

    const existing = document.getElementById("product-quote-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "product-quote-modal";
    modal.className = "modal-overlay active";
    modal.innerHTML = `
      <div class="modal-card animate-pop-in">
        <div class="modal-header">
          <h3 class="modal-title"><i data-lucide="file-spreadsheet" class="icon-sm"></i> Request Custom Bulk Quotation</h3>
          <button class="modal-close-btn" onclick="document.getElementById('product-quote-modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-product-summary">
            <strong>${product.name}</strong> (SKU: ${product.sku})
            <p style="font-size: 0.85rem; color: #6b7280; margin-top: 4px;">Standard catalog rate: ${App.formatCurrency(product.price)} / ${product.unit || 'pack'}</p>
          </div>

          <form id="quote-request-modal-form">
            <div class="form-group">
              <label for="q-modal-company">Business / Company Name *</label>
              <input type="text" id="q-modal-company" class="form-control" value="${session ? session.companyName || '' : ''}" required placeholder="e.g. Grand Horizon Hotels Sdn Bhd">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="q-modal-email">Work Email *</label>
                <input type="email" id="q-modal-email" class="form-control" value="${session ? session.email || '' : ''}" required placeholder="procurement@company.my">
              </div>
              <div class="form-group">
                <label for="q-modal-phone">Phone / WhatsApp *</label>
                <input type="tel" id="q-modal-phone" class="form-control" value="${session ? session.phone || '' : ''}" required placeholder="+60 12-345 6789">
              </div>
            </div>

            <div class="form-group">
              <label for="q-modal-qty">Target Order Volume (Units) *</label>
              <input type="number" id="q-modal-qty" class="form-control" min="${product.tier2Qty || 50}" value="${(product.tier2Qty || 50) * 2}" required>
              <small class="form-hint">Quotes are tailored for bulk monthly contracts or 50+ carton commitments.</small>
            </div>

            <div class="form-group">
              <label for="q-modal-notes">Procurement Requirements & Delivery Schedule</label>
              <textarea id="q-modal-notes" class="form-control" rows="3" placeholder="Tell our supply chain team about your target delivery timeline, recurring monthly volume, or OEM customization requirements..."></textarea>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('product-quote-modal').remove()">Cancel</button>
              <button type="submit" class="btn btn-primary">Submit Quotation Request</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    App.initIcons();

    document.getElementById("quote-request-modal-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const quoteData = {
        buyerId: session && session.buyerId ? session.buyerId : "guest-quote",
        buyerCompany: document.getElementById("q-modal-company").value.trim(),
        buyerEmail: document.getElementById("q-modal-email").value.trim(),
        buyerPhone: document.getElementById("q-modal-phone").value.trim(),
        productId: product.id,
        productName: product.name,
        requestedQty: parseInt(document.getElementById("q-modal-qty").value),
        notes: document.getElementById("q-modal-notes").value.trim(),
        status: "pending"
      };

      const saved = StorageEngine.saveQuote(quoteData);
      modal.remove();
      App.toast(`Quotation request ${saved.id} submitted! Our sales team and admin will review your rates.`, "success", 5000);
    });
  }
};
