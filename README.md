# DapurWarisan RTE Wholesale (M) Sdn Bhd — B2B Food Wholesale Application

A complete, modern, responsive, and fully interactive demonstration platform for a Malaysian **Ready-to-Eat (RTE) Food Wholesale Business**, catering to hotels, restaurant chains, catering operators, and retail convenience marts.

Built entirely with standard web technologies (**HTML5**, **CSS3**, and **Vanilla JavaScript ES6+**) and backed by browser `localStorage` for temporary persistence. No external backend, node servers, or paid cloud APIs are required.

---

## 🌟 Application Architecture & The Three Pillars

The application implements the three core pillars shown in the system overview:

```
                              ┌────────────────────────────────────────┐
                              │           RTE Wholesale Hub            │
                              │           Main Application             │
                              └────────────────────────────────────────┘
                                    │              │              │
                   ┌────────────────┘              │              └────────────────┐
                   ▼                               ▼                               ▼
       ┌───────────────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
       │    Public Website     │       │     Buyer Portal      │       │    Admin Dashboard    │
       ├───────────────────────┤       ├───────────────────────┤       ├───────────────────────┤
       │ • Homepage            │       │ • Business Register   │       │ • Overview & Metrics  │
       │ • About Us            │       │ • Buyer Dashboard     │       │ • Wholesale Products  │
       │ • Product Catalogue   │       │ • Cart & Checkout     │       │ • Product Categories  │
       │ • Product Details     │       │ • Order History       │       │ • Buyer Approvals     │
       │ • Wholesale & OEM     │       │ • Quotations          │       │ • Order Fulfillment   │
       │ • Contact & Enquiries │       │ • Company Profile     │       │ • Volume Quotations   │
       │                       │       │                       │       │ • Live Inventory      │
       │                       │       │                       │       │ • Customer Inquiries  │
       │                       │       │                       │       │ • Website Settings    │
       │                       │       │                       │       │ • Sales Reports       │
       └───────────────────────┘       └───────────────────────┘       └───────────────────────┘
                                    │              │              │
                                    └──────────────┼──────────────┘
                                                   ▼
                                 ┌───────────────────────────────────┐
                                 │   Shared Browser localStorage     │
                                 │     (Real-Time Synchronized)      │
                                 └───────────────────────────────────┘
```

---

## 🚀 How to Run the Application Locally

Since this application is built with standard HTML5, CSS3, and modern ES6 JavaScript, you can run it instantly using any static web server:

### Option 1: Python HTTP Server (Recommended)
Open a terminal in the project directory:
```bash
python -m http.server 8000
```
Then open your browser and navigate to:
```
http://localhost:8000
```

### Option 2: Node.js (npx serve or http-server)
```bash
npx serve .
# or
npx http-server -p 8000
```

### Option 3: VS Code Live Server
Right-click on `index.html` and choose **"Open with Live Server"**.

---

## 🔑 Pre-Configured Demo Personas & Credentials

The application provides instant 1-click persona switching on every page via the floating **"Demo Hub"** button (bottom-right) or the **"Demo Hub"** pill in the top navigation bar.

| Role | Company / Name | Email | Password | Features / Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin HQ** | Chef Azman (Supply Chain HQ) | `admin@dapurwarisan.my` | `admin123` | Full CRUD over products, categories, buyer approvals, order fulfillment, custom quotation pricing, stock audits, website settings, and analytics. |
| **Approved Buyer** | Sunway Bistro & Bar F&B Sdn Bhd | `sunway@bistro.my` | `buyer123` | Verified B2B partner with **Net 30 Days commercial credit**, live cart, volume tier pricing, and instant PO placement. |
| **Pending Buyer** | Melaka Heritage Kopitiam Enterprise | `melaka@kopitiam.my` | `buyer123` | New B2B registration awaiting SSM verification. Can view dashboard notice and pending quotations. |
| **Hotel Buyer** | Grand Borneo Hotel & Suites | `procurement@grandborneo.com` | `buyer123` | Enterprise resort buyer with **Net 45 credit line** and high-volume order history. |
| **Guest / Visitor** | Public Prospect | N/A | N/A | Browse catalogue, view tiered pricing, simulate adding to cart, submit business enquiries, and apply for a B2B account. |

---

## 🔄 Interactive End-to-End Workflows to Test

### 1. B2B Registration & Admin Approval
1. Navigate to [register.html](file:///d:/Tuhin/New%20Project/register.html) as a new visitor.
2. Fill out the business application (Company Name, SSM number, PIC, phone, delivery address, state, and password).
3. Submit the application — an alert indicates the account is now **Pending Approval**.
4. Open the **Demo Hub** and switch to **Admin (Chef Azman HQ)**.
5. In the Admin Dashboard, click on **B2B Buyer Accounts** (`admin.html?tab=buyers`).
6. Locate the new applicant and click **Approve Business Account**.
7. Switch back to the Buyer Portal — the account is now verified with active **Net 30 commercial terms**!

### 2. Wholesale Ordering & Cold-Chain Fulfillment
1. As an approved buyer, browse [products.html](file:///d:/Tuhin/New%20Project/products.html).
2. Filter by category (e.g. *Ready-to-Eat Retort Meals* or *Smoked Meats*).
3. Open a product detail page like [product.html?id=prod-001](file:///d:/Tuhin/New%20Project/product.html?id=prod-001).
4. Notice the **Volume Pricing Tiers**:
   - Standard: RM 38.00 / pack (MOQ 5)
   - Tier 1 (10–49 units): RM 34.50 / pack
   - Tier 2 (50+ units): RM 31.00 / pack
5. Adjust the quantity to 50 — observe the live calculation update to the Tier 2 discounted rate.
6. Click **Add to Wholesale Cart**.
7. Navigate to the Wholesale Cart (`buyer.html?tab=cart`), fill in preferred cold-chain delivery date, select **Commercial Credit (Net 30)**, and click **Submit Wholesale Purchase Order**.
8. A unique order ID (`RTE-ORD-2026-XXX`) is generated, inventory is deducted, and a commercial invoice is ready to print.
9. Switch to Admin (`admin.html?tab=orders`) to mark the order as **Processing & Packing** or **Out for Cold-Chain Delivery**. The buyer's order history updates immediately!

### 3. Custom High-Volume Quotation Negotiation
1. On [product.html](file:///d:/Tuhin/New%20Project/product.html), click **Request High-Volume Custom Quote (500+ Units)**.
2. Enter desired quantity (e.g. 500 units) and target delivery schedule, then submit.
3. Open the Admin Console under **Volume Quotations** (`admin.html?tab=quotes`).
4. Review the quote request, provide a special discounted unit price (e.g. RM 28.00), set an expiry date, and submit back to the buyer.
5. In the Buyer Portal under **Custom Quotations** (`buyer.html?tab=quotes`), review the approved quote and click **Accept & Convert to Order Now**. A purchase order is automatically created!

### 4. Real-Time Admin Product & Website Settings Editing
1. In Admin under **Wholesale Products** (`admin.html?tab=products`), click **Edit** on any item or click **Add New RTE Product**.
2. Change the price, stock, or description and click **Save Changes**.
3. Open [products.html](file:///d:/Tuhin/New%20Project/products.html) in another tab — the changes appear instantly without requiring any server rebuild!
4. Under **Website Settings** (`admin.html?tab=settings`), update the company announcement bar, hero text, or WhatsApp hotline. The public website headers update dynamically.

### 5. Contact Enquiries to Admin
1. On [contact.html](file:///d:/Tuhin/New%20Project/contact.html), submit a sample tasting kit request.
2. In Admin under **Inquiries & Tastings** (`admin.html?tab=enquiries`), view the message, update the status to *Replied*, and record internal follow-up notes.

### 6. Commercial Invoice & Packing Advice (`invoice.html`)
1. Click **"Print Commercial Invoice"** or the printer icon on any order in the Buyer Portal (`buyer.html?tab=orders`) or Admin Dashboard (`admin.html?tab=orders`).
2. Opens a dedicated, real page: [invoice.html?id=RTE-ORD-2026-001](file:///d:/Tuhin/New%20Project/invoice.html?id=RTE-ORD-2026-001) instead of an ephemeral `about:blank` window.
3. Fully persistent: reloading or bookmarking the URL keeps all line items, cold-chain logistics schedule, and customer billing information intact directly from browser `localStorage`.
4. Includes an order switcher dropdown in the toolbar, print/save PDF button (`@media print` clean formatting), Halal/HACCP certifications, and DuitNow / Maybank remittance details.

---

## 🗄️ Storage Schema & Local Storage Keys

All data is stored with clean namespace keys in browser `localStorage`:

| Storage Key | Description |
| :--- | :--- |
| `rte_demo_products` | 16+ RTE products across 6 categories with MOQ, stock, and tiered pricing |
| `rte_demo_categories` | 6 product categories (RTE Meals, Smoked Meats, Marinated, Frozen, Sauces, Combos) |
| `rte_demo_buyers` | Registered B2B companies with SSM numbers, addresses, and approval statuses |
| `rte_demo_session` | Active logged-in demo persona |
| `rte_demo_carts` | Persistent shopping carts indexed per buyer |
| `rte_demo_orders` | Wholesale purchase orders with line items, delivery dates, and fulfillment statuses |
| `rte_demo_quotes` | B2B volume quotation requests and admin rate responses |
| `rte_demo_enquiries` | Inbound contact forms and sample tasting kit requests |
| `rte_demo_settings` | Company details, WhatsApp number, announcement banner, and hero copy |
| `rte_demo_inventory_logs` | Audit trail of all production runs and order stock deductions |
| `rte_demo_seed_version` | Internal versioning to safely seed initial demonstration data |

### ↺ Resetting Demo Data
To restore the database to its pristine factory demonstration state at any time:
- Click the **"Reset Demo Data"** button in the **Demo Hub**, in the **Admin Console Topbar**, or in the **Website Footer**.

---

## 🎨 Design System & Malaysian Brand Identity

- **Deep Forest Green** (`#123D32`): Conveys corporate stability, Halal compliance, and agricultural freshness.
- **Food Orange** (`#E87932`): Warm culinary appetite accent for call-to-actions and buttons.
- **Warm Cream** (`#FAF8F2`): Modern premium background providing soft contrast.
- **Charcoal** (`#202725`): High-legibility typography for complex B2B tables and specs.
- **Typography**: Google Font *Plus Jakarta Sans* for clean, modern corporate aesthetics.
- **Currency**: Malaysian Ringgit (`RM`) throughout.

---

## 🔒 Front-End Prototype Notice & Security Scope
This application is an interactive front-end prototype designed for client demonstration and stakeholder alignment. Authentication, credit checks, email dispatch, and payment transactions are simulated locally in the browser via `localStorage`. No actual financial transactions or live server communications occur.
