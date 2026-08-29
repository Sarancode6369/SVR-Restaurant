/* =========================================================
   Tiffin Center — admin.js
   Shared by all admin/*.html pages.
   ========================================================= */

function tcInitAdminSidebar() {
  const toggle = document.querySelector("[data-admin-toggle]");
  const sidebar = document.querySelector("[data-admin-sidebar]");
  if (toggle && sidebar) {
    toggle.addEventListener("click", () => sidebar.classList.toggle("open"));
  }
}

function tcModalOpen(id) {
  document.getElementById(id).classList.add("open");
}
function tcModalClose(id) {
  document.getElementById(id).classList.remove("open");
}

/* =========================================================
   DASHBOARD (admin/dashboard.html)
   ========================================================= */

function tcRenderDashboardStats() {
  const grid = document.getElementById("dashboard-stats");
  if (!grid) return;
  const orders = tcGet(TC.KEYS.ORDERS, []);
  const tables = tcGet(TC.KEYS.TABLES, []);
  const menu = tcGet(TC.KEYS.MENU, []);

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const pendingCount = orders.filter(o => o.status === "Pending").length;
  const occupiedTables = tables.filter(t => t.status !== "Available").length;

  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon gold"><i class="fa-solid fa-receipt"></i></div>
      <div><div class="stat-value">${orders.length}</div><div class="stat-label">Total Orders</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green"><i class="fa-solid fa-indian-rupee-sign"></i></div>
      <div><div class="stat-value">${tcFormatCurrency(totalRevenue)}</div><div class="stat-label">Total Revenue</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon copper"><i class="fa-solid fa-hourglass-half"></i></div>
      <div><div class="stat-value">${pendingCount}</div><div class="stat-label">Pending Orders</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon blue"><i class="fa-solid fa-chair"></i></div>
      <div><div class="stat-value">${occupiedTables} / ${tables.length}</div><div class="stat-label">Tables Occupied</div></div>
    </div>
  `;

  const recentBody = document.getElementById("dashboard-recent-orders");
  if (recentBody) {
    const recent = [...orders].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)).slice(0, 6);
    recentBody.innerHTML = recent.length ? recent.map(o => `
      <tr>
        <td class="mono">${tcEscapeHtml(o.orderId)}</td>
        <td>Table ${o.table}</td>
        <td>${tcEscapeHtml(o.customerName)}</td>
        <td class="mono">${tcFormatCurrency(o.total)}</td>
        <td><span class="status-pill status-${o.status}">${o.status}</span></td>
      </tr>
    `).join("") : `<tr><td colspan="5" class="text-center" style="color:#8A7660;padding:24px;">No orders yet.</td></tr>`;
  }

  const menuCountEl = document.getElementById("dashboard-menu-count");
  if (menuCountEl) menuCountEl.textContent = menu.length;
}

/* =========================================================
   MENU MANAGEMENT (admin/menu.html)
   ========================================================= */

let tcMenuEditId = null;

function tcRenderMenuTable() {
  const tbody = document.getElementById("menu-table-body");
  if (!tbody) return;

  const search = (document.getElementById("menu-search-input")?.value || "").toLowerCase();
  const catFilter = document.getElementById("menu-category-filter")?.value || "";

  let items = tcGet(TC.KEYS.MENU, []);
  if (search) items = items.filter(i => i.name.toLowerCase().includes(search));
  if (catFilter) items = items.filter(i => i.category === catFilter);

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:30px;color:#8A7660;">No menu items found.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => `
    <tr>
      <td><img class="table-thumb" src="${tcEscapeHtml(item.image)}" alt="${tcEscapeHtml(item.name)}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80'"></td>
      <td><strong>${tcEscapeHtml(item.name)}</strong><br><span style="font-size:11.5px;color:#8A7660;">${tcEscapeHtml(item.description).slice(0, 40)}${item.description.length > 40 ? "…" : ""}</span></td>
      <td>${tcEscapeHtml(item.category)}</td>
      <td class="mono">${tcFormatCurrency(item.price)}</td>
      <td><span class="availability-badge ${item.available !== false ? "yes" : "no"}">${item.available !== false ? "Available" : "Sold Out"}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-action="edit" data-id="${item.id}" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn danger" data-action="delete" data-id="${item.id}" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (btn.dataset.action === "edit") tcOpenMenuModal(id);
      if (btn.dataset.action === "delete") tcDeleteMenuItem(id);
    });
  });
}

function tcPopulateCategoryFilter() {
  const select = document.getElementById("menu-category-filter");
  if (!select) return;
  const cats = tcAllCategories();
  select.innerHTML = `<option value="">All Categories</option>` + cats.map(c => `<option value="${tcEscapeHtml(c)}">${tcEscapeHtml(c)}</option>`).join("");
}

function tcOpenMenuModal(id = null) {
  tcMenuEditId = id;
  const form = document.getElementById("menu-item-form");
  form.reset();
  document.getElementById("menu-modal-title").textContent = id ? "Edit Food Item" : "Add Food Item";

  if (id) {
    const item = tcGet(TC.KEYS.MENU, []).find(i => i.id === id);
    if (item) {
      document.getElementById("item-name").value = item.name;
      document.getElementById("item-category").value = item.category;
      document.getElementById("item-description").value = item.description;
      document.getElementById("item-price").value = item.price;
      document.getElementById("item-image").value = item.image;
      document.getElementById("item-available").checked = item.available !== false;
    }
  } else {
    document.getElementById("item-available").checked = true;
  }
  tcModalOpen("menu-modal");
}

function tcSaveMenuItem(e) {
  e.preventDefault();
  const name = document.getElementById("item-name").value.trim();
  const category = document.getElementById("item-category").value.trim();
  const description = document.getElementById("item-description").value.trim();
  const price = parseFloat(document.getElementById("item-price").value);
  const image = document.getElementById("item-image").value.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
  const available = document.getElementById("item-available").checked;

  if (!name || !category || isNaN(price) || price <= 0) {
    tcToast("Please fill all required fields with valid values.", "error");
    return;
  }

  const menu = tcGet(TC.KEYS.MENU, []);
  if (tcMenuEditId) {
    const idx = menu.findIndex(i => i.id === tcMenuEditId);
    if (idx > -1) menu[idx] = { ...menu[idx], name, category, description, price, image, available };
    tcToast("Food item updated", "success");
  } else {
    menu.push({ id: tcGenerateItemId(), name, category, description, price, image, available });
    tcToast("Food item added", "success");
  }
  tcSet(TC.KEYS.MENU, menu);
  tcModalClose("menu-modal");
  tcPopulateCategoryFilter();
  tcRenderMenuTable();
}

function tcDeleteMenuItem(id) {
  if (!confirm("Delete this food item? This cannot be undone.")) return;
  let menu = tcGet(TC.KEYS.MENU, []);
  menu = menu.filter(i => i.id !== id);
  tcSet(TC.KEYS.MENU, menu);
  tcToast("Food item deleted", "info");
  tcRenderMenuTable();
}

/* =========================================================
   ORDER MANAGEMENT (admin/orders.html)
   ========================================================= */

const TC_ORDER_STATUSES = ["Pending", "Preparing", "Ready", "Completed"];

function tcRenderOrdersTable() {
  const tbody = document.getElementById("orders-table-body");
  if (!tbody) return;

  const statusFilter = document.getElementById("order-status-filter")?.value || "";
  const tableFilter = document.getElementById("order-table-filter")?.value || "";

  let orders = [...tcGet(TC.KEYS.ORDERS, [])].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  if (statusFilter) orders = orders.filter(o => o.status === statusFilter);
  if (tableFilter) orders = orders.filter(o => String(o.table) === tableFilter);

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:30px;color:#8A7660;">No orders found.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td class="mono">${tcEscapeHtml(o.orderId)}</td>
      <td>Table ${o.table}</td>
      <td>${tcEscapeHtml(o.customerName)}<br><span style="font-size:11px;color:#8A7660;">${tcEscapeHtml(o.mobile)}</span></td>
      <td style="max-width:180px;font-size:12px;color:#8A7660;">${o.items.map(i => `${tcEscapeHtml(i.name)} ×${i.qty}`).join(", ")}</td>
      <td class="mono">${tcFormatCurrency(o.total)}</td>
      <td style="font-size:12px;">${tcFormatDateTime(o.dateTime)}</td>
      <td>
        <select class="status-select" data-order-id="${o.orderId}">
          ${TC_ORDER_STATUSES.map(s => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </td>
      <td>
        <div class="row-actions">
          <a class="icon-btn" href="../bill.html?order=${encodeURIComponent(o.orderId)}" target="_blank" aria-label="View Bill"><i class="fa-solid fa-receipt"></i></a>
          <button class="icon-btn danger" data-action="delete-order" data-id="${o.orderId}" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll(".status-select").forEach(sel => {
    sel.addEventListener("change", () => tcUpdateOrderStatus(sel.dataset.orderId, sel.value));
  });
  tbody.querySelectorAll('[data-action="delete-order"]').forEach(btn => {
    btn.addEventListener("click", () => tcDeleteOrder(btn.dataset.id));
  });
}

function tcUpdateOrderStatus(orderId, status) {
  const orders = tcGet(TC.KEYS.ORDERS, []);
  const order = orders.find(o => o.orderId === orderId);
  if (!order) return;
  order.status = status;
  tcSet(TC.KEYS.ORDERS, orders);
  if (status === "Completed") tcSetTableStatus(order.table, "Available");
  tcToast(`Order ${orderId} marked ${status}`, "success");
  tcRenderOrdersTable();
}

function tcDeleteOrder(orderId) {
  if (!confirm(`Delete order ${orderId}? This cannot be undone.`)) return;
  let orders = tcGet(TC.KEYS.ORDERS, []);
  orders = orders.filter(o => o.orderId !== orderId);
  tcSet(TC.KEYS.ORDERS, orders);
  tcToast("Order deleted", "info");
  tcRenderOrdersTable();
}

/* =========================================================
   TABLE MANAGEMENT (admin/tables.html)
   ========================================================= */

function tcRenderTablesGrid() {
  const grid = document.getElementById("tables-mgmt-grid");
  if (!grid) return;
  const tables = tcGet(TC.KEYS.TABLES, []);

  grid.innerHTML = tables.map(t => `
    <div class="table-mgmt-card">
      <h3>Table ${t.number}</h3>
      <span class="table-status-badge ${t.status}">${t.status}</span>
      <div class="table-mgmt-qr" id="table-qr-${t.number}"></div>
      <select class="status-select" data-table-status="${t.number}" style="margin-bottom:12px;width:100%;">
        <option value="Available" ${t.status === "Available" ? "selected" : ""}>Available</option>
        <option value="Occupied" ${t.status === "Occupied" ? "selected" : ""}>Occupied</option>
        <option value="Ordering" ${t.status === "Ordering" ? "selected" : ""}>Ordering</option>
      </select>
      <div class="table-mgmt-actions">
        <a class="btn btn-ghost btn-sm" href="qr-codes.html#table-${t.number}"><i class="fa-solid fa-qrcode"></i> View QR</a>
      </div>
    </div>
  `).join("");

  tables.forEach(t => tcGenerateQrInto(`table-qr-${t.number}`, tcBuildTableUrl(t.number), 110));

  grid.querySelectorAll("[data-table-status]").forEach(sel => {
    sel.addEventListener("change", () => {
      tcSetTableStatus(parseInt(sel.dataset.tableStatus, 10), sel.value);
      tcToast(`Table ${sel.dataset.tableStatus} set to ${sel.value}`, "success");
      tcRenderTablesGrid();
    });
  });
}

/* ---------------- Init hooks (each admin page calls what it needs) ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  tcInitAdminSidebar();
});
