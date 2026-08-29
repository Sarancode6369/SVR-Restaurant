/* =========================================================
   Tiffin Center — checkout.js (checkout.html only)
   ========================================================= */

function tcRenderCheckoutSummary() {
  const cart = tcGet(TC.KEYS.CART, { items: [] });
  const container = document.getElementById("checkout-items");
  const { subtotal, gst, total } = tcCartTotals();

  if (!cart.items || cart.items.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-cart-shopping"></i><p>Your cart is empty.</p>
      <a href="menu.html" class="btn btn-primary" style="margin-top:10px;">Browse Menu</a></div>`;
    document.getElementById("place-order-btn").disabled = true;
    return;
  }

  container.innerHTML = cart.items.map(item => `
    <div class="summary-row">
      <span>${tcEscapeHtml(item.name)} <span class="mono" style="color:#8A7660;">× ${item.qty}</span></span>
      <span class="mono">${tcFormatCurrency(item.price * item.qty)}</span>
    </div>
  `).join("") + `
    <div class="summary-row" style="border-top:1px dashed var(--line);margin-top:8px;padding-top:10px;"><span>Subtotal</span><span class="mono">${tcFormatCurrency(subtotal)}</span></div>
    <div class="summary-row"><span>GST (${(TC.GST_RATE * 100).toFixed(0)}%)</span><span class="mono">${tcFormatCurrency(gst)}</span></div>
    <div class="summary-row total"><span>Grand Total</span><span class="mono">${tcFormatCurrency(total)}</span></div>
  `;
}

function tcValidateField(fieldEl, condition, message) {
  const wrap = fieldEl.closest(".field");
  const errorEl = wrap.querySelector(".field-error");
  if (!condition) {
    wrap.classList.add("invalid");
    if (errorEl) errorEl.textContent = message;
    return false;
  }
  wrap.classList.remove("invalid");
  return true;
}

function tcHandlePlaceOrder(e) {
  e.preventDefault();
  const nameInput = document.getElementById("customer-name");
  const mobileInput = document.getElementById("customer-mobile");
  const table = tcGet(TC.KEYS.CURRENT_TABLE, null);

  const nameValid = tcValidateField(nameInput, nameInput.value.trim().length >= 2, "Please enter your name (min 2 characters).");
  const mobileValid = tcValidateField(mobileInput, /^[6-9]\d{9}$/.test(mobileInput.value.trim()), "Enter a valid 10-digit mobile number.");

  if (!table) {
    tcToast("Please select your table above before placing the order.", "error");
    return;
  }
  if (!nameValid || !mobileValid) {
    tcToast("Please fix the errors in the form.", "error");
    return;
  }

  const cart = tcGet(TC.KEYS.CART, { items: [] });
  if (!cart.items || cart.items.length === 0) {
    tcToast("Your cart is empty.", "error");
    return;
  }

  const btn = document.getElementById("place-order-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="tc-spinner"></span> Placing order...`;

  setTimeout(() => {
    const { subtotal, gst, total } = tcCartTotals();
    const order = {
      orderId: tcGenerateOrderId(),
      table: table,
      customerName: nameInput.value.trim(),
      mobile: mobileInput.value.trim(),
      items: cart.items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      subtotal, gst, total,
      status: "Pending",
      dateTime: new Date().toISOString()
    };

    const orders = tcGet(TC.KEYS.ORDERS, []);
    orders.push(order);
    tcSet(TC.KEYS.ORDERS, orders);

    const myIds = tcGet(TC.KEYS.MY_ORDER_IDS, []);
    myIds.push(order.orderId);
    tcSet(TC.KEYS.MY_ORDER_IDS, myIds);

    const bills = tcGet(TC.KEYS.BILLS, []);
    bills.push({
      orderId: order.orderId,
      billNumber: "BILL-" + order.orderId.replace("ORD-", ""),
      dateTime: order.dateTime
    });
    tcSet(TC.KEYS.BILLS, bills);

    tcSetTableStatus(table, "Ordering");
    tcSet(TC.KEYS.CART, { items: [] });
    tcUpdateCartBadge();

    tcToast("Order placed successfully!", "success");
    window.location.href = `bill.html?order=${encodeURIComponent(order.orderId)}`;
  }, 500);
}

document.addEventListener("DOMContentLoaded", () => {
  tcRenderCheckoutSummary();
  const form = document.getElementById("checkout-form");
  if (form) form.addEventListener("submit", tcHandlePlaceOrder);
});
