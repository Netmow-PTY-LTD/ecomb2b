# AI Agent Prompt — RTE Food Wholesale B2B Demo Application

**Role:** You are a senior full-stack developer, UI/UX designer, and B2B e-commerce software architect.

**Objective:** Build a complete, modern, responsive, fully interactive demo application for a Malaysian **Ready-to-Eat (RTE) Food Wholesale Business**, including a public website, B2B buyer portal, and admin dashboard.

## 1. Reference Websites

Study these sites for design and business inspiration:

- https://texasbbqbarn.com/
- https://kitchensolution.my/

Take inspiration from premium food product presentation, wholesale product catalogues, RTE frozen food packaging, corporate F&B branding, HORECA supply, business partnerships, and bulk purchasing.

Create an original design. Do not copy their branding, logos, or proprietary content.

## 2. Technology Stack

Use only:

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Browser localStorage for temporary data persistence
- Optional Chart.js, Google Fonts, and Lucide icons through CDN

No React, Vue, Angular, PHP, databases, Firebase, Supabase, backend APIs, or paid services.

The application must be runnable as a static website using a simple local server. All demo functionality should operate entirely inside the browser.

## 3. UI/UX Design

Create a premium Malaysian B2B food supply website with a modern corporate look.

Suggested brand colours:

- Deep Forest Green: `#123D32`
- Warm Cream: `#FAF8F2`
- Food Orange: `#E87932`
- Charcoal: `#202725`
- White: `#FFFFFF`

Use professional typography (Plus Jakarta Sans or Inter), high-quality food imagery, modern cards, subtle transitions, spacious layouts, and attractive CTA buttons.

Design for desktop, tablet, and mobile.

## 4. Public Website

Build the following pages:

**Homepage:** Premium hero banner, introduction, featured products, product categories, company capabilities, key benefits, food preparation and packaging, wholesale ordering process, customer industries, wholesale partnerships, testimonials marked as sample data, FAQs, contact CTA, and footer.

**About Us:** Company background, mission and vision, business capabilities, production, packaging, food safety, cold-chain supply, and industry solutions.

**Product Catalogue:** Product grid, search, category filters, sorting, stock indicators, MOQ, wholesale pricing, and product enquiry buttons.

**Product Details:** Image gallery, SKU, description, pricing, wholesale tiers, MOQ, ingredients, allergens, pack size, shelf life, storage and preparation instructions, quantity selection, add to cart, and request quote.

**Wholesale Partnership:** Explain the benefits of becoming a business buyer, eligibility, registration, bulk pricing, and supply process.

**Contact Us:** Contact information, WhatsApp integration, enquiry form, address, map placeholder, and business enquiry submission.

Use at least 15 fictional demonstration RTE products across categories such as Frozen Food, Ready-to-Eat Meals, Smoked Meats, Marinated Products, Sauces, and Combo Packs.

## 5. B2B Buyer Portal

Build a functional buyer experience.

**Business Registration**

Collect company name, registration number, contact person, phone, email, business type, delivery address, state, postcode, and demo password. New buyers receive Pending Approval status.

**Login**

Provide sample demo accounts for Admin, Approved Buyer, and Pending Buyer. Use localStorage-based simulated authentication only.

**Buyer Dashboard**

Show total orders, pending orders, recent quotations, account approval status, quick reorder, recommended products, and recent activity.

**Wholesale Cart**

Support adding products, updating quantities, MOQ validation, volume-based price tiers, removing products, total calculations, and cart persistence.

**Wholesale Checkout**

Include delivery information, preferred delivery date, order summary, simulated bank transfer/payment terms, and order confirmation. Generate unique order IDs and save orders locally.

**Orders**

Buyers can view order history, details, status updates, and reorder previous purchases.

**Quotation Requests**

Buyers can request custom bulk prices. Admin can respond with a quotation, and buyers can accept it and convert it into a demo order.

**Profile**

Allow buyers to update their company information and delivery details.

## 6. Admin Dashboard

Create a professional management dashboard with a responsive sidebar.

**Overview:** Total buyers, orders, products, quotations, enquiries, low-stock products, estimated sales, charts, and recent activities.

**Product Management:** Complete add, edit, delete, price, image, SKU, stock, category, MOQ, tier pricing, and visibility controls.

**Category Management:** Add, edit, and delete product categories.

**Buyer Management:** View business registrations, filter buyers, approve or reject accounts, and inspect business details.

**Order Management:** View orders, update order and simulated payment statuses, inspect items, add notes, and print order summaries.

**Quotation Management:** Review enquiries, create custom quotes, modify line-item pricing, send simulated quotes to the buyer portal, and track acceptance.

**Inventory:** Track stock quantities, edit stock, identify low-stock products, and prevent negative inventory.

**Contact Enquiries:** View and manage all submitted messages.

**Website Settings:** Update company name, logo placeholder, contact information, WhatsApp number, address, hero text, social links, and announcement bar.

**Reports:** Show monthly orders, revenue, best-selling products, registration trends, and quotation statistics using demo data.

## 7. Important Working Processes

Implement these complete interactive workflows:

1. **Registration:** Visitor → Register Business → Pending Approval → Admin Approves → Buyer Access.
2. **Ordering:** Approved Buyer → Browse Products → Add to Cart → Checkout → Place Demo Order → Admin Reviews → Update Status → Buyer Sees Status.
3. **Quotation:** Buyer → Request Quote → Admin Creates Quote → Buyer Accepts → Convert to Order.
4. **Management:** Admin Adds or Edits Product → Catalogue Updates Immediately.
5. **Enquiries:** Visitor Submits Contact Form → Admin Receives and Manages Enquiry.

## 8. localStorage Requirements

Use namespaced storage keys:

```javascript
rte_demo_products
rte_demo_categories
rte_demo_buyers
rte_demo_session
rte_demo_carts
rte_demo_orders
rte_demo_quotes
rte_demo_enquiries
rte_demo_settings
rte_demo_inventory_logs
rte_demo_seed_version
```

Create reusable helpers for loading data, saving data, generating IDs, validating MOQ, calculating pricing, retrieving the active demo user, and resetting sample data.

Data must survive refreshes in the same browser. Seed the database only on first launch or explicit reset, without overwriting user-made changes.

Use error handling for corrupted data and storage limits.

## 9. Demo Data

Seed the application with:

- 15+ sample food products
- 6 product categories
- 4 sample B2B buyers with different approval states
- 10 sample wholesale orders
- 5 quotation requests
- 5 customer enquiries
- Inventory and sales data for dashboard charts

All product information, company identities, certifications, reviews, transactions, and business statistics must be fictional and clearly indicated as demonstration content.

Use Malaysian Ringgit (RM) throughout.

## 10. Project Structure

Provide complete source files, organised approximately as:

```text
rte-wholesale-demo/
├── index.html
├── about.html
├── products.html
├── product.html
├── wholesale.html
├── contact.html
├── login.html
├── register.html
├── buyer.html
├── admin.html
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   └── dashboard.css
│   ├── js/
│   │   ├── data.js
│   │   ├── storage.js
│   │   ├── auth-demo.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   ├── buyer.js
│   │   ├── admin.js
│   │   └── app.js
│   └── images/
└── README.md
```

You may improve this file structure if needed.

## 11. Technical and Functional Standards

- Every navigation item, button, and form must work.
- Mobile layouts must be responsive.
- Include form validation, success/error notifications, empty states, and confirmation dialogs.
- Product changes should update the buyer-facing catalogue.
- Prices, cart totals, MOQ, and stock must calculate correctly.
- Changes must persist after refresh.
- Use semantic HTML and accessible interactions.
- Include basic SEO metadata and descriptive alt text.
- Add a Reset Demo Data button with confirmation.
- Provide working demo access instructions.
- Do not leave core features as placeholders or TODOs.

**Security limitation:** This is a front-end-only prototype. localStorage authentication and client-side permissions are not secure. Use only fictional users and non-sensitive sample data. Do not collect genuine passwords or payment card details. Payments, quote delivery, business approval, and other actions are simulated, not real transactions. Clearly identify these limitations in the interface and documentation.

Do not falsely claim genuine certifications, payment integration, email delivery, analytics, or server-side functionality.

## 12. Acceptance Tests

Verify that:

- Buyer registration appears in the admin dashboard.
- Admin can approve a buyer.
- Approved buyer can place a wholesale order.
- MOQ, stock, and quantity-based prices work.
- Cart and orders survive browser refreshes.
- Admin updates appear in the buyer portal.
- Quotation requests can be answered and accepted.
- Admin product changes appear in the catalogue.
- Contact enquiries appear in the dashboard.
- Inventory never goes negative.
- Website settings update public content.
- The website functions on mobile and desktop.

## 13. Final Deliverable

Build the **complete application**, not just a design mockup.

Provide all working HTML, CSS, and JavaScript files, sample data, product images or reliable placeholders, and a README explaining how to run the application locally.

The final result must look like a polished, client-ready Malaysian B2B food wholesale platform that can demonstrate the entire business process, from company presentation and wholesale product discovery to buyer registration, quotation, ordering, and admin management.

**Start building the actual application now. Do not stop after presenting a plan.**

https://chatgpt.com/c/6afad1ac-2310-83ee-b2e0-2301c0f7c910#:~:text=Suggested%20demo%20navigation,Reports