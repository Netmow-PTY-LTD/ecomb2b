/**
 * RTE Food Wholesale B2B Demo Application - Admin Dashboard Controller
 * Full CRUD for Products, Categories, Buyers, Orders, Quotations, Inventory, Enquiries, Settings & Chart.js Visualizations.
 */

const AdminDashboard = {
  currentTab: "overview",
  charts: {},

  init() {
    this.parseTabFromUrl();
    this.bindSidebar();
    this.renderCurrentTab();
  },

  parseTabFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("tab")) {
      const tab = params.get("tab");
      const validTabs = ["overview", "products", "categories", "buyers", "orders", "quotes", "inventory", "enquiries", "settings", "reports"];
      if (validTabs.includes(tab)) {
        this.currentTab = tab;
      }
    }
  },

  bindSidebar() {
    const links = document.querySelectorAll(".admin-sidebar-nav a");
    links.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const tab = link.getAttribute("data-tab");
        if (tab) {
          this.switchTab(tab);
          this.closeSidebar();
        }
      });
    });

    const mobileToggle = document.getElementById("admin-sidebar-toggle");
    const closeBtn = document.getElementById("admin-sidebar-close");
    const backdrop = document.getElementById("admin-sidebar-backdrop");
    const sidebar = document.getElementById("admin-sidebar");

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

    this.closeSidebar = closeSidebar;

    if (mobileToggle) mobileToggle.addEventListener("click", openSidebar);
    if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
    if (backdrop) backdrop.addEventListener("click", closeSidebar);
  },

  switchTab(tab) {
    this.currentTab = tab;

    // Update active nav links
    document.querySelectorAll(".admin-sidebar-nav a").forEach(link => {
      link.classList.toggle("active", link.getAttribute("data-tab") === tab);
    });

    // Update page title
    const titleEl = document.getElementById("admin-header-title");
    if (titleEl) {
      const titles = {
        overview: "Operational Overview & Analytics",
        products: "Product Catalogue & Wholesale Pricing",
        categories: "Product Categories",
        buyers: "B2B Buyer Accounts & Approvals",
        orders: "Wholesale Order Fulfillment",
        quotes: "Custom Volume Quotations",
        inventory: "Live Inventory & Batch Stock Control",
        enquiries: "Customer Inquiries & Tasting Requests",
        settings: "Website & Company Settings",
        reports: "Commercial Reports & Sales Statistics"
      };
      titleEl.textContent = titles[tab] || "Admin Console";
    }

    // Update URL
    const url = new URL(window.location);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url);

    this.renderCurrentTab();
  },

  renderCurrentTab() {
    // Hide all tab views
    document.querySelectorAll(".admin-tab-pane").forEach(pane => pane.style.display = "none");

    const target = document.getElementById(`admin-view-${this.currentTab}`);
    if (target) {
      target.style.display = "block";
    }

    switch (this.currentTab) {
      case "overview":
        this.renderOverviewTab();
        break;
      case "products":
        this.renderProductsTab();
        break;
      case "categories":
        this.renderCategoriesTab();
        break;
      case "buyers":
        this.renderBuyersTab();
        break;
      case "orders":
        this.renderOrdersTab();
        break;
      case "quotes":
        this.renderQuotesTab();
        break;
      case "inventory":
        this.renderInventoryTab();
        break;
      case "enquiries":
        this.renderEnquiriesTab();
        break;
      case "settings":
        this.renderSettingsTab();
        break;
      case "reports":
        this.renderReportsTab();
        break;
    }

    App.initIcons();
  },

  // ===================== 1. OVERVIEW TAB =====================
  renderOverviewTab() {
    const products = StorageEngine.getProducts();
    const orders = StorageEngine.getOrders();
    const buyers = StorageEngine.getBuyers();
    const quotes = StorageEngine.getQuotes();
    const enquiries = StorageEngine.getEnquiries();

    // Metric Calculations
    const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingOrders = orders.filter(o => o.orderStatus === "Pending Review" || o.orderStatus === "Processing & Packing").length;
    const pendingBuyers = buyers.filter(b => b.status === "pending").length;
    const pendingQuotes = quotes.filter(q => q.status === "pending").length;
    const lowStockCount = products.filter(p => p.stock <= (p.lowStockThreshold || 20)).length;
    const unreadEnquiries = enquiries.filter(e => e.status === "new").length;

    // Mount to DOM
    this.setMetric("ov-sales", App.formatCurrency(totalSales));
    this.setMetric("ov-orders", `${orders.length} <small>(${pendingOrders} active)</small>`);
    this.setMetric("ov-buyers", `${buyers.length} <small>(${pendingBuyers} pending)</small>`);
    this.setMetric("ov-low-stock", lowStockCount);
    this.setMetric("ov-quotes", pendingQuotes);
    this.setMetric("ov-enquiries", unreadEnquiries);

    // Render Charts using Chart.js if loaded
    this.renderCharts();

    // Recent Activity Feed
    const feed = document.getElementById("ov-recent-activities");
    if (feed) {
      const recentOrders = orders.slice(0, 4).map(o => ({
        type: "order",
        title: `New Order ${o.id} - ${App.formatCurrency(o.total)}`,
        subtitle: `Placed by ${o.buyerCompany} (${o.items ? o.items.length : 0} items)`,
        time: App.formatDate(o.createdAt, true),
        icon: "shopping-bag",
        color: "text-primary"
      }));

      const recentQuotes = quotes.slice(0, 3).map(q => ({
        type: "quote",
        title: `Quote Request ${q.id} (${q.requestedQty} units)`,
        subtitle: `${q.buyerCompany} for ${q.productName}`,
        time: App.formatDate(q.createdAt, true),
        icon: "file-text",
        color: "text-warning"
      }));

      const combined = [...recentOrders, ...recentQuotes].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);

      feed.innerHTML = combined.map(item => `
        <div class="activity-feed-item">
          <div class="activity-icon ${item.color}"><i data-lucide="${item.icon}"></i></div>
          <div class="activity-content">
            <div class="activity-title">${item.title}</div>
            <div class="activity-subtitle">${item.subtitle}</div>
          </div>
          <div class="activity-time">${item.time}</div>
        </div>
      `).join("");
    }
  },

  setMetric(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
  },

  renderCharts() {
    if (typeof Chart === "undefined") return;

    // 1. Monthly Revenue Chart
    const revCtx = document.getElementById("chart-revenue");
    if (revCtx) {
      if (this.charts.revenue) this.charts.revenue.destroy();
      this.charts.revenue = new Chart(revCtx, {
        type: "line",
        data: {
          labels: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov (MTD)"],
          datasets: [{
            label: "Monthly Revenue (RM)",
            data: [8400, 11200, 14500, 16800, 22400, 19800],
            borderColor: "#123D32",
            backgroundColor: "rgba(18, 61, 50, 0.08)",
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointBackgroundColor: "#E87932",
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              ticks: { callback: v => "RM " + v.toLocaleString() },
              grid: { color: "#f3f4f6" }
            },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // 2. Category Distribution
    const catCtx = document.getElementById("chart-category-dist");
    if (catCtx) {
      if (this.charts.category) this.charts.category.destroy();
      this.charts.category = new Chart(catCtx, {
        type: "doughnut",
        data: {
          labels: ["Ready-to-Eat", "Smoked Meats", "Marinated", "Frozen", "Sauces", "Combos"],
          datasets: [{
            data: [35, 25, 15, 10, 8, 7],
            backgroundColor: ["#123D32", "#E87932", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "right" } }
        }
      });
    }
  },

  // ===================== 2. PRODUCTS TAB =====================
  renderProductsTab() {
    const tbody = document.getElementById("admin-products-tbody");
    const countEl = document.getElementById("admin-prod-count");
    if (!tbody) return;

    const products = StorageEngine.getProducts();
    const categories = StorageEngine.getCategories();
    if (countEl) countEl.textContent = `${products.length} Products`;

    tbody.innerHTML = products.map(p => {
      const cat = categories.find(c => c.id === p.category);
      const catName = cat ? cat.name : "-";

      let stockClass = "text-success";
      if (p.stock <= 0) stockClass = "text-danger font-bold";
      else if (p.stock <= (p.lowStockThreshold || 20)) stockClass = "text-warning font-bold";

      return `
        <tr>
          <td>
            <div class="table-prod-cell">
              <img src="${p.image}" alt="${p.name}" class="table-prod-thumb" onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=100&q=80'">
              <div>
                <strong>${p.name}</strong>
                <div class="text-muted" style="font-size:0.8rem;">SKU: ${p.sku} | ${p.unit || 'pack'}</div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-subtle">${catName}</span></td>
          <td>
            <strong>${App.formatCurrency(p.price)}</strong>
            ${p.tier1Price ? `<div style="font-size:0.75rem; color:#6b7280;">Tier: ${App.formatCurrency(p.tier1Price)} (${p.tier1Qty}+)</div>` : ''}
          </td>
          <td><strong>${p.moq || 1}</strong></td>
          <td><span class="${stockClass}">${p.stock} units</span></td>
          <td>
            <span class="status-badge ${p.status === 'active' ? 'status-delivered' : 'status-rejected'}">
              ${p.status || 'active'}
            </span>
          </td>
          <td>
            <div class="table-actions">
              <button class="btn btn-xs btn-outline" onclick="AdminDashboard.openEditProductModal('${p.id}')">Edit</button>
              <button class="btn btn-xs btn-danger-soft" onclick="AdminDashboard.confirmDeleteProduct('${p.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    App.initIcons();
  },

  openEditProductModal(productId = null) {
    const existing = document.getElementById("admin-product-modal");
    if (existing) existing.remove();

    const isEdit = Boolean(productId);
    const product = isEdit ? StorageEngine.getProductById(productId) : {
      id: "",
      name: "",
      sku: "RTE-" + Math.floor(1000 + Math.random() * 9000),
      category: "cat-rte",
      price: 25.00,
      tier1Qty: 10,
      tier1Price: 22.50,
      tier2Qty: 50,
      tier2Price: 20.00,
      moq: 5,
      stock: 100,
      lowStockThreshold: 20,
      unit: "pack (1kg)",
      image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
      description: "Commercial ready-to-eat Malaysian specialty.",
      shelfLife: "12 Months Frozen (-18°C)",
      packaging: "Heavy Retort Pouch",
      prepTime: "Boil in bag 8 mins",
      ingredients: "Prime Halal ingredients, spices, aromatics.",
      allergens: "None",
      featured: false,
      status: "active"
    };

    const categories = StorageEngine.getCategories();

    const modal = document.createElement("div");
    modal.id = "admin-product-modal";
    modal.className = "modal-overlay active";
    modal.innerHTML = `
      <div class="modal-card modal-lg animate-pop-in">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? 'Edit Wholesale Product' : 'Add New RTE Product'}</h3>
          <button class="modal-close-btn" onclick="document.getElementById('admin-product-modal').remove()">&times;</button>
        </div>

        <form id="admin-product-form" class="modal-body">
          <div class="form-row">
            <div class="form-group flex-2">
              <label>Product Name *</label>
              <input type="text" id="m-prod-name" class="form-control" value="${product.name}" required>
            </div>
            <div class="form-group flex-1">
              <label>SKU Code *</label>
              <input type="text" id="m-prod-sku" class="form-control" value="${product.sku}" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Category *</label>
              <select id="m-prod-cat" class="form-control">
                ${categories.map(c => `<option value="${c.id}" ${product.category === c.id ? 'selected' : ''}>${c.name}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label>Packaging / Unit Format</label>
              <input type="text" id="m-prod-unit" class="form-control" value="${product.unit || 'pack (1kg)'}">
            </div>
            <div class="form-group">
              <label>Status</label>
              <select id="m-prod-status" class="form-control">
                <option value="active" ${product.status === 'active' ? 'selected' : ''}>Active / Listed</option>
                <option value="inactive" ${product.status === 'inactive' ? 'selected' : ''}>Inactive / Hidden</option>
              </select>
            </div>
          </div>

          <div class="form-row-3">
            <div class="form-group">
              <label>Base Price (RM) *</label>
              <input type="number" id="m-prod-price" class="form-control" step="0.50" value="${product.price}" required>
            </div>
            <div class="form-group">
              <label>Tier 1 Price / Qty</label>
              <div class="input-duo">
                <input type="number" id="m-prod-t1-price" class="form-control" placeholder="Price" step="0.50" value="${product.tier1Price || ''}">
                <input type="number" id="m-prod-t1-qty" class="form-control" placeholder="Min Qty" value="${product.tier1Qty || ''}">
              </div>
            </div>
            <div class="form-group">
              <label>Tier 2 Price / Qty</label>
              <div class="input-duo">
                <input type="number" id="m-prod-t2-price" class="form-control" placeholder="Price" step="0.50" value="${product.tier2Price || ''}">
                <input type="number" id="m-prod-t2-qty" class="form-control" placeholder="Min Qty" value="${product.tier2Qty || ''}">
              </div>
            </div>
          </div>

          <div class="form-row-3">
            <div class="form-group">
              <label>Minimum Order (MOQ) *</label>
              <input type="number" id="m-prod-moq" class="form-control" value="${product.moq || 1}" min="1" required>
            </div>
            <div class="form-group">
              <label>Current Stock Units *</label>
              <input type="number" id="m-prod-stock" class="form-control" value="${product.stock}" min="0" required>
            </div>
            <div class="form-group">
              <label>Low Stock Warning Threshold</label>
              <input type="number" id="m-prod-threshold" class="form-control" value="${product.lowStockThreshold || 20}">
            </div>
          </div>

          <div class="form-group">
            <label>Image URL</label>
            <input type="url" id="m-prod-image" class="form-control" value="${product.image}">
          </div>

          <div class="form-group">
            <label>Product Description</label>
            <textarea id="m-prod-desc" class="form-control" rows="2">${product.description || ''}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Shelf Life & Storage</label>
              <input type="text" id="m-prod-shelflife" class="form-control" value="${product.shelfLife || ''}">
            </div>
            <div class="form-group">
              <label>Preparation / Reconstitution</label>
              <input type="text" id="m-prod-prep" class="form-control" value="${product.prepTime || ''}">
            </div>
          </div>

          <div class="form-checkbox-group mt-2">
            <label class="checkbox-label">
              <input type="checkbox" id="m-prod-featured" ${product.featured ? 'checked' : ''}>
              Mark as Featured Bestseller on Homepage
            </label>
          </div>

          <div class="modal-actions mt-4">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('admin-product-modal').remove()">Cancel</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Product'}</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("admin-product-form").addEventListener("submit", (e) => {
      e.preventDefault();

      const updated = {
        ...product,
        name: document.getElementById("m-prod-name").value.trim(),
        sku: document.getElementById("m-prod-sku").value.trim(),
        category: document.getElementById("m-prod-cat").value,
        unit: document.getElementById("m-prod-unit").value.trim(),
        status: document.getElementById("m-prod-status").value,
        price: parseFloat(document.getElementById("m-prod-price").value) || 0,
        tier1Price: parseFloat(document.getElementById("m-prod-t1-price").value) || null,
        tier1Qty: parseInt(document.getElementById("m-prod-t1-qty").value) || null,
        tier2Price: parseFloat(document.getElementById("m-prod-t2-price").value) || null,
        tier2Qty: parseInt(document.getElementById("m-prod-t2-qty").value) || null,
        moq: parseInt(document.getElementById("m-prod-moq").value) || 1,
        stock: parseInt(document.getElementById("m-prod-stock").value) || 0,
        lowStockThreshold: parseInt(document.getElementById("m-prod-threshold").value) || 20,
        image: document.getElementById("m-prod-image").value.trim() || product.image,
        description: document.getElementById("m-prod-desc").value.trim(),
        shelfLife: document.getElementById("m-prod-shelflife").value.trim(),
        prepTime: document.getElementById("m-prod-prep").value.trim(),
        featured: document.getElementById("m-prod-featured").checked
      };

      StorageEngine.saveProduct(updated);
      modal.remove();
      App.toast(`Product "${updated.name}" saved! Catalogue updated in real-time.`, "success");
      this.renderProductsTab();
    });
  },

  confirmDeleteProduct(productId) {
    const prod = StorageEngine.getProductById(productId);
    if (!prod) return;

    App.confirmModal({
      title: "Delete Product?",
      message: `Are you sure you want to delete "${prod.name}" (SKU: ${prod.sku})? This will remove it from the wholesale catalogue.`,
      confirmText: "Delete Product",
      onConfirm: () => {
        StorageEngine.deleteProduct(productId);
        App.toast(`Product ${prod.sku} deleted.`, "info");
        this.renderProductsTab();
      }
    });
  },

  // ===================== 3. CATEGORIES TAB =====================
  renderCategoriesTab() {
    const tbody = document.getElementById("admin-categories-tbody");
    if (!tbody) return;

    const categories = StorageEngine.getCategories();
    const products = StorageEngine.getProducts();

    tbody.innerHTML = categories.map(c => {
      const count = products.filter(p => p.category === c.id).length;
      return `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td><code>${c.slug || c.id}</code></td>
          <td>${c.description || '-'}</td>
          <td><span class="badge badge-subtle">${count} products</span></td>
          <td>
            <button class="btn btn-xs btn-outline" onclick="AdminDashboard.openCategoryModal('${c.id}')">Edit</button>
            <button class="btn btn-xs btn-danger-soft" onclick="AdminDashboard.confirmDeleteCategory('${c.id}')">Delete</button>
          </td>
        </tr>
      `;
    }).join("");

    App.initIcons();
  },

  openCategoryModal(catId = null) {
    const existing = document.getElementById("admin-cat-modal");
    if (existing) existing.remove();

    const categories = StorageEngine.getCategories();
    const isEdit = Boolean(catId);
    const cat = isEdit ? categories.find(c => c.id === catId) : {
      id: "cat-" + Date.now().toString().slice(-4),
      name: "",
      slug: "",
      description: ""
    };

    const modal = document.createElement("div");
    modal.id = "admin-cat-modal";
    modal.className = "modal-overlay active";
    modal.innerHTML = `
      <div class="modal-card animate-pop-in">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? 'Edit Category' : 'Add New Category'}</h3>
          <button class="modal-close-btn" onclick="document.getElementById('admin-cat-modal').remove()">&times;</button>
        </div>
        <form id="admin-cat-form" class="modal-body">
          <div class="form-group">
            <label>Category Name *</label>
            <input type="text" id="m-cat-name" class="form-control" value="${cat.name}" required placeholder="e.g. Traditional Malay Sambals">
          </div>
          <div class="form-group">
            <label>Slug Identifier</label>
            <input type="text" id="m-cat-slug" class="form-control" value="${cat.slug || ''}" placeholder="e.g. traditional-sambals">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="m-cat-desc" class="form-control" rows="2">${cat.description || ''}</textarea>
          </div>
          <div class="modal-actions mt-3">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('admin-cat-modal').remove()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Category</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("admin-cat-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const updated = {
        ...cat,
        name: document.getElementById("m-cat-name").value.trim(),
        slug: document.getElementById("m-cat-slug").value.trim() || document.getElementById("m-cat-name").value.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: document.getElementById("m-cat-desc").value.trim()
      };

      StorageEngine.saveCategory(updated);
      modal.remove();
      App.toast(`Category "${updated.name}" saved!`, "success");
      this.renderCategoriesTab();
    });
  },

  confirmDeleteCategory(catId) {
    App.confirmModal({
      title: "Delete Category?",
      message: "Are you sure you want to remove this category? Associated products will remain in the catalogue under unassigned.",
      confirmText: "Delete",
      onConfirm: () => {
        StorageEngine.deleteCategory(catId);
        App.toast("Category removed.", "info");
        this.renderCategoriesTab();
      }
    });
  },

  // ===================== 4. BUYERS TAB =====================
  renderBuyersTab() {
    const tbody = document.getElementById("admin-buyers-tbody");
    if (!tbody) return;

    const buyers = StorageEngine.getBuyers();

    tbody.innerHTML = buyers.map(b => {
      let statusBadge = "";
      if (b.status === "approved") {
        statusBadge = `<span class="status-badge status-delivered">Approved</span>`;
      } else if (b.status === "pending") {
        statusBadge = `<span class="status-badge status-pending">Pending Approval</span>`;
      } else {
        statusBadge = `<span class="status-badge status-rejected">Rejected</span>`;
      }

      return `
        <tr>
          <td>
            <strong>${b.companyName}</strong>
            <div class="text-muted" style="font-size:0.8rem;">SSM: ${b.ssmNumber || '-'}</div>
          </td>
          <td>
            ${b.contactPerson}<br>
            <small class="text-muted">${b.phone || '-'} | ${b.email}</small>
          </td>
          <td><span class="badge badge-subtle">${b.businessType || 'F&B'}</span></td>
          <td>
            <div>${b.creditTerm || 'Pre-payment'}</div>
            <small class="text-muted">Limit: ${b.creditLimit ? App.formatCurrency(b.creditLimit) : '-'}</small>
          </td>
          <td>${statusBadge}</td>
          <td>
            <div class="table-actions">
              ${b.status !== 'approved' ? `<button class="btn btn-xs btn-success" onclick="AdminDashboard.approveBuyerAction('${b.id}')">Approve</button>` : ''}
              ${b.status !== 'rejected' ? `<button class="btn btn-xs btn-outline-danger" onclick="AdminDashboard.rejectBuyerAction('${b.id}')">Reject</button>` : ''}
              <button class="btn btn-xs btn-outline" onclick="AdminDashboard.viewBuyerDetailModal('${b.id}')">Details</button>
              <button class="btn btn-xs btn-secondary" onclick="AdminDashboard.simulateLoginAsBuyer('${b.id}')" title="Log in as this buyer to test their portal view">Login As</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    App.initIcons();
  },

  approveBuyerAction(buyerId) {
    const b = StorageEngine.updateBuyerStatus(buyerId, "approved", "Approved by Admin HQ. Net 30 Credit activated.");
    if (b) {
      App.toast(`Account for ${b.companyName} approved! They can now place wholesale orders with Net 30 terms.`, "success", 5000);
      this.renderBuyersTab();
    }
  },

  rejectBuyerAction(buyerId) {
    const b = StorageEngine.updateBuyerStatus(buyerId, "rejected", "Rejected due to missing business verification.");
    if (b) {
      App.toast(`Application for ${b.companyName} marked as rejected.`, "warning");
      this.renderBuyersTab();
    }
  },

  simulateLoginAsBuyer(buyerId) {
    const buyer = StorageEngine.getBuyerById(buyerId);
    if (!buyer) return;

    AuthDemo.setSession({
      role: "buyer",
      buyerId: buyer.id,
      email: buyer.email,
      companyName: buyer.companyName,
      contactPerson: buyer.contactPerson,
      status: buyer.status,
      creditTerm: buyer.creditTerm,
      creditLimit: buyer.creditLimit,
      loggedInAt: new Date().toISOString()
    });

    App.toast(`Switched persona to B2B Buyer: ${buyer.companyName}`, "success");
    window.location.href = "buyer.html";
  },

  viewBuyerDetailModal(buyerId) {
    const b = StorageEngine.getBuyerById(buyerId);
    if (!b) return;

    const existing = document.getElementById("admin-buyer-detail-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "admin-buyer-detail-modal";
    modal.className = "modal-overlay active";
    modal.innerHTML = `
      <div class="modal-card animate-pop-in">
        <div class="modal-header">
          <h3 class="modal-title">Business Partner Profile</h3>
          <button class="modal-close-btn" onclick="document.getElementById('admin-buyer-detail-modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="buyer-profile-inspect">
            <h4>${b.companyName}</h4>
            <div class="inspect-grid">
              <div><span class="label">SSM Reg:</span> <strong>${b.ssmNumber || '-'}</strong></div>
              <div><span class="label">Business Type:</span> <strong>${b.businessType}</strong></div>
              <div><span class="label">PIC:</span> <strong>${b.contactPerson}</strong></div>
              <div><span class="label">Contact:</span> <strong>${b.phone}</strong></div>
              <div><span class="label">Email:</span> <strong>${b.email}</strong></div>
              <div><span class="label">State:</span> <strong>${b.state || 'Selangor'}</strong></div>
              <div class="col-span-full"><span class="label">Facility Delivery Address:</span> <strong>${b.address || '-'}, ${b.postcode || ''}</strong></div>
              <div><span class="label">Current Status:</span> <strong class="text-primary">${b.status.toUpperCase()}</strong></div>
              <div><span class="label">Registered At:</span> <strong>${App.formatDate(b.registeredAt)}</strong></div>
            </div>
            ${b.notes ? `<div class="inspect-notes mt-3"><strong>Admin Internal Notes:</strong> ${b.notes}</div>` : ''}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('admin-buyer-detail-modal').remove()">Close</button>
          ${b.status !== 'approved' ? `<button class="btn btn-success" onclick="document.getElementById('admin-buyer-detail-modal').remove(); AdminDashboard.approveBuyerAction('${b.id}')">Approve Business Account</button>` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  // ===================== 5. ORDERS TAB =====================
  renderOrdersTab() {
    const tbody = document.getElementById("admin-orders-tbody");
    if (!tbody) return;

    const orders = StorageEngine.getOrders();

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td>
          <strong>${o.buyerCompany}</strong><br>
          <small class="text-muted">${o.buyerEmail || ''}</small>
        </td>
        <td>${App.formatDate(o.createdAt, true)}</td>
        <td>${App.formatDate(o.deliveryDate)}</td>
        <td>${o.items ? o.items.length : 0} items</td>
        <td><strong>${App.formatCurrency(o.total)}</strong></td>
        <td><span class="status-badge status-${o.orderStatus.toLowerCase().replace(/[^a-z]/g, '-')}">${o.orderStatus}</span></td>
        <td><span class="badge badge-subtle">${o.paymentStatus || 'Pending'}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-xs btn-primary" onclick="AdminDashboard.openManageOrderModal('${o.id}')">Manage</button>
            <button class="btn btn-xs btn-outline" onclick="AdminDashboard.printOrderInvoice('${o.id}')" title="Print Invoice"><i data-lucide="printer" class="icon-xs"></i></button>
          </div>
        </td>
      </tr>
    `).join("");

    App.initIcons();
  },

  openManageOrderModal(orderId) {
    const order = StorageEngine.getOrderById(orderId);
    if (!order) return;

    const existing = document.getElementById("admin-manage-order-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "admin-manage-order-modal";
    modal.className = "modal-overlay active";
    modal.innerHTML = `
      <div class="modal-card modal-lg animate-pop-in">
        <div class="modal-header">
          <h3 class="modal-title">Fulfillment & Status: ${order.id}</h3>
          <button class="modal-close-btn" onclick="document.getElementById('admin-manage-order-modal').remove()">&times;</button>
        </div>

        <form id="admin-manage-order-form" class="modal-body">
          <div class="order-manage-summary-box">
            <div><strong>Buyer:</strong> ${order.buyerCompany}</div>
            <div><strong>Delivery Schedule:</strong> ${App.formatDate(order.deliveryDate)}</div>
            <div><strong>Cold-Chain Address:</strong> ${order.deliveryAddress}</div>
            <div><strong>Order Value:</strong> ${App.formatCurrency(order.total)}</div>
          </div>

          <div class="form-row mt-3">
            <div class="form-group">
              <label>Order Logistics Status *</label>
              <select id="m-ord-status" class="form-control">
                <option value="Pending Review" ${order.orderStatus === 'Pending Review' ? 'selected' : ''}>Pending Review</option>
                <option value="Processing & Packing" ${order.orderStatus === 'Processing & Packing' ? 'selected' : ''}>Processing & Packing (Central Kitchen)</option>
                <option value="Out for Delivery" ${order.orderStatus === 'Out for Delivery' ? 'selected' : ''}>Out for Cold-Chain Delivery</option>
                <option value="Delivered" ${order.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered & Received</option>
                <option value="Cancelled" ${order.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </div>
            <div class="form-group">
              <label>Payment / Commercial Terms Status</label>
              <select id="m-ord-paystatus" class="form-control">
                <option value="Pending Invoice" ${order.paymentStatus === 'Pending Invoice' ? 'selected' : ''}>Pending Invoice</option>
                <option value="Approved Credit" ${order.paymentStatus === 'Approved Credit' ? 'selected' : ''}>Approved Credit (Net 30/45)</option>
                <option value="Paid" ${order.paymentStatus === 'Paid' ? 'selected' : ''}>Paid</option>
                <option value="Overdue" ${order.paymentStatus === 'Overdue' ? 'selected' : ''}>Overdue</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Admin Fulfillment & Cold-Chain Notes</label>
            <textarea id="m-ord-notes" class="form-control" rows="2">${order.notes || ''}</textarea>
          </div>

          <h5 class="mt-3">Line Items (${order.items.length})</h5>
          <div class="mini-order-items-table">
            ${order.items.map(i => `
              <div class="mini-item-row">
                <span>${i.name} &times; ${i.quantity}</span>
                <strong>${App.formatCurrency(i.total)}</strong>
              </div>
            `).join("")}
          </div>

          <div class="modal-actions mt-4">
            <button type="button" class="btn btn-outline" onclick="AdminDashboard.printOrderInvoice('${order.id}')"><i data-lucide="printer" class="icon-xs"></i> View Commercial Invoice</button>
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('admin-manage-order-modal').remove()">Cancel</button>
            <button type="submit" class="btn btn-primary">Update Order Status</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("admin-manage-order-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const newStatus = document.getElementById("m-ord-status").value;
      const newPay = document.getElementById("m-ord-paystatus").value;
      const notes = document.getElementById("m-ord-notes").value.trim();

      StorageEngine.updateOrderStatus(orderId, newStatus, newPay, notes);
      modal.remove();
      App.toast(`Order ${orderId} updated to "${newStatus}". Visible in Buyer Portal immediately.`, "success");
      this.renderOrdersTab();
    });
  },

  printOrderInvoice(orderId) {
    if (!orderId) return;
    App.openInvoice(orderId);
  },

  // ===================== 6. QUOTATIONS TAB =====================
  renderQuotesTab() {
    const tbody = document.getElementById("admin-quotes-tbody");
    if (!tbody) return;

    const quotes = StorageEngine.getQuotes();

    tbody.innerHTML = quotes.map(q => {
      let statusBadge = "";
      if (q.status === "pending") statusBadge = `<span class="status-badge status-pending">Pending Rate</span>`;
      else if (q.status === "quoted") statusBadge = `<span class="status-badge status-quoted">Quote Sent</span>`;
      else if (q.status === "accepted") statusBadge = `<span class="status-badge status-delivered">Accepted by Buyer</span>`;
      else if (q.status === "ordered") statusBadge = `<span class="status-badge status-processing">Converted to Order</span>`;

      return `
        <tr>
          <td><strong>${q.id}</strong></td>
          <td>
            <strong>${q.buyerCompany}</strong><br>
            <small class="text-muted">${q.buyerEmail || ''}</small>
          </td>
          <td>${q.productName}</td>
          <td><strong>${q.requestedQty}</strong> units</td>
          <td>
            ${q.quotedPricePerUnit ? `<strong>${App.formatCurrency(q.quotedPricePerUnit)}</strong> (${App.formatCurrency(q.quotedTotal)})` : '<span class="text-muted">Unquoted</span>'}
          </td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-xs btn-primary" onclick="AdminDashboard.openQuoteResponseModal('${q.id}')">
              ${q.status === 'pending' ? 'Provide Quote' : 'Edit Quote'}
            </button>
          </td>
        </tr>
      `;
    }).join("");

    App.initIcons();
  },

  openQuoteResponseModal(quoteId) {
    const quote = StorageEngine.getQuoteById(quoteId);
    if (!quote) return;

    const existing = document.getElementById("admin-quote-response-modal");
    if (existing) existing.remove();

    const product = StorageEngine.getProductById(quote.productId);
    const defaultPrice = product ? product.tier2Price || product.price : 20.00;

    const modal = document.createElement("div");
    modal.id = "admin-quote-response-modal";
    modal.className = "modal-overlay active";
    modal.innerHTML = `
      <div class="modal-card animate-pop-in">
        <div class="modal-header">
          <h3 class="modal-title">Provide Custom B2B Quotation: ${quote.id}</h3>
          <button class="modal-close-btn" onclick="document.getElementById('admin-quote-response-modal').remove()">&times;</button>
        </div>

        <form id="admin-quote-response-form" class="modal-body">
          <div class="quote-request-context">
            <div><strong>Buyer Company:</strong> ${quote.buyerCompany}</div>
            <div><strong>Product:</strong> ${quote.productName}</div>
            <div><strong>Requested Volume:</strong> ${quote.requestedQty} units</div>
            ${quote.notes ? `<div><strong>Buyer Remarks:</strong> <em>"${quote.notes}"</em></div>` : ''}
          </div>

          <div class="form-row mt-3">
            <div class="form-group">
              <label>Special Unit Price (RM) *</label>
              <input type="number" id="m-q-unitprice" class="form-control" step="0.50" value="${quote.quotedPricePerUnit || defaultPrice}" required>
            </div>
            <div class="form-group">
              <label>Quote Expiry Date *</label>
              <input type="date" id="m-q-validity" class="form-control" value="${quote.validUntil || ''}" required>
            </div>
          </div>

          <div class="form-group">
            <label>Admin Remarks / Terms for Buyer</label>
            <textarea id="m-q-remarks" class="form-control" rows="2" placeholder="e.g. Approved corporate pricing based on 3-month contract commitment...">${quote.adminRemarks || ''}</textarea>
          </div>

          <div class="modal-actions mt-3">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('admin-quote-response-modal').remove()">Cancel</button>
            <button type="submit" class="btn btn-primary">Send Quotation to Buyer Portal</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const validityInput = document.getElementById("m-q-validity");
    if (validityInput && !validityInput.value) {
      const exp = new Date();
      exp.setDate(exp.getDate() + 30);
      validityInput.value = exp.toISOString().split("T")[0];
    }

    document.getElementById("admin-quote-response-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const unitPrice = parseFloat(document.getElementById("m-q-unitprice").value);
      const validUntil = document.getElementById("m-q-validity").value;
      const remarks = document.getElementById("m-q-remarks").value.trim();

      StorageEngine.respondToQuote(quoteId, unitPrice, validUntil, remarks);
      modal.remove();
      App.toast(`Quotation ${quoteId} submitted! Buyer will see custom rate RM${unitPrice.toFixed(2)} in their portal.`, "success");
      this.renderQuotesTab();
    });
  },

  // ===================== 7. INVENTORY TAB =====================
  renderInventoryTab() {
    const tbody = document.getElementById("admin-inventory-tbody");
    if (!tbody) return;

    const products = StorageEngine.getProducts();

    tbody.innerHTML = products.map(p => {
      const isLow = p.stock <= (p.lowStockThreshold || 20);
      const isOut = p.stock <= 0;

      let statusPill = `<span class="badge badge-success">Sufficient</span>`;
      if (isOut) statusPill = `<span class="badge badge-danger">OUT OF STOCK</span>`;
      else if (isLow) statusPill = `<span class="badge badge-warning">LOW STOCK (&le; ${p.lowStockThreshold || 20})</span>`;

      return `
        <tr>
          <td><strong>${p.sku}</strong></td>
          <td><strong>${p.name}</strong></td>
          <td>${p.unit || 'pack'}</td>
          <td><strong style="font-size:1.05rem;">${p.stock}</strong></td>
          <td>${p.lowStockThreshold || 20}</td>
          <td>${statusPill}</td>
          <td>
            <div class="stock-adjust-inline">
              <button class="btn btn-xs btn-outline" onclick="AdminDashboard.quickAdjustStock('${p.id}', 10)">+10</button>
              <button class="btn btn-xs btn-outline" onclick="AdminDashboard.quickAdjustStock('${p.id}', 50)">+50</button>
              <button class="btn btn-xs btn-primary" onclick="AdminDashboard.openStockAuditModal('${p.id}')">Audit Stock</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    App.initIcons();
  },

  quickAdjustStock(productId, delta) {
    StorageEngine.adjustStock(productId, delta, `Quick restock +${delta} units`);
    App.toast(`Added ${delta} units to stock. Inventory updated.`, "success");
    this.renderInventoryTab();
  },

  openStockAuditModal(productId) {
    const p = StorageEngine.getProductById(productId);
    if (!p) return;

    const existing = document.getElementById("admin-stock-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "admin-stock-modal";
    modal.className = "modal-overlay active";
    modal.innerHTML = `
      <div class="modal-card animate-pop-in">
        <div class="modal-header">
          <h3 class="modal-title">Batch Stock Adjustment: ${p.sku}</h3>
          <button class="modal-close-btn" onclick="document.getElementById('admin-stock-modal').remove()">&times;</button>
        </div>
        <form id="admin-stock-form" class="modal-body">
          <p><strong>${p.name}</strong><br>Current Available Inventory: <strong>${p.stock} units</strong></p>

          <div class="form-group mt-3">
            <label>Adjustment Type</label>
            <select id="m-adj-type" class="form-control">
              <option value="add">Add Factory Production Batch (+)</option>
              <option value="set">Set Exact Count (Physical Audit)</option>
              <option value="deduct">Write-off / Quality Quarantine (-)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Quantity *</label>
            <input type="number" id="m-adj-qty" class="form-control" min="1" value="50" required>
          </div>

          <div class="form-group">
            <label>Batch Code / Audit Reason *</label>
            <input type="text" id="m-adj-reason" class="form-control" placeholder="e.g. LOT-2026-NOV-B04 blast freeze run" required>
          </div>

          <div class="modal-actions mt-3">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('admin-stock-modal').remove()">Cancel</button>
            <button type="submit" class="btn btn-primary">Apply Stock Update</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("admin-stock-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const type = document.getElementById("m-adj-type").value;
      const qty = parseInt(document.getElementById("m-adj-qty").value) || 0;
      const reason = document.getElementById("m-adj-reason").value.trim();

      if (type === "add") {
        StorageEngine.adjustStock(productId, qty, reason);
      } else if (type === "deduct") {
        StorageEngine.adjustStock(productId, -qty, reason);
      } else if (type === "set") {
        const diff = qty - p.stock;
        StorageEngine.adjustStock(productId, diff, reason);
      }

      modal.remove();
      App.toast(`Stock adjusted for ${p.sku}.`, "success");
      this.renderInventoryTab();
    });
  },

  // ===================== 8. ENQUIRIES TAB =====================
  renderEnquiriesTab() {
    const tbody = document.getElementById("admin-enquiries-tbody");
    if (!tbody) return;

    const enquiries = StorageEngine.getEnquiries();

    tbody.innerHTML = enquiries.map(e => `
      <tr>
        <td><strong>${e.id}</strong></td>
        <td>
          <strong>${e.fullName}</strong><br>
          <small>${e.companyName || '-'} (${e.businessType || 'F&B'})</small>
        </td>
        <td>
          <a href="mailto:${e.email}">${e.email}</a><br>
          <small class="text-muted">${e.phone || '-'}</small>
        </td>
        <td><strong>${e.subject}</strong></td>
        <td>${App.formatDate(e.createdAt)}</td>
        <td>
          <span class="status-badge ${e.status === 'new' ? 'status-pending' : 'status-delivered'}">${e.status.toUpperCase()}</span>
        </td>
        <td>
          <button class="btn btn-xs btn-primary" onclick="AdminDashboard.viewEnquiryModal('${e.id}')">View</button>
        </td>
      </tr>
    `).join("");

    App.initIcons();
  },

  viewEnquiryModal(enquiryId) {
    const enquiries = StorageEngine.getEnquiries();
    const e = enquiries.find(item => item.id === enquiryId);
    if (!e) return;

    const existing = document.getElementById("admin-enquiry-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "admin-enquiry-modal";
    modal.className = "modal-overlay active";
    modal.innerHTML = `
      <div class="modal-card animate-pop-in">
        <div class="modal-header">
          <h3 class="modal-title">Enquiry ${e.id}</h3>
          <button class="modal-close-btn" onclick="document.getElementById('admin-enquiry-modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="enquiry-inspect-card">
            <h4>${e.subject}</h4>
            <p><strong>From:</strong> ${e.fullName} &lt;${e.email}&gt; | ${e.phone || ''}<br>
            <strong>Company:</strong> ${e.companyName || '-'} (${e.businessType || 'General'})<br>
            <strong>Submitted:</strong> ${App.formatDate(e.createdAt, true)}</p>
            <div class="enquiry-message-box">
              ${e.message}
            </div>
          </div>

          <form id="admin-enquiry-reply-form" class="mt-3">
            <div class="form-group">
              <label>Update Status</label>
              <select id="m-enq-status" class="form-control">
                <option value="new" ${e.status === 'new' ? 'selected' : ''}>New / Unread</option>
                <option value="in-progress" ${e.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                <option value="replied" ${e.status === 'replied' ? 'selected' : ''}>Replied / Followed Up</option>
              </select>
            </div>
            <div class="form-group">
              <label>Admin Internal Follow-up Notes</label>
              <textarea id="m-enq-notes" class="form-control" rows="2" placeholder="e.g. Sent corporate tasting kit, followed up via WhatsApp...">${e.adminNotes || ''}</textarea>
            </div>
            <div class="modal-actions mt-3">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('admin-enquiry-modal').remove()">Close</button>
              <button type="submit" class="btn btn-primary">Save Notes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("admin-enquiry-reply-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const status = document.getElementById("m-enq-status").value;
      const notes = document.getElementById("m-enq-notes").value.trim();

      StorageEngine.updateEnquiry(enquiryId, status, notes);
      modal.remove();
      App.toast(`Enquiry ${enquiryId} updated.`, "success");
      this.renderEnquiriesTab();
    });
  },

  // ===================== 9. SETTINGS TAB =====================
  renderSettingsTab() {
    const settings = StorageEngine.getSettings();

    const companyName = document.getElementById("set-company-name");
    const companyReg = document.getElementById("set-company-reg");
    const tagline = document.getElementById("set-tagline");
    const announcement = document.getElementById("set-announcement");
    const showAnnounce = document.getElementById("set-show-announce");
    const phone = document.getElementById("set-phone");
    const whatsapp = document.getElementById("set-whatsapp");
    const email = document.getElementById("set-email");
    const address = document.getElementById("set-address");
    const heroHeading = document.getElementById("set-hero-heading");
    const heroSubheading = document.getElementById("set-hero-subheading");

    if (companyName) companyName.value = settings.companyName || "";
    if (companyReg) companyReg.value = settings.companyReg || "";
    if (tagline) tagline.value = settings.tagline || "";
    if (announcement) announcement.value = settings.announcement || "";
    if (showAnnounce) showAnnounce.checked = settings.showAnnouncement !== false;
    if (phone) phone.value = settings.phone || "";
    if (whatsapp) whatsapp.value = settings.whatsapp || "";
    if (email) email.value = settings.email || "";
    if (address) address.value = settings.address || "";
    if (heroHeading) heroHeading.value = settings.heroHeading || "";
    if (heroSubheading) heroSubheading.value = settings.heroSubheading || "";

    const form = document.getElementById("admin-settings-form");
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const updated = {
          companyName: companyName.value.trim(),
          companyReg: companyReg.value.trim(),
          tagline: tagline.value.trim(),
          announcement: announcement.value.trim(),
          showAnnouncement: showAnnounce.checked,
          phone: phone.value.trim(),
          whatsapp: whatsapp.value.trim(),
          email: email.value.trim(),
          address: address.value.trim(),
          heroHeading: heroHeading.value.trim(),
          heroSubheading: heroSubheading.value.trim()
        };

        StorageEngine.saveSettings(updated);
        App.toast("Website & Wholesale settings updated! Public pages now display your changes.", "success");
      };
    }
  },

  // ===================== 10. REPORTS TAB =====================
  renderReportsTab() {
    const orders = StorageEngine.getOrders();
    const products = StorageEngine.getProducts();
    const buyers = StorageEngine.getBuyers();

    const totalRev = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = orders.length > 0 ? (totalRev / orders.length) : 0;

    const repRev = document.getElementById("rep-total-revenue");
    const repAov = document.getElementById("rep-aov");
    const repTotalOrders = document.getElementById("rep-orders-count");

    if (repRev) repRev.textContent = App.formatCurrency(totalRev);
    if (repAov) repAov.textContent = App.formatCurrency(avgOrderValue);
    if (repTotalOrders) repTotalOrders.textContent = orders.length;

    // Top selling products table
    const topTbody = document.getElementById("rep-top-products-tbody");
    if (topTbody) {
      // Calculate units sold per product from orders
      const salesMap = {};
      orders.forEach(o => {
        (o.items || []).forEach(item => {
          if (!salesMap[item.productId]) {
            salesMap[item.productId] = { name: item.name, unitsSold: 0, revenue: 0 };
          }
          salesMap[item.productId].unitsSold += item.quantity;
          salesMap[item.productId].revenue += item.total;
        });
      });

      const sorted = Object.values(salesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      topTbody.innerHTML = sorted.map((item, idx) => `
        <tr>
          <td>#${idx + 1}</td>
          <td><strong>${item.name}</strong></td>
          <td><strong>${item.unitsSold}</strong> packs</td>
          <td><strong class="text-primary">${App.formatCurrency(item.revenue)}</strong></td>
        </tr>
      `).join("");
    }
  }
};
