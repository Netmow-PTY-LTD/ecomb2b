/**
 * RTE Food Wholesale B2B Demo Application - Common App Utilities & Global Navigation
 * Toast notifications, currency formatting, Demo Hub switcher, responsive navigation & mobile drawer.
 */

const App = {
  init() {
    this.renderAnnouncementBar();
    this.renderHeaderNav();
    this.renderDemoHubWidget();
    this.renderFooter();
    this.initMobileMenu();
    this.updateCartBadge();
    this.initIcons();

    // Listen to global storage/auth events
    window.addEventListener("rte_cart_changed", () => {
      this.updateCartBadge();
    });

    window.addEventListener("rte_auth_changed", () => {
      this.renderHeaderNav();
      this.initMobileMenu();
      this.updateCartBadge();
    });
  },

  // Safe Lucide icon initializer
  initIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  },

  // Malaysian Ringgit currency formatter
  formatCurrency(amount) {
    const val = Number(amount) || 0;
    return "RM " + val.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  // Format Date (e.g. "16 Nov 2026, 03:45 PM")
  formatDate(isoString, includeTime = false) {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      const options = {
        day: "2-digit",
        month: "short",
        year: "numeric"
      };
      if (includeTime) {
        options.hour = "2-digit";
        options.minute = "2-digit";
      }
      return d.toLocaleDateString("en-MY", options);
    } catch (e) {
      return isoString;
    }
  },

  // Open Commercial Invoice page directly (loads in dedicated invoice.html, never about:blank)
  openInvoice(orderId, autoPrint = false) {
    if (!orderId) return;
    const url = `invoice.html?id=${encodeURIComponent(orderId)}${autoPrint ? '&print=true' : ''}`;
    window.open(url, "_blank");
  },

  // Toast Notification System
  toast(message, type = "info", duration = 4000) {
    let container = document.getElementById("rte-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "rte-toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type} animate-slide-in`;

    const iconMap = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ"
    };

    toast.innerHTML = `
      <span class="toast-icon">${iconMap[type] || "ℹ"}</span>
      <div class="toast-body">${message}</div>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Confirmation Modal
  confirmModal({ title = "Please Confirm", message = "Are you sure?", confirmText = "Confirm", cancelText = "Cancel", onConfirm }) {
    const existing = document.getElementById("rte-confirm-modal");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "rte-confirm-modal";
    overlay.className = "modal-overlay active";
    overlay.innerHTML = `
      <div class="modal-card animate-pop-in">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close-btn" onclick="document.getElementById('rte-confirm-modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <p style="color: #4b5563; line-height: 1.5; font-size: 0.95rem;">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('rte-confirm-modal').remove()">${cancelText}</button>
          <button class="btn btn-primary" id="rte-confirm-action-btn">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("rte-confirm-action-btn").addEventListener("click", () => {
      overlay.remove();
      if (typeof onConfirm === "function") {
        onConfirm();
      }
    });
  },

  // Render Top Announcement Bar
  renderAnnouncementBar() {
    const mount = document.getElementById("announcement-bar-mount");
    if (!mount) return;

    const settings = StorageEngine.getSettings();
    if (settings.showAnnouncement && settings.announcement) {
      mount.innerHTML = `
        <div class="announcement-bar">
          <div class="container announcement-inner">
            <span class="announcement-text">${settings.announcement}</span>
            <div class="announcement-links">
              <a href="tel:${settings.phone.replace(/[^0-9+]/g, '')}"><i data-lucide="phone" class="icon-sm"></i> ${settings.phone}</a>
              <span class="separator">|</span>
              <a href="https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener"><i data-lucide="message-circle" class="icon-sm"></i> WhatsApp Support</a>
            </div>
          </div>
        </div>
      `;
    } else {
      mount.innerHTML = "";
    }
  },

  // Render Main Navbar Header
  renderHeaderNav() {
    const navMount = document.getElementById("main-nav-mount");
    if (!navMount) return;

    const session = AuthDemo.getSession();
    const settings = StorageEngine.getSettings();
    const currentPath = window.location.pathname.split("/").pop() || "index.html";

    let desktopAuthHtml = "";
    let mobileAuthHtml = "";

    if (!session) {
      // Guest
      desktopAuthHtml = `
        <div class="nav-auth-buttons desktop-only">
          <a href="login.html" class="btn btn-sm btn-outline">Buyer Login</a>
          <a href="register.html" class="btn btn-sm btn-primary">Register B2B</a>
        </div>
      `;
      mobileAuthHtml = `
        <div class="mobile-drawer-auth">
          <div class="mobile-drawer-auth-title">B2B Portal Access</div>
          <div class="mobile-drawer-auth-btns">
            <a href="login.html" class="btn btn-block btn-outline btn-sm">Buyer Login</a>
            <a href="register.html" class="btn btn-block btn-primary btn-sm">Register B2B Account</a>
          </div>
        </div>
      `;
    } else if (session.role === "admin") {
      // Admin
      desktopAuthHtml = `
        <div class="nav-user-badge desktop-only">
          <span class="badge badge-admin"><i data-lucide="shield-check" class="icon-xs"></i> Admin HQ</span>
          <a href="admin.html" class="nav-user-link">Admin Console</a>
          <button class="btn btn-xs btn-outline" onclick="AuthDemo.logout(); window.location.reload();">Logout</button>
        </div>
      `;
      mobileAuthHtml = `
        <div class="mobile-drawer-auth">
          <div class="mobile-user-card">
            <span class="badge badge-admin"><i data-lucide="shield-check" class="icon-xs"></i> System Administrator</span>
            <strong>Chef Azman & HQ</strong>
            <div class="mobile-drawer-user-actions">
              <a href="admin.html" class="btn btn-primary btn-sm btn-block">Open Admin Dashboard</a>
              <button class="btn btn-outline btn-sm btn-block" onclick="AuthDemo.logout(); window.location.reload();">Sign Out</button>
            </div>
          </div>
        </div>
      `;
    } else {
      // Buyer
      const isApproved = session.status === "approved";
      desktopAuthHtml = `
        <div class="nav-user-badge desktop-only">
          <span class="badge ${isApproved ? 'badge-success' : 'badge-warning'}">
            <i data-lucide="${isApproved ? 'check-circle-2' : 'clock'}" class="icon-xs"></i> 
            ${isApproved ? 'Approved' : 'Pending'}
          </span>
          <a href="buyer.html" class="nav-user-link" title="${session.companyName}">
            ${session.companyName.length > 18 ? session.companyName.substring(0, 16) + '...' : session.companyName}
          </a>
          <button class="btn btn-xs btn-outline" onclick="AuthDemo.logout(); window.location.reload();">Logout</button>
        </div>
      `;
      mobileAuthHtml = `
        <div class="mobile-drawer-auth">
          <div class="mobile-user-card">
            <span class="badge ${isApproved ? 'badge-success' : 'badge-warning'}">
              <i data-lucide="${isApproved ? 'check-circle-2' : 'clock'}" class="icon-xs"></i> 
              ${isApproved ? 'Approved Partner' : 'Verification Pending'}
            </span>
            <strong style="margin: 4px 0;">${session.companyName}</strong>
            <div class="mobile-drawer-user-actions">
              <a href="buyer.html" class="btn btn-primary btn-sm btn-block">Open Buyer Portal</a>
              <button class="btn btn-outline btn-sm btn-block" onclick="AuthDemo.logout(); window.location.reload();">Sign Out</button>
            </div>
          </div>
        </div>
      `;
    }

    navMount.innerHTML = `
      <header class="navbar-wrapper">
        <div class="container navbar-inner">
          <!-- Brand Logo -->
          <a href="index.html" class="brand-logo">
            <div class="logo-mark">RTE</div>
            <div class="logo-text">
              <span class="logo-title">${settings.companyName ? settings.companyName.split(' ')[0] : 'DapurWarisan'}</span>
              <span class="logo-tagline">B2B Food Wholesale</span>
            </div>
          </a>

          <!-- Desktop Navigation Menu -->
          <nav class="nav-menu desktop-menu" id="primary-desktop-menu">
            <a href="index.html" class="nav-link ${currentPath === 'index.html' || currentPath === '' ? 'active' : ''}">Home</a>
            <a href="about.html" class="nav-link ${currentPath === 'about.html' ? 'active' : ''}">About Us</a>
            <a href="products.html" class="nav-link ${currentPath === 'products.html' || currentPath === 'product.html' ? 'active' : ''}">Catalogue</a>
            <a href="wholesale.html" class="nav-link ${currentPath === 'wholesale.html' ? 'active' : ''}">Wholesale & OEM</a>
            <a href="contact.html" class="nav-link ${currentPath === 'contact.html' ? 'active' : ''}">Contact</a>
          </nav>

          <!-- Navigation Right Actions -->
          <div class="nav-actions">
            <!-- Wholesale Cart Link (Always Visible) -->
            <a href="buyer.html?tab=cart" class="nav-cart-btn" title="Wholesale Cart">
              <i data-lucide="shopping-cart"></i>
              <span class="cart-badge" id="global-cart-badge">0</span>
            </a>

            <!-- Quick Demo Hub Launcher (Desktop View) -->
            <button class="btn-demo-hub-pill desktop-only" onclick="App.openDemoHubModal()" title="Switch View & Demo Profiles">
              <i data-lucide="layout-grid"></i>
              <span>Demo Hub</span>
            </button>

            <!-- User Status / Login Buttons (Desktop Only) -->
            ${desktopAuthHtml}

            <!-- Mobile Hamburger Toggle Button -->
            <button class="mobile-toggle-btn" id="mobile-menu-toggle" aria-label="Toggle Navigation Menu">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>

        <!-- Mobile Drawer Navigation Overlay & Panel -->
        <div class="mobile-nav-backdrop" id="mobile-nav-backdrop"></div>
        <div class="mobile-nav-drawer" id="mobile-nav-drawer">
          <div class="mobile-drawer-header">
            <div class="brand-logo">
              <div class="logo-mark" style="width:36px; height:36px; font-size:0.95rem;">RTE</div>
              <span style="font-weight:800; font-size:1.1rem; color:var(--color-primary);">${settings.companyName || 'DapurWarisan'}</span>
            </div>
            <button class="drawer-close-btn" id="mobile-drawer-close">&times;</button>
          </div>

          <div class="mobile-drawer-links">
            <a href="index.html" class="mobile-nav-link ${currentPath === 'index.html' || currentPath === '' ? 'active' : ''}">
              <i data-lucide="home" class="icon-sm"></i> Home
            </a>
            <a href="about.html" class="mobile-nav-link ${currentPath === 'about.html' ? 'active' : ''}">
              <i data-lucide="info" class="icon-sm"></i> About Us
            </a>
            <a href="products.html" class="mobile-nav-link ${currentPath === 'products.html' || currentPath === 'product.html' ? 'active' : ''}">
              <i data-lucide="package" class="icon-sm"></i> Product Catalogue
            </a>
            <a href="wholesale.html" class="mobile-nav-link ${currentPath === 'wholesale.html' ? 'active' : ''}">
              <i data-lucide="file-text" class="icon-sm"></i> Wholesale & OEM
            </a>
            <a href="contact.html" class="mobile-nav-link ${currentPath === 'contact.html' ? 'active' : ''}">
              <i data-lucide="phone" class="icon-sm"></i> Contact Us
            </a>
            <a href="buyer.html?tab=cart" class="mobile-nav-link ${currentPath === 'buyer.html' ? 'active' : ''}">
              <i data-lucide="shopping-cart" class="icon-sm"></i> Wholesale Cart & Checkout
            </a>
          </div>

          <!-- Mobile Auth Section -->
          ${mobileAuthHtml}

          <!-- Mobile Demo Hub Pill -->
          <div class="mobile-drawer-bottom">
            <button class="btn btn-block btn-demo-hub-mobile" onclick="App.openDemoHubModal(); App.closeMobileMenu();">
              <i data-lucide="layout-grid" class="icon-sm"></i> Open RTE Demo Hub
            </button>
          </div>
        </div>
      </header>
    `;

    this.initIcons();
  },

  // Update Cart Badge Counter
  updateCartBadge() {
    const badge = document.getElementById("global-cart-badge");
    if (badge) {
      const count = Cart.getItemCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-flex" : "none";
    }
  },

  // Mobile menu toggle logic
  initMobileMenu() {
    const toggle = document.getElementById("mobile-menu-toggle");
    const drawer = document.getElementById("mobile-nav-drawer");
    const backdrop = document.getElementById("mobile-nav-backdrop");
    const closeBtn = document.getElementById("mobile-drawer-close");

    if (!toggle || !drawer) return;

    const openMenu = () => {
      drawer.classList.add("open");
      if (backdrop) backdrop.classList.add("active");
      toggle.classList.add("active");
      document.body.style.overflow = "hidden";
    };

    const closeMenu = () => {
      drawer.classList.remove("open");
      if (backdrop) backdrop.classList.remove("active");
      toggle.classList.remove("active");
      document.body.style.overflow = "";
    };

    this.closeMobileMenu = closeMenu;

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (drawer.classList.contains("open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (closeBtn) closeBtn.addEventListener("click", closeMenu);
    if (backdrop) backdrop.addEventListener("click", closeMenu);

    // Close when clicking a link
    drawer.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", closeMenu);
    });
  },

  // Render Footer
  renderFooter() {
    const footerMount = document.getElementById("main-footer-mount");
    if (!footerMount) return;

    const settings = StorageEngine.getSettings();

    footerMount.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-grid">
          <div class="footer-col col-brand">
            <div class="footer-logo">
              <div class="logo-mark">RTE</div>
              <span class="logo-title">${settings.companyName}</span>
            </div>
            <p class="footer-desc">${settings.tagline}</p>
            <div class="footer-badge-list">
              <span class="cert-pill">Halal-Compliant Demo</span>
              <span class="cert-pill">HACCP & ISO 22000 Facility</span>
              <span class="cert-pill">Cold-Chain Guaranteed</span>
            </div>
            <p class="ssm-text">SSM Registration: ${settings.companyReg}</p>
          </div>

          <div class="footer-col">
            <h4 class="footer-title">Wholesale Solutions</h4>
            <ul class="footer-links">
              <li><a href="products.html?cat=cat-rte">Ready-to-Eat Retort Meals</a></li>
              <li><a href="products.html?cat=cat-smoked">Wood-Smoked Meats</a></li>
              <li><a href="products.html?cat=cat-marinated">Pre-Marinated Skewers</a></li>
              <li><a href="products.html?cat=cat-sauces">Central Kitchen Sauces & Pastes</a></li>
              <li><a href="products.html?cat=cat-combos">Cafe & HORECA Starter Kits</a></li>
              <li><a href="wholesale.html">Private Label & OEM Retort</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4 class="footer-title">Portals & Workflows</h4>
            <ul class="footer-links">
              <li><a href="register.html">Apply for B2B Account</a></li>
              <li><a href="login.html">Buyer Portal Login</a></li>
              <li><a href="buyer.html">Buyer Order & Quotations Dashboard</a></li>
              <li><a href="admin.html">Admin Management Console</a></li>
              <li><a href="contact.html">Request Sample Tasting Kit</a></li>
              <li><button class="footer-reset-btn" onclick="App.confirmResetDemo()">↺ Reset Demo Data to Default</button></li>
            </ul>
          </div>

          <div class="footer-col col-contact">
            <h4 class="footer-title">Central Kitchen & Logistics</h4>
            <p><i data-lucide="map-pin" class="icon-xs"></i> ${settings.address}</p>
            <p><i data-lucide="phone" class="icon-xs"></i> <a href="tel:${settings.phone.replace(/[^0-9+]/g, '')}">${settings.phone}</a></p>
            <p><i data-lucide="mail" class="icon-xs"></i> <a href="mailto:${settings.email}">${settings.email}</a></p>
            <p><i data-lucide="clock" class="icon-xs"></i> ${settings.operatingHours}</p>
            <div class="whatsapp-cta-box">
              <a href="https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20DapurWarisan%20Wholesale%20Team" target="_blank" class="btn btn-sm btn-whatsapp">
                <i data-lucide="message-square" class="icon-xs"></i> Chat on WhatsApp (${settings.whatsapp})
              </a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <div class="container footer-bottom-inner">
            <p>&copy; 2026 ${settings.companyName}. All rights reserved. Built as an interactive frontend demonstration.</p>
            <div class="footer-disclaimer">
              <span>* Notice: Fictional B2B Food Wholesale demonstration. All transactions and authentications are simulated locally via browser localStorage.</span>
            </div>
          </div>
        </div>
      </footer>
    `;

    this.initIcons();
  },

  // Persistent Demo Hub Floating Button & Modal (Matches User's Architecture Diagram!)
  renderDemoHubWidget() {
    // Only render once
    if (document.getElementById("rte-demo-hub-modal")) return;

    const modal = document.createElement("div");
    modal.id = "rte-demo-hub-modal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-card demo-hub-card animate-pop-in">
        <div class="demo-hub-header">
          <div class="hub-header-title">
            <div class="hub-icon-badge"><i data-lucide="monitor"></i></div>
            <div>
              <h3>RTE Wholesale Hub</h3>
              <p>Main application & interactive prototype switcher</p>
            </div>
          </div>
          <button class="modal-close-btn" onclick="App.closeDemoHubModal()">&times;</button>
        </div>

        <!-- 3-Column Architecture Map matching user diagram -->
        <div class="demo-hub-columns">
          <!-- Column 1: Public Website -->
          <div class="hub-col">
            <div class="hub-col-head">
              <i data-lucide="globe"></i>
              <h4>Public Website</h4>
            </div>
            <div class="hub-btn-group">
              <a href="index.html" class="hub-nav-btn">Homepage</a>
              <a href="about.html" class="hub-nav-btn">About Us</a>
              <a href="products.html" class="hub-nav-btn">Product Catalogue</a>
              <a href="wholesale.html" class="hub-nav-btn">Wholesale & OEM</a>
              <a href="contact.html" class="hub-nav-btn">Contact & Enquiries</a>
            </div>
          </div>

          <!-- Column 2: Buyer Portal -->
          <div class="hub-col">
            <div class="hub-col-head">
              <i data-lucide="shopping-cart"></i>
              <h4>Buyer Portal</h4>
            </div>
            <div class="hub-btn-group">
              <a href="register.html" class="hub-nav-btn">Business Registration</a>
              <a href="login.html" class="hub-nav-btn">Buyer Login</a>
              <a href="buyer.html?tab=dashboard" class="hub-nav-btn">Buyer Dashboard</a>
              <a href="buyer.html?tab=cart" class="hub-nav-btn">Wholesale Cart & Checkout</a>
              <a href="buyer.html?tab=orders" class="hub-nav-btn">Order History</a>
              <a href="invoice.html?id=RTE-ORD-2026-001" class="hub-nav-btn">Commercial Invoice (Sample)</a>
              <a href="buyer.html?tab=quotes" class="hub-nav-btn">Quotations & Custom Pricing</a>
            </div>
          </div>

          <!-- Column 3: Admin Dashboard -->
          <div class="hub-col">
            <div class="hub-col-head">
              <i data-lucide="layout-dashboard"></i>
              <h4>Admin Dashboard</h4>
            </div>
            <div class="hub-btn-group">
              <a href="admin.html?tab=overview" class="hub-nav-btn">Overview & Reports</a>
              <a href="admin.html?tab=products" class="hub-nav-btn">Product Management</a>
              <a href="admin.html?tab=buyers" class="hub-nav-btn">Buyer Management</a>
              <a href="admin.html?tab=orders" class="hub-nav-btn">Order Management</a>
              <a href="admin.html?tab=quotes" class="hub-nav-btn">Quotation Management</a>
              <a href="admin.html?tab=inventory" class="hub-nav-btn">Live Inventory</a>
            </div>
          </div>
        </div>

        <!-- Fast Persona Switcher -->
        <div class="demo-persona-strip">
          <div class="persona-label">
            <i data-lucide="users"></i> Quick Demo Persona Switcher:
          </div>
          <div class="persona-chips">
            <button class="chip-btn chip-admin" onclick="App.quickSwitchPersona('admin')">
              🛡️ Admin (Chef Azman HQ)
            </button>
            <button class="chip-btn chip-buyer" onclick="App.quickSwitchPersona('approved')">
              👤 Approved Buyer (Sunway Bistro)
            </button>
            <button class="chip-btn chip-pending" onclick="App.quickSwitchPersona('pending')">
              ⏳ Pending Buyer (Melaka Kopitiam)
            </button>
            <button class="chip-btn chip-guest" onclick="App.quickSwitchPersona('guest')">
              🌐 Guest Visitor
            </button>
          </div>
        </div>

        <!-- Footer Bar with Storage Notice & Reset Button -->
        <div class="demo-hub-footer">
          <div class="hub-storage-notice">
            <i data-lucide="database"></i>
            <span><strong>Shared browser localStorage:</strong> Real-time changes in Admin update the Buyer Portal and Public Website immediately.</span>
          </div>
          <button class="btn btn-sm btn-danger-soft" onclick="App.confirmResetDemo()">
            <i data-lucide="rotate-ccw" class="icon-xs"></i> Reset Sample Data
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Floating Demo Hub Trigger on bottom-right of every page
    const floatingBtn = document.createElement("button");
    floatingBtn.className = "floating-demo-hub-btn";
    floatingBtn.title = "Open RTE Wholesale Hub Navigation";
    floatingBtn.innerHTML = `
      <div class="hub-floating-inner">
        <span class="hub-pulse"></span>
        <i data-lucide="layers"></i>
        <span>Demo Hub</span>
      </div>
    `;
    floatingBtn.onclick = () => App.openDemoHubModal();
    document.body.appendChild(floatingBtn);

    this.initIcons();
  },

  openDemoHubModal() {
    const modal = document.getElementById("rte-demo-hub-modal");
    if (modal) {
      modal.classList.add("active");
      this.initIcons();
    }
  },

  closeDemoHubModal() {
    const modal = document.getElementById("rte-demo-hub-modal");
    if (modal) {
      modal.classList.remove("active");
    }
  },

  quickSwitchPersona(type) {
    const res = AuthDemo.loginAs(type);
    this.closeDemoHubModal();
    if (res.success) {
      if (type === "admin") {
        this.toast("Switched to Admin: Chef Azman (Supply Chain HQ)", "success");
        window.location.href = "admin.html";
      } else if (type === "approved") {
        this.toast("Switched to Approved Buyer: Sunway Bistro & Bar F&B", "success");
        window.location.href = "buyer.html";
      } else if (type === "pending") {
        this.toast("Switched to Pending Buyer: Melaka Heritage Kopitiam", "warning");
        window.location.href = "buyer.html";
      } else {
        this.toast("Logged out as Guest Visitor", "info");
        window.location.reload();
      }
    }
  },

  confirmResetDemo() {
    this.confirmModal({
      title: "Reset All Demo Data?",
      message: "This will restore default sample products, 10 sample orders, 4 B2B buyers, quotation requests, and website settings back to initial factory demonstration state. Any custom modifications will be refreshed.",
      confirmText: "Yes, Reset Everything",
      onConfirm: () => {
        StorageEngine.resetDemoData();
        this.toast("Demo data successfully refreshed to seed defaults!", "success");
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    });
  }
};

// Document ready init
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
