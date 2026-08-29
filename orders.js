/* =========================================================
   Tiffin Center — orders.js (orders.html only, customer view)
   ========================================================= */

function tcRenderMyOrders() {
  const container = document.getElementById("my-orders-list");
  const myIds = tcGet(TC.KEYS.MY_ORDER_IDS, []);
  const allOrders = tcGet(TC.KEYS.ORDERS, []);
  const myOrders = allOrders
    .filter(o => myIds.includes(o.orderId))
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

  if (myOrders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-receipt"></i>
        <p>You haven't placed any orders yet on this device.</p>
        <a href="menu.html" class="btn btn-primary" style="margin-top:10px;">Browse Menu</a>
      </div>`;
    return;
  }

  container.innerHTML = myOrders.map(order => `
    <div class="order-card">
      <div class="order-card-head">
        <span class="oid">${tcEscapeHtml(order.orderId)}</span>
        <span class="status-pill status-${order.status}">${order.status}</span>
      </div>
      <div class="order-items-line">Table ${order.table} · ${order.items.length} item(s) · ${tcFormatDateTime(order.dateTime)}</div>
      <div class="flex-between">
        <span class="mono" style="font-weight:700;color:var(--copper);">${tcFormatCurrency(order.total)}</span>
        <a href="bill.html?order=${encodeURIComponent(order.orderId)}" class="btn btn-ghost btn-sm"><i class="fa-solid fa-receipt"></i> View Bill</a>
      </div>
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  tcRenderMyOrders();
  // Live-refresh in case admin updates status while this tab is open
  window.addEventListener("storage", (e) => {
    if (e.key === TC.KEYS.ORDERS) tcRenderMyOrders();
  });
  setInterval(tcRenderMyOrders, 4000);
});
