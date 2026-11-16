/**
 * RTE Food Wholesale B2B Demo Application - Storage Engine
 * Namespaced localStorage persistence, validation, seed management, and reactive helpers.
 */

const STORAGE_KEYS = {
  PRODUCTS: "rte_demo_products",
  CATEGORIES: "rte_demo_categories",
  BUYERS: "rte_demo_buyers",
  SESSION: "rte_demo_session",
  CARTS: "rte_demo_carts",
  ORDERS: "rte_demo_orders",
  QUOTES: "rte_demo_quotes",
  ENQUIRIES: "rte_demo_enquiries",
  SETTINGS: "rte_demo_settings",
  INVENTORY_LOGS: "rte_demo_inventory_logs",
  SEED_VERSION: "rte_demo_seed_version"
};

const StorageEngine = {
  // Safe read from localStorage with fallback
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[StorageEngine] Corrupted data in key ${key}, falling back:`, e);
      return fallback;
    }
  },

  // Safe write to localStorage
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[StorageEngine] Failed writing to ${key}:`, e);
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        alert("Browser localStorage quota exceeded. Please clear old browser data or reset demo data.");
      }
      return false;
    }
  },

  // Remove key
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`[StorageEngine] Failed removing ${key}:`, e);
      return false;
    }
  },

  // Initialize and seed database if not already seeded
  init() {
    const currentVersion = this.get(STORAGE_KEYS.SEED_VERSION);
    if (!currentVersion || currentVersion !== RTE_SEED_VERSION) {
      this.seedAll(false);
    }
  },

  // Seed all collections
  seedAll(force = false) {
    if (force) {
      console.log("[StorageEngine] Force resetting all demo data...");
    }

    if (force || !this.get(STORAGE_KEYS.SETTINGS)) {
      this.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    if (force || !this.get(STORAGE_KEYS.CATEGORIES)) {
      this.set(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    }
    if (force || !this.get(STORAGE_KEYS.PRODUCTS)) {
      this.set(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    }
    if (force || !this.get(STORAGE_KEYS.BUYERS)) {
      this.set(STORAGE_KEYS.BUYERS, DEFAULT_BUYERS);
    }
    if (force || !this.get(STORAGE_KEYS.ORDERS)) {
      this.set(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
    }
    if (force || !this.get(STORAGE_KEYS.QUOTES)) {
      this.set(STORAGE_KEYS.QUOTES, DEFAULT_QUOTES);
    }
    if (force || !this.get(STORAGE_KEYS.ENQUIRIES)) {
      this.set(STORAGE_KEYS.ENQUIRIES, DEFAULT_ENQUIRIES);
    }
    if (force || !this.get(STORAGE_KEYS.INVENTORY_LOGS)) {
      this.set(STORAGE_KEYS.INVENTORY_LOGS, DEFAULT_INVENTORY_LOGS);
    }
    if (force || !this.get(STORAGE_KEYS.CARTS)) {
      this.set(STORAGE_KEYS.CARTS, {});
    }

    this.set(STORAGE_KEYS.SEED_VERSION, RTE_SEED_VERSION);
    console.log("[StorageEngine] Database seed complete (v" + RTE_SEED_VERSION + ")");
  },

  // Reset demo data with optional redirect or notification
  resetDemoData() {
    this.seedAll(true);
    // Keep session or reset?
    // Let's reset session to default approved buyer for smooth testing
    AuthDemo.setSession({
      type: "buyer",
      buyerId: "buy-001",
      email: "sunway@bistro.my",
      name: "Sunway Bistro & Bar F&B Sdn Bhd",
      status: "approved"
    });
    return true;
  },

  // Generate unique IDs
  generateId(prefix = "ID") {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  },

  // Generate Order ID format RTE-ORD-YYYY-XXX
  generateOrderId() {
    const year = new Date().getFullYear();
    const orders = this.getOrders();
    const nextSeq = String(orders.length + 1).padStart(3, '0');
    return `RTE-ORD-${year}-${nextSeq}`;
  },

  // Generate Quotation ID format QUO-YYYY-XXX
  generateQuoteId() {
    const year = new Date().getFullYear();
    const quotes = this.getQuotes();
    const nextSeq = String(quotes.length + 1).padStart(3, '0');
    return `QUO-${year}-${nextSeq}`;
  },

  // Generate Enquiry ID format ENQ-YYYY-XXX
  generateEnquiryId() {
    const year = new Date().getFullYear();
    const enquiries = this.getEnquiries();
    const nextSeq = String(enquiries.length + 1).padStart(3, '0');
    return `ENQ-${year}-${nextSeq}`;
  },

  // ===================== CRUD FOR PRODUCTS =====================
  getProducts() {
    return this.get(STORAGE_KEYS.PRODUCTS, []);
  },

  getProductById(id) {
    const products = this.getProducts();
    return products.find(p => p.id === id) || null;
  },

  saveProduct(productData) {
    const products = this.getProducts();
    const existingIndex = products.findIndex(p => p.id === productData.id);

    if (existingIndex >= 0) {
      // Update
      const old = products[existingIndex];
      // Log inventory change if stock changed
      if (old.stock !== productData.stock) {
        const diff = productData.stock - old.stock;
        this.addInventoryLog(productData.id, productData.sku, diff, "Manual Admin Stock Adjustment", productData.stock);
      }
      products[existingIndex] = { ...old, ...productData };
    } else {
      // Add new
      if (!productData.id) {
        productData.id = "prod-" + Date.now().toString().slice(-6);
      }
      products.unshift(productData);
      this.addInventoryLog(productData.id, productData.sku, productData.stock, "Initial Product Creation", productData.stock);
    }

    this.set(STORAGE_KEYS.PRODUCTS, products);
    return productData;
  },

  deleteProduct(productId) {
    let products = this.getProducts();
    const toDelete = products.find(p => p.id === productId);
    if (!toDelete) return false;

    products = products.filter(p => p.id !== productId);
    this.set(STORAGE_KEYS.PRODUCTS, products);
    return true;
  },

  adjustStock(productId, deltaQty, reason = "Order Fulfillment") {
    const products = this.getProducts();
    const p = products.find(item => item.id === productId);
    if (!p) return false;

    const newStock = Math.max(0, (p.stock || 0) + deltaQty);
    p.stock = newStock;
    this.set(STORAGE_KEYS.PRODUCTS, products);
    this.addInventoryLog(productId, p.sku, deltaQty, reason, newStock);
    return true;
  },

  // ===================== CATEGORIES =====================
  getCategories() {
    return this.get(STORAGE_KEYS.CATEGORIES, []);
  },

  saveCategory(categoryData) {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === categoryData.id);
    if (index >= 0) {
      categories[index] = { ...categories[index], ...categoryData };
    } else {
      if (!categoryData.id) {
        categoryData.id = "cat-" + Date.now().toString().slice(-4);
      }
      categories.push(categoryData);
    }
    this.set(STORAGE_KEYS.CATEGORIES, categories);
    return categoryData;
  },

  deleteCategory(catId) {
    let categories = this.getCategories();
    categories = categories.filter(c => c.id !== catId);
    this.set(STORAGE_KEYS.CATEGORIES, categories);
    return true;
  },

  // ===================== BUYERS =====================
  getBuyers() {
    return this.get(STORAGE_KEYS.BUYERS, []);
  },

  getBuyerById(id) {
    const buyers = this.getBuyers();
    return buyers.find(b => b.id === id) || null;
  },

  getBuyerByEmail(email) {
    const buyers = this.getBuyers();
    return buyers.find(b => b.email.toLowerCase() === email.toLowerCase().trim()) || null;
  },

  saveBuyer(buyerData) {
    const buyers = this.getBuyers();
    const index = buyers.findIndex(b => b.id === buyerData.id);
    if (index >= 0) {
      buyers[index] = { ...buyers[index], ...buyerData };
    } else {
      if (!buyerData.id) {
        buyerData.id = "buy-" + Date.now().toString().slice(-5);
      }
      buyerData.registeredAt = buyerData.registeredAt || new Date().toISOString();
      buyers.unshift(buyerData);
    }
    this.set(STORAGE_KEYS.BUYERS, buyers);
    return buyerData;
  },

  updateBuyerStatus(buyerId, status, notes = "") {
    const buyers = this.getBuyers();
    const b = buyers.find(item => item.id === buyerId);
    if (!b) return false;

    b.status = status;
    if (status === "approved") {
      b.approvedAt = new Date().toISOString();
      if (!b.creditTerm || b.creditTerm.includes("Pre-payment")) {
        b.creditTerm = "Net 30 Days";
        b.creditLimit = b.creditLimit || 15000;
      }
    } else if (status === "rejected") {
      b.approvedAt = null;
    }
    if (notes) {
      b.notes = notes;
    }

    this.set(STORAGE_KEYS.BUYERS, buyers);

    // If currently logged in as this buyer, update session too
    const session = AuthDemo.getSession();
    if (session && session.buyerId === buyerId) {
      session.status = status;
      AuthDemo.setSession(session);
    }

    return b;
  },

  // ===================== ORDERS =====================
  getOrders() {
    return this.get(STORAGE_KEYS.ORDERS, []);
  },

  getOrderById(id) {
    const orders = this.getOrders();
    return orders.find(o => o.id === id) || null;
  },

  saveOrder(orderData) {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderData.id);

    if (index >= 0) {
      orders[index] = { ...orders[index], ...orderData };
    } else {
      if (!orderData.id) {
        orderData.id = this.generateOrderId();
      }
      orderData.createdAt = orderData.createdAt || new Date().toISOString();
      orders.unshift(orderData);

      // Deduct inventory for each item
      if (Array.isArray(orderData.items)) {
        orderData.items.forEach(item => {
          this.adjustStock(item.productId, -Number(item.quantity), `Order ${orderData.id} placement`);
        });
      }
    }

    this.set(STORAGE_KEYS.ORDERS, orders);
    return orderData;
  },

  updateOrderStatus(orderId, orderStatus, paymentStatus = null, notes = null) {
    const orders = this.getOrders();
    const o = orders.find(item => item.id === orderId);
    if (!o) return false;

    if (orderStatus) o.orderStatus = orderStatus;
    if (paymentStatus) o.paymentStatus = paymentStatus;
    if (notes !== null) o.notes = notes;

    this.set(STORAGE_KEYS.ORDERS, orders);
    return o;
  },

  // ===================== QUOTATIONS =====================
  getQuotes() {
    return this.get(STORAGE_KEYS.QUOTES, []);
  },

  getQuoteById(id) {
    const quotes = this.getQuotes();
    return quotes.find(q => q.id === id) || null;
  },

  saveQuote(quoteData) {
    const quotes = this.getQuotes();
    const index = quotes.findIndex(q => q.id === quoteData.id);

    if (index >= 0) {
      quotes[index] = { ...quotes[index], ...quoteData };
    } else {
      if (!quoteData.id) {
        quoteData.id = this.generateQuoteId();
      }
      quoteData.createdAt = quoteData.createdAt || new Date().toISOString();
      quotes.unshift(quoteData);
    }

    this.set(STORAGE_KEYS.QUOTES, quotes);
    return quoteData;
  },

  respondToQuote(quoteId, unitPrice, validUntil, adminRemarks) {
    const quotes = this.getQuotes();
    const q = quotes.find(item => item.id === quoteId);
    if (!q) return false;

    q.quotedPricePerUnit = Number(unitPrice);
    q.quotedTotal = Number(unitPrice) * Number(q.requestedQty);
    q.validUntil = validUntil;
    q.adminRemarks = adminRemarks;
    q.status = "quoted";
    q.respondedAt = new Date().toISOString();

    this.set(STORAGE_KEYS.QUOTES, quotes);
    return q;
  },

  acceptQuote(quoteId) {
    const quotes = this.getQuotes();
    const q = quotes.find(item => item.id === quoteId);
    if (!q) return false;

    q.status = "accepted";
    q.acceptedAt = new Date().toISOString();
    this.set(STORAGE_KEYS.QUOTES, quotes);
    return q;
  },

  convertQuoteToOrder(quoteId, deliveryDate, deliveryAddress, paymentMethod = "Net 30 Terms") {
    const q = this.getQuoteById(quoteId);
    if (!q || !q.quotedPricePerUnit) return null;

    const orderData = {
      id: this.generateOrderId(),
      buyerId: q.buyerId,
      buyerCompany: q.buyerCompany,
      buyerEmail: q.buyerEmail,
      items: [
        {
          productId: q.productId,
          name: q.productName + " (Custom Quotation Deal)",
          price: q.quotedPricePerUnit,
          quantity: q.requestedQty,
          total: q.quotedTotal
        }
      ],
      subtotal: q.quotedTotal,
      tax: 0,
      shippingFee: 0,
      total: q.quotedTotal,
      paymentMethod: paymentMethod,
      paymentStatus: "Pending Invoice",
      orderStatus: "Processing & Packing",
      deliveryDate: deliveryDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      deliveryAddress: deliveryAddress || "Registered Company Address",
      notes: `Converted from accepted quotation ${q.id}. Custom unit price RM${q.quotedPricePerUnit.toFixed(2)}.`
    };

    const createdOrder = this.saveOrder(orderData);

    // Update quote status to ordered
    q.status = "ordered";
    q.convertedOrderId = createdOrder.id;
    this.saveQuote(q);

    return createdOrder;
  },

  // ===================== ENQUIRIES =====================
  getEnquiries() {
    return this.get(STORAGE_KEYS.ENQUIRIES, []);
  },

  saveEnquiry(enquiryData) {
    const enquiries = this.getEnquiries();
    if (!enquiryData.id) {
      enquiryData.id = this.generateEnquiryId();
    }
    enquiryData.status = enquiryData.status || "new";
    enquiryData.createdAt = enquiryData.createdAt || new Date().toISOString();
    enquiries.unshift(enquiryData);
    this.set(STORAGE_KEYS.ENQUIRIES, enquiries);
    return enquiryData;
  },

  updateEnquiry(enquiryId, status, adminNotes) {
    const enquiries = this.getEnquiries();
    const item = enquiries.find(e => e.id === enquiryId);
    if (!item) return false;

    if (status) item.status = status;
    if (adminNotes !== undefined) item.adminNotes = adminNotes;
    this.set(STORAGE_KEYS.ENQUIRIES, enquiries);
    return item;
  },

  // ===================== INVENTORY LOGS =====================
  getInventoryLogs() {
    return this.get(STORAGE_KEYS.INVENTORY_LOGS, []);
  },

  addInventoryLog(productId, sku, change, reason, balance) {
    const logs = this.getInventoryLogs();
    const newLog = {
      id: "LOG-" + Date.now().toString().slice(-6),
      productId,
      sku,
      change: Number(change),
      reason,
      balance: Number(balance),
      date: new Date().toISOString()
    };
    logs.unshift(newLog);
    // Keep max 200 logs
    if (logs.length > 200) logs.pop();
    this.set(STORAGE_KEYS.INVENTORY_LOGS, logs);
    return newLog;
  },

  // ===================== SETTINGS =====================
  getSettings() {
    return this.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  saveSettings(newSettings) {
    const merged = { ...this.getSettings(), ...newSettings };
    this.set(STORAGE_KEYS.SETTINGS, merged);
    return merged;
  },

  // ===================== CART STORAGE (Per Buyer / Guest) =====================
  getCarts() {
    return this.get(STORAGE_KEYS.CARTS, {});
  },

  getUserCart(cartKey) {
    const carts = this.getCarts();
    return carts[cartKey] || [];
  },

  saveUserCart(cartKey, items) {
    const carts = this.getCarts();
    carts[cartKey] = items;
    this.set(STORAGE_KEYS.CARTS, carts);
    return items;
  },

  // ===================== PRICING AND MOQ HELPERS =====================
  calculateProductPrice(product, quantity) {
    const qty = Number(quantity);
    if (product.tier2Qty && qty >= product.tier2Qty && product.tier2Price) {
      return product.tier2Price;
    }
    if (product.tier1Qty && qty >= product.tier1Qty && product.tier1Price) {
      return product.tier1Price;
    }
    return product.price;
  },

  validateMoq(product, quantity) {
    const qty = Number(quantity);
    const moq = Number(product.moq || 1);
    return {
      isValid: qty >= moq,
      moq: moq,
      difference: moq - qty
    };
  }
};

// Auto-initialize storage on script load
StorageEngine.init();
