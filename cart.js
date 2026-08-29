/* =========================================================
   Tiffin Center — cart.js  (cart.html only)
   ========================================================= */

function tcCartTotals() {
  const cart = tcGet(TC.KEYS.CART, { items: [] });
  const subtotal = (cart.items || []).reduce((sum, i) => sum + i.price * i.qty, 0);
  const gst = subtotal * TC.GST_RATE;
  const total = subtotal + gst;
  return { subtotal, gst, total, count: (cart.items || []).reduce((s, i) => s + i.qty, 0) };
}

function tcRenderCartItems() {
  const container = document.getElementById("cart-items");
  const cart = tcGet(TC.KEYS.CART, { items: [] });

  if (!cart.items || cart.items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-cart-shopping"></i>
        <p>Your cart is empty.</p>
        <a href="menu.html" class="btn btn-primary" style="margin-top:10px;"><i class="fa-solid fa-utensils"></i> Browse Menu</a>
      </div>`;
    return;
  }

  container.innerHTML = cart.items.map(item => `
    <div class="cart-item" data-item-id="${item.id}">
      <img src="${tcEscapeHtml(item.image || "")}" alt="${tcEscapeHtml(item.name)}"
           onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80'">
      <div>
        <div class="cart-item-name">${tcEscapeHtml(item.name)}</div>
        <div class="cart-item-price mono">${tcFormatCurrency(item.price)} each</div>
      </div>
      <div class="qty-control">
        <button type="button" data-action="dec" aria-label="Decrease quantity">−</button>
        <span>${item.qty}</span>
        <button type="button" data-action="inc" aria-label="Increase quantity">+</button>
      </div>
      <button type="button" class="remove-btn" data-action="remove" aria-label="Remove item"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join("");

  container.querySelectorAll(".cart-item").forEach(row => {
    const itemId = row.dataset.itemId;
    row.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const cart = tcGet(TC.KEYS.CART, { items: [] });
      const item = cart.items.find(i => i.id === itemId);
      if (!item) return;

      if (btn.dataset.action === "inc") {
        tcSetCartQty(itemId, item.qty + 1);
      } else if (btn.dataset.action === "dec") {
        tcSetCartQty(itemId, item.qty - 1);
      } else if (btn.dataset.action === "remove") {
        tcSetCartQty(itemId, 0);
        tcToast(`${item.name} removed from cart`, "info");
      }
      tcRenderCartPage();
    });
  });
}

function tcRenderCartSummary() {
  const { subtotal, gst, total, count } = tcCartTotals();
  const summary = document.getElementById("cart-summary");
  summary.innerHTML = `
    <h3>Order Summary</h3>
    <div class="summary-row"><span>Items (${count})</span><span class="mono">${tcFormatCurrency(subtotal)}</span></div>
    <div class="summary-row"><span>GST (${(TC.GST_RATE * 100).toFixed(0)}%)</span><span class="mono">${tcFormatCurrency(gst)}</span></div>
    <div class="summary-row total"><span>Total</span><span class="mono">${tcFormatCurrency(total)}</span></div>
    <a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:16px;" ${count === 0 ? "aria-disabled='true' onclick='return false;'" : ""}>
      <i class="fa-solid fa-arrow-right"></i> Proceed to Checkout
    </a>
    <button type="button" class="btn btn-ghost btn-block" style="margin-top:10px;" id="clear-cart-btn" ${count === 0 ? "disabled" : ""}>
      <i class="fa-solid fa-broom"></i> Clear Cart
    </button>
  `;
  const clearBtn = document.getElementById("clear-cart-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      tcSet(TC.KEYS.CART, { items: [] });
      tcToast("Cart cleared", "info");
      tcRenderCartPage();
    });
  }
}

function tcRenderCartPage() {
  tcRenderCartItems();
  tcRenderCartSummary();
  tcUpdateCartBadge();
}

document.addEventListener("DOMContentLoaded", tcRenderCartPage);
