/**
 * RTE Food Wholesale B2B Demo Application - Cart & Checkout Engine
 * Volume-based tiered pricing, MOQ enforcement, stock checking, and persistent cart.
 */

const Cart = {
  // Get items in current user's cart
  getItems() {
    const key = AuthDemo.getActiveCartKey();
    const items = StorageEngine.getUserCart(key);
    // Enrich items with latest product data (in case price or name changed in Admin)
    return items.map(item => {
      const liveProduct = StorageEngine.getProductById(item.productId);
      if (liveProduct) {
        const unitPrice = StorageEngine.calculateProductPrice(liveProduct, item.quantity);
        return {
          ...item,
          name: liveProduct.name,
          sku: liveProduct.sku,
          image: liveProduct.image,
          unit: liveProduct.unit,
          stock: liveProduct.stock,
          moq: liveProduct.moq,
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
          tier1Qty: liveProduct.tier1Qty,
          tier1Price: liveProduct.tier1Price,
          tier2Qty: liveProduct.tier2Qty,
          tier2Price: liveProduct.tier2Price,
          basePrice: liveProduct.price
        };
      }
      return item;
    });
  },

  // Save current cart
  saveItems(items) {
    const key = AuthDemo.getActiveCartKey();
    StorageEngine.saveUserCart(key, items);
    this.dispatchCartChangeEvent();
  },

  // Add product to cart with MOQ handling
  addItem(productId, quantity = null) {
    const product = StorageEngine.getProductById(productId);
    if (!product) {
      return { success: false, message: "Product not found" };
    }

    if (product.stock <= 0) {
      return { success: false, message: "Product is currently out of stock." };
    }

    const minQty = product.moq || 1;
    let qtyToAdd = quantity !== null ? Number(quantity) : minQty;
    if (qtyToAdd < minQty) {
      qtyToAdd = minQty;
    }

    if (qtyToAdd > product.stock) {
      return { success: false, message: `Only ${product.stock} units available in stock.` };
    }

    const key = AuthDemo.getActiveCartKey();
    let items = StorageEngine.getUserCart(key);
    const existingIndex = items.findIndex(i => i.productId === productId);

    if (existingIndex >= 0) {
      const newQty = items[existingIndex].quantity + (quantity !== null ? Number(quantity) : 1);
      if (newQty > product.stock) {
        return { success: false, message: `Cannot exceed stock of ${product.stock} units.` };
      }
      items[existingIndex].quantity = newQty;
    } else {
      items.push({
        productId: product.id,
        quantity: qtyToAdd
      });
    }

    this.saveItems(items);
    return {
      success: true,
      message: `Added ${product.name} to wholesale cart!`,
      cartCount: this.getItemCount()
    };
  },

  // Update quantity of item in cart
  updateQuantity(productId, newQty) {
    const product = StorageEngine.getProductById(productId);
    if (!product) return { success: false, message: "Product not found" };

    const qty = Number(newQty);
    if (qty <= 0) {
      return this.removeItem(productId);
    }

    if (qty < product.moq) {
      return {
        success: false,
        warning: true,
        message: `MOQ for this item is ${product.moq} ${product.unit || 'units'}. Quantity adjusted to MOQ.`,
        adjustedQty: product.moq
      };
    }

    if (qty > product.stock) {
      return {
        success: false,
        message: `Maximum available stock is ${product.stock} units.`,
        maxStock: product.stock
      };
    }

    const key = AuthDemo.getActiveCartKey();
    let items = StorageEngine.getUserCart(key);
    const item = items.find(i => i.productId === productId);
    if (item) {
      item.quantity = qty;
      this.saveItems(items);
    }

    return { success: true };
  },

  // Remove single item from cart
  removeItem(productId) {
    const key = AuthDemo.getActiveCartKey();
    let items = StorageEngine.getUserCart(key);
    items = items.filter(i => i.productId !== productId);
    this.saveItems(items);
    return { success: true, message: "Item removed from cart." };
  },

  // Clear all items in cart
  clearCart() {
    const key = AuthDemo.getActiveCartKey();
    this.saveItems([]);
    return { success: true };
  },

  // Get total count of units in cart
  getItemCount() {
    const items = this.getItems();
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  },

  // Calculate cart summary (subtotal, shipping, savings, total)
  getCartSummary() {
    const items = this.getItems();
    const settings = StorageEngine.getSettings();

    let subtotal = 0;
    let standardSubtotal = 0; // Total if no volume tiers applied

    items.forEach(item => {
      subtotal += item.totalPrice;
      standardSubtotal += (item.basePrice * item.quantity);
    });

    const tieredSavings = Math.max(0, standardSubtotal - subtotal);
    const freeDeliveryThreshold = settings.freeDeliveryThreshold || 800;
    const shippingFee = (subtotal >= freeDeliveryThreshold || subtotal === 0) ? 0 : 50.00;
    const minOrderValue = settings.minOrderValue || 250;
    const isMinOrderMet = subtotal >= minOrderValue;
    const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

    const total = subtotal + shippingFee;

    return {
      itemCount: items.length,
      totalUnits: this.getItemCount(),
      subtotal: subtotal,
      standardSubtotal: standardSubtotal,
      tieredSavings: tieredSavings,
      shippingFee: shippingFee,
      freeDeliveryThreshold: freeDeliveryThreshold,
      remainingForFreeDelivery: remainingForFreeDelivery,
      minOrderValue: minOrderValue,
      isMinOrderMet: isMinOrderMet,
      total: total
    };
  },

  // Validate cart before checkout
  validateCartForCheckout() {
    const items = this.getItems();
    if (items.length === 0) {
      return { valid: false, message: "Your wholesale cart is empty." };
    }

    // Check MOQ for all items
    for (let item of items) {
      const prod = StorageEngine.getProductById(item.productId);
      if (!prod) {
        return { valid: false, message: `Product ${item.name} is no longer available.` };
      }
      if (item.quantity < prod.moq) {
        return { valid: false, message: `Minimum order for ${prod.name} is ${prod.moq} ${prod.unit}. Current quantity: ${item.quantity}.` };
      }
      if (item.quantity > prod.stock) {
        return { valid: false, message: `Stock exceeded for ${prod.name}. Available: ${prod.stock}, In Cart: ${item.quantity}.` };
      }
    }

    const summary = this.getCartSummary();
    if (!summary.isMinOrderMet) {
      return { valid: false, message: `Minimum wholesale order value is RM ${summary.minOrderValue.toFixed(2)}. Your current subtotal is RM ${summary.subtotal.toFixed(2)}.` };
    }

    return { valid: true };
  },

  // Place order from current cart
  checkout(checkoutDetails) {
    const validation = this.validateCartForCheckout();
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    const session = AuthDemo.getSession();
    const items = this.getItems();
    const summary = this.getCartSummary();

    const orderItems = items.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.unitPrice,
      quantity: item.quantity,
      total: item.totalPrice
    }));

    const orderData = {
      buyerId: session && session.buyerId ? session.buyerId : "guest-buyer",
      buyerCompany: checkoutDetails.companyName || (session ? session.companyName : "Guest B2B Buyer"),
      buyerEmail: checkoutDetails.email || (session ? session.email : "guest@buyer.my"),
      buyerPhone: checkoutDetails.phone || "",
      items: orderItems,
      subtotal: summary.subtotal,
      shippingFee: summary.shippingFee,
      tax: 0,
      total: summary.total,
      paymentMethod: checkoutDetails.paymentMethod || "Net 30 Terms",
      paymentStatus: (checkoutDetails.paymentMethod === "Direct Bank Transfer (Instant DuitNow)") ? "Paid (Simulated)" : "Pending Invoice",
      orderStatus: "Pending Review",
      deliveryDate: checkoutDetails.deliveryDate || "",
      deliveryAddress: checkoutDetails.deliveryAddress || "",
      notes: checkoutDetails.notes || "Standard cold-chain delivery requested."
    };

    const savedOrder = StorageEngine.saveOrder(orderData);

    // Clear cart after successful checkout
    this.clearCart();

    return {
      success: true,
      order: savedOrder,
      message: `Wholesale order ${savedOrder.id} placed successfully!`
    };
  },

  // Dispatch cart change event
  dispatchCartChangeEvent() {
    const event = new CustomEvent("rte_cart_changed", {
      detail: {
        count: this.getItemCount(),
        summary: this.getCartSummary()
      }
    });
    window.dispatchEvent(event);
  }
};
