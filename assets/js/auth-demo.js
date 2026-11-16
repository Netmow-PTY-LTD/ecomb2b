/**
 * RTE Food Wholesale B2B Demo Application - Simulated Authentication Engine
 * Multi-persona switcher (Admin, Approved Buyer, Pending Buyer, Guest)
 */

const DEMO_ACCOUNTS = {
  admin: {
    email: "admin@dapurwarisan.my",
    password: "admin123",
    role: "admin",
    name: "Chef Azman & Operation HQ",
    title: "System Administrator & Head of Supply Chain"
  },
  approvedBuyer: {
    email: "sunway@bistro.my",
    password: "buyer123",
    buyerId: "buy-001",
    role: "buyer",
    status: "approved",
    companyName: "Sunway Bistro & Bar F&B Sdn Bhd",
    contactPerson: "Derrick Tan"
  },
  pendingBuyer: {
    email: "melaka@kopitiam.my",
    password: "buyer123",
    buyerId: "buy-002",
    role: "buyer",
    status: "pending",
    companyName: "Melaka Heritage Kopitiam Enterprise",
    contactPerson: "Tan Mei Ling"
  },
  hotelBuyer: {
    email: "procurement@grandborneo.com",
    password: "buyer123",
    buyerId: "buy-003",
    role: "buyer",
    status: "approved",
    companyName: "Grand Borneo Hotel & Suites",
    contactPerson: "Encik Faris Ridzuan"
  }
};

const AuthDemo = {
  // Get current active session
  getSession() {
    const session = StorageEngine.get(STORAGE_KEYS.SESSION);
    if (!session) return null;

    // Refresh buyer status live from database in case admin approved/rejected
    if (session.role === "buyer" && session.buyerId) {
      const buyer = StorageEngine.getBuyerById(session.buyerId);
      if (buyer) {
        session.status = buyer.status;
        session.companyName = buyer.companyName;
        session.creditTerm = buyer.creditTerm;
        session.creditLimit = buyer.creditLimit;
      }
    }
    return session;
  },

  // Set session
  setSession(sessionData) {
    StorageEngine.set(STORAGE_KEYS.SESSION, sessionData);
    this.dispatchAuthChangeEvent(sessionData);
    return sessionData;
  },

  // Clear session / logout
  logout() {
    StorageEngine.remove(STORAGE_KEYS.SESSION);
    this.dispatchAuthChangeEvent(null);
  },

  // Login handler
  login(email, password) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    // Check admin
    if (cleanEmail === DEMO_ACCOUNTS.admin.email.toLowerCase() && cleanPass === DEMO_ACCOUNTS.admin.password) {
      const session = {
        role: "admin",
        email: DEMO_ACCOUNTS.admin.email,
        name: DEMO_ACCOUNTS.admin.name,
        title: DEMO_ACCOUNTS.admin.title,
        loggedInAt: new Date().toISOString()
      };
      this.setSession(session);
      return { success: true, session, role: "admin" };
    }

    // Check registered buyers in storage
    const buyer = StorageEngine.getBuyerByEmail(cleanEmail);
    if (buyer) {
      if (buyer.password === cleanPass || cleanPass === "buyer123" || cleanPass === "password") {
        const session = {
          role: "buyer",
          buyerId: buyer.id,
          email: buyer.email,
          companyName: buyer.companyName,
          contactPerson: buyer.contactPerson,
          status: buyer.status,
          creditTerm: buyer.creditTerm,
          creditLimit: buyer.creditLimit,
          loggedInAt: new Date().toISOString()
        };
        this.setSession(session);
        return { success: true, session, role: "buyer" };
      } else {
        return { success: false, message: "Invalid password for this B2B account." };
      }
    }

    return { success: false, message: "Account not found. Please register or use demo accounts." };
  },

  // Fast demo switchers
  loginAs(type) {
    if (type === "admin") {
      return this.login(DEMO_ACCOUNTS.admin.email, DEMO_ACCOUNTS.admin.password);
    } else if (type === "approved" || type === "approvedBuyer") {
      return this.login(DEMO_ACCOUNTS.approvedBuyer.email, DEMO_ACCOUNTS.approvedBuyer.password);
    } else if (type === "pending" || type === "pendingBuyer") {
      return this.login(DEMO_ACCOUNTS.pendingBuyer.email, DEMO_ACCOUNTS.pendingBuyer.password);
    } else if (type === "hotel" || type === "hotelBuyer") {
      return this.login(DEMO_ACCOUNTS.hotelBuyer.email, DEMO_ACCOUNTS.hotelBuyer.password);
    } else if (type === "guest") {
      this.logout();
      return { success: true, session: null, role: "guest" };
    }
    return { success: false, message: "Unknown demo persona" };
  },

  // Current session helpers
  isLoggedIn() {
    return this.getSession() !== null;
  },

  isAdmin() {
    const s = this.getSession();
    return s && s.role === "admin";
  },

  isBuyer() {
    const s = this.getSession();
    return s && s.role === "buyer";
  },

  isApprovedBuyer() {
    const s = this.getSession();
    return s && s.role === "buyer" && s.status === "approved";
  },

  isPendingBuyer() {
    const s = this.getSession();
    return s && s.role === "buyer" && s.status === "pending";
  },

  // Get active cart key for currently logged in buyer or guest
  getActiveCartKey() {
    const session = this.getSession();
    if (session && session.buyerId) {
      return `buyer_${session.buyerId}`;
    }
    return "guest_cart";
  },

  // Dispatch custom event for reactive UI updates
  dispatchAuthChangeEvent(session) {
    const event = new CustomEvent("rte_auth_changed", { detail: { session } });
    window.dispatchEvent(event);
  }
};
