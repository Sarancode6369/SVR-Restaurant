/* =========================================================
   Tiffin Center — app.js
   Shared config, storage helpers, table detection, toasts.
   Loaded on every customer + admin page before other scripts.
   ========================================================= */

const TC = {
  GST_RATE: 0.05,
  RESTAURANT_NAME: "SVR பாரம்பரிய உணவகம்",
  RESTAURANT_TAGLINE: "புதுமையும் சுவையும் நிறைந்த தென்னிந்திய உணவகம்",
  RESTAURANT_ADDRESS: "24, Madurai Road, Manapparai - 621310",
  RESTAURANT_PHONE: "+91 8838909720",
  KEYS: {
    MENU: "tiffin_menu",
    CART: "tiffin_cart",
    ORDERS: "tiffin_orders",
    TABLES: "tiffin_tables",
    BILLS: "tiffin_bills",
    CURRENT_TABLE: "tiffin_current_table",
    MY_ORDER_IDS: "tiffin_my_order_ids"
  }
};

/* ---------------- Storage helpers ---------------- */

function tcGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error("tcGet error for key", key, e);
    return fallback;
  }
}

function tcSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error("tcSet error for key", key, e);
    return false;
  }
}

/* ---------------- ID / formatting helpers ---------------- */

function tcGenerateOrderId() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const datePart = `${y}${m}${day}`;
  const orders = tcGet(TC.KEYS.ORDERS, []);
  const todayCount = orders.filter(o => o.orderId.includes(datePart)).length + 1;
  return `ORD-${datePart}-${String(todayCount).padStart(3, "0")}`;
}

function tcGenerateItemId() {
  return "ITEM-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function tcFormatCurrency(num) {
  const n = Number(num) || 0;
  return "₹" + n.toFixed(2);
}

function tcFormatDateTime(iso) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true
  });
}

function tcEscapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

/* ---------------- Table detection ---------------- */

function tcGetTableFromURL() {
  const params = new URLSearchParams(window.location.search);
  const t = params.get("table");
  if (!t) return null;
  const n = parseInt(t, 10);
  if (isNaN(n) || n < 1 || n > 6) return null;
  return n;
}

// Called on every customer page load: syncs ?table= into persistent storage
function tcResolveCurrentTable() {
  const fromUrl = tcGetTableFromURL();
  if (fromUrl) {
    tcSet(TC.KEYS.CURRENT_TABLE, fromUrl);
    tcSetTableStatus(fromUrl, "Occupied");
    return fromUrl;
  }
  return tcGet(TC.KEYS.CURRENT_TABLE, null);
}

function tcSetTableStatus(number, status) {
  const tables = tcGet(TC.KEYS.TABLES, []);
  const t = tables.find(tb => tb.number === number);
  if (t) {
    t.status = status;
    tcSet(TC.KEYS.TABLES, tables);
  }
}

/* ---------------- Toast notifications ---------------- */

function tcToast(message, type = "success") {
  let container = document.getElementById("tc-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "tc-toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `tc-toast tc-toast-${type}`;
  const icon = type === "success" ? "fa-circle-check" : type === "error" ? "fa-circle-exclamation" : "fa-circle-info";
  toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${tcEscapeHtml(message)}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

/* ---------------- Cart badge (header, all pages) ---------------- */

function tcCartItemCount() {
  const cart = tcGet(TC.KEYS.CART, { items: [] });
  return (cart.items || []).reduce((sum, i) => sum + i.qty, 0);
}

function tcUpdateCartBadge() {
  const badges = document.querySelectorAll("[data-cart-badge]");
  const count = tcCartItemCount();
  badges.forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? "inline-flex" : "none";
  });
}

function tcTableOptionsHtml(selectedValue) {
  const tables = tcGet(TC.KEYS.TABLES, [1, 2, 3, 4, 5, 6].map(n => ({ number: n })));
  let html = `<option value="">Select Table</option>`;
  tables.forEach(t => {
    html += `<option value="${t.number}" ${String(t.number) === String(selectedValue) ? "selected" : ""}>Table ${t.number}</option>`;
  });
  return html;
}

function tcUpdateTableDisplay() {
  const table = tcGet(TC.KEYS.CURRENT_TABLE, null);
  document.querySelectorAll("[data-table-display]").forEach(el => {
    el.textContent = table ? `Table ${table}` : "No table selected";
  });
  document.querySelectorAll("[data-table-select]").forEach(el => {
    el.innerHTML = tcTableOptionsHtml(table);
  });
  document.querySelectorAll("[data-table-required-hint]").forEach(el => {
    el.style.display = table ? "none" : "block";
  });
}

// Delegated so it keeps working even after the header is re-rendered
function tcInitTableSelect() {
  document.addEventListener("change", (e) => {
    const el = e.target.closest("[data-table-select]");
    if (!el) return;
    const val = parseInt(el.value, 10);
    if (!val || val < 1 || val > 6) return;
    tcSet(TC.KEYS.CURRENT_TABLE, val);
    tcSetTableStatus(val, "Occupied");
    tcUpdateTableDisplay();
    tcToast(`Table ${val} selected`, "success");
  });
}

/* ---------------- Seed default data ---------------- */

function tcSeedData() {
  if (!localStorage.getItem(TC.KEYS.MENU)) {
    const menu = [
      { id: tcGenerateItemId(), name: "Idli", category: "Idli", description: "Steamed rice cakes served with chutney & sambar.", price: 40, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80", available: true },
      { id: tcGenerateItemId(), name: "Vada", category: "Vada", description: "Crispy golden lentil doughnuts, served hot.", price: 30, image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400&q=80", available: true },
      { id: tcGenerateItemId(), name: "Plain Dosa", category: "Dosa", description: "Thin crispy rice crepe, a South Indian classic.", price: 50, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80", available: true },
      { id: tcGenerateItemId(), name: "Masala Dosa", category: "Dosa", description: "Crispy dosa filled with spiced potato masala.", price: 70, image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80", available: true },
      { id: tcGenerateItemId(), name: "Ghee Dosa", category: "Dosa", description: "Dosa roasted golden in aromatic pure ghee.", price: 80, image: "https://images.unsplash.com/photo-1694849789720-b5e0e0ab5a3d?w=400&q=80", available: true },
      { id: tcGenerateItemId(), name: "Pongal", category: "Breakfast", description: "Comforting rice & lentil porridge with cashew & pepper.", price: 60, image: "https://images.unsplash.com/photo-1626777553635-c9c0c9b0a1a3?w=400&q=80", available: true },
      { id: tcGenerateItemId(), name: "Poori", category: "Poori", description: "Fluffy deep-fried bread with potato curry.", price: 60, image: "https://images.unsplash.com/photo-1626200926749-2734bfe3f18b?w=400&q=80", available: true },
      { id: tcGenerateItemId(), name: "Chapathi", category: "Breakfast", description: "Soft whole-wheat flatbread, served with kurma.", price: 50, image: "https://images.unsplash.com/photo-1619895092538-128341789043?w=400&q=80", available: true },
      { id: tcGenerateItemId(), name: "Veg Meals", category: "Rice", description: "Full meals with rice, sambar, rasam, poriyal & curd.", price: 100, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80", available: true },
      { id: tcGenerateItemId(), name: "Lemon Rice", category: "Rice", description: "Tangy turmeric rice tempered with mustard & curry leaves.", price: 60, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&q=80", available: true },
      { id: tcGenerateItemId(), name: "Curd Rice", category: "Rice", description: "Cooling curd rice tempered with mustard seeds.", price: 50, image: "https://images.unsplash.com/photo-1626132647971-fc60b3fbd11f?w=400&q=80", available: true },
      { id: tcGenerateItemId(), name: "Tea", category: "Beverages", description: "Hot South Indian filter-style milk tea.", price: 20, image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&q=80", available: true },
      { id: tcGenerateItemId(), name: "Coffee", category: "Beverages", description: "Strong South Indian filter coffee with frothy milk.", price: 25, image: "https://images.unsplash.com/photo-1621371205896-b13f3f1b4e18?w=400&q=80", available: true },
      { id: tcGenerateItemId(), name: "Fresh Juice", category: "Beverages", description: "Seasonal fresh fruit juice, no added sugar.", price: 50, image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80", available: true }
    ];
    tcSet(TC.KEYS.MENU, menu);
  }

  if (!localStorage.getItem(TC.KEYS.TABLES)) {
    const tables = [1, 2, 3, 4, 5, 6].map(n => ({ number: n, status: "Available" }));
    tcSet(TC.KEYS.TABLES, tables);
  }

  if (!localStorage.getItem(TC.KEYS.CART)) {
    tcSet(TC.KEYS.CART, { items: [] });
  }

  if (!localStorage.getItem(TC.KEYS.ORDERS)) {
    tcSet(TC.KEYS.ORDERS, []);
  }

  if (!localStorage.getItem(TC.KEYS.BILLS)) {
    tcSet(TC.KEYS.BILLS, []);
  }

  if (!localStorage.getItem(TC.KEYS.MY_ORDER_IDS)) {
    tcSet(TC.KEYS.MY_ORDER_IDS, []);
  }
}

/* ---------------- Mobile nav toggle (shared) ---------------- */

function tcInitNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("open");
      toggle.classList.toggle("open");
    });
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.classList.remove("open");
    }));
  }
}

/* ---------------- Shared header / footer injection ---------------- */

function tcHeaderNavLinks(basePath) {
  return [
    { href: `${basePath}index.html`, label: "Home", key: "home" },
    { href: `${basePath}menu.html`, label: "Menu", key: "menu" },
    { href: `${basePath}cart.html`, label: "Cart", key: "cart", cart: true },
    { href: `${basePath}orders.html`, label: "My Orders", key: "orders" }
  ];
}

function tcRenderHeader() {
  const mount = document.getElementById("tc-header");
  if (!mount) return;
  const active = mount.dataset.active || "";
  const basePath = mount.dataset.base || "";
  const links = tcHeaderNavLinks(basePath);
  const linkHtml = links.map(l => `
    <a href="${l.href}" class="${l.key === active ? "active" : ""}">
      ${l.label}
      ${l.cart ? `<span class="tc-badge" data-cart-badge>0</span>` : ""}
    </a>
  `).join("");

  const currentTable = tcGet(TC.KEYS.CURRENT_TABLE, null);

  mount.innerHTML = `
    <div class="tc-header-inner">
      <a href="${basePath}index.html" class="tc-logo">
        <span class="tumbler"></span> ${TC.RESTAURANT_NAME}
      </a>
      <nav class="tc-nav" data-nav-menu>
        ${linkHtml}
        <span class="tc-table-chip">
          <i class="fa-solid fa-utensils"></i>
          <select data-table-select aria-label="Select your table">${tcTableOptionsHtml(currentTable)}</select>
        </span>
      </nav>
      <button class="tc-nav-toggle" data-nav-toggle aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  `;
}

function tcRenderFooter() {
  const mount = document.getElementById("tc-footer");
  if (!mount) return;
  mount.innerHTML = `
    <div class="container">
      <div><strong>${TC.RESTAURANT_NAME}</strong> — ${tcEscapeHtml(TC.RESTAURANT_ADDRESS)}</div>
      <div><i class="fa-solid fa-phone"></i> ${tcEscapeHtml(TC.RESTAURANT_PHONE)}</div>
    </div>
  `;
}

/* ---------------- Init on every page ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  tcSeedData();
  tcResolveCurrentTable();
  tcRenderHeader();
  tcRenderFooter();
  tcUpdateCartBadge();
  tcUpdateTableDisplay();
  tcInitNav();
  tcInitTableSelect();
});
