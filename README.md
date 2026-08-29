# Tiffin Center — QR-Based Tiffin Ordering Website

A complete, working, front-end-only food ordering system for a tiffin center.
Pure **HTML5 + CSS3 + Vanilla JavaScript + localStorage** — no backend, no build step.

---

## ✨ What's inside

**Customer site**
- `index.html` — Home / hero, detects the table from the QR link
- `menu.html` — Full menu, search + category filter, add to cart
- `cart.html` — Cart with quantity controls, subtotal / GST / total
- `checkout.html` — Customer details form → places the order
- `bill.html` — Auto-generated receipt (Print / Download PDF / New Order)
- `orders.html` — "My Orders" status tracker for this device

**Admin dashboard** (`/admin`)
- `dashboard.html` — Revenue, order & table stats, recent orders
- `menu.html` — Full CRUD for food items (add / edit / delete / search / filter)
- `orders.html` — Update order status (Pending → Preparing → Ready → Completed), view bill, delete
- `tables.html` — Table 1–6 status (Available / Occupied / Ordering) + QR preview
- `qr-codes.html` — Printable grid of all 6 table QR codes (Download / Print / Print All)

All data lives in the browser's `localStorage`:
`tiffin_menu`, `tiffin_cart`, `tiffin_orders`, `tiffin_tables`, `tiffin_bills`.
Sample menu + 6 tables are seeded automatically the first time the site loads.

---

## ▶️ How to run it in VS Code (Live Server)

1. Unzip this project and open the `tiffin-center` folder in VS Code.
2. Install the **"Live Server"** extension (by Ritwick Dey) from the Extensions tab, if you don't have it already.
3. Right-click `index.html` → **"Open with Live Server"**.
4. Your browser opens something like `http://127.0.0.1:5500/index.html`.
5. To simulate scanning a table's QR code, just visit e.g.
   `http://127.0.0.1:5500/index.html?table=3` — the site will show **"Table 3"** automatically.
6. Open `admin/dashboard.html` with Live Server to manage the restaurant.

> You need an internet connection the first time you load a page — Google Fonts, Font Awesome,
> the QR code library and the jsPDF library are loaded from public CDNs. Everything else
> (cart, orders, menu data) works fully offline after that, since it's all localStorage.

---

## 🚀 Deploying so real phones can scan the QR codes

`localhost` QR codes only work on your own computer. To let customers scan with their
**own phones**, deploy the site publicly — the QR codes are generated dynamically from
`window.location.origin`, so they update automatically, no code changes needed.

### Option A — GitHub Pages (free)
1. Create a new GitHub repository and push the contents of this folder to it.
2. In the repo, go to **Settings → Pages**.
3. Under **Source**, choose the `main` branch and `/ (root)` folder → **Save**.
4. GitHub gives you a URL like `https://your-username.github.io/tiffin-center/`.
5. Open `https://your-username.github.io/tiffin-center/admin/qr-codes.html` — the QR
   codes now encode that live URL. Print them and stick one on each table.

### Option B — Netlify (free)
1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Deploy manually**.
2. Drag and drop the `tiffin-center` folder onto the page.
3. Netlify gives you a URL like `https://your-site-name.netlify.app`.
4. Open `.../admin/qr-codes.html` on that domain and print the QR codes from there.

Either way — always generate/print the final QR codes **from the deployed URL**,
not from localhost, so the codes encode the real, scannable address.

---

## 🧾 Notes on the data model

- Each order gets an ID like `ORD-20260828-001` (date + daily sequence).
- GST is calculated at **5%** (edit `TC.GST_RATE` in `js/app.js` to change it).
- An order is tied to whichever table number was last opened via `?table=N` on that device,
  so two customers at different tables never get their orders mixed up.
- Marking an order **Completed** in the admin panel automatically frees up the table
  (`Available` status) for the next customer.
