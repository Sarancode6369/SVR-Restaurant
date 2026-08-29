/* =========================================================
   Tiffin Center — menu.js
   Renders category chips + food grid, handles cart quantity
   controls via event delegation. Used on index.html & menu.html
   ========================================================= */

function tcAllCategories() {
  const menu = tcGet(TC.KEYS.MENU, []);
  return [...new Set(menu.map(i => i.category))];
}

function tcGetCartQty(itemId) {
  const cart = tcGet(TC.KEYS.CART, { items: [] });
  const it = (cart.items || []).find(i => i.id === itemId);
  return it ? it.qty : 0;
}

function tcAddToCart(item, qty = 1) {
  const cart = tcGet(TC.KEYS.CART, { items: [] });
  if (!cart.items) cart.items = [];
  const existing = cart.items.find(i => i.id === item.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.items.push({ id: item.id, name: item.name, price: item.price, image: item.image, qty });
  }
  tcSet(TC.KEYS.CART, cart);
  tcUpdateCartBadge();
  tcToast(`${item.name} added to cart`, "success");
}

function tcSetCartQty(itemId, qty) {
  const cart = tcGet(TC.KEYS.CART, { items: [] });
  if (!cart.items) cart.items = [];
  const idx = cart.items.findIndex(i => i.id === itemId);
  if (qty <= 0) {
    if (idx > -1) cart.items.splice(idx, 1);
  } else if (idx > -1) {
    cart.items[idx].qty = qty;
  }
  tcSet(TC.KEYS.CART, cart);
  tcUpdateCartBadge();
}

/* ---------------- Category chips ---------------- */

function tcRenderCategoryChips(containerId, activeCategory, onSelect) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const categories = ["All", ...tcAllCategories()];
  container.innerHTML = categories.map(cat => {
    const value = cat === "All" ? null : cat;
    const isActive = (activeCategory === value) || (!activeCategory && cat === "All");
    return `<button type="button" class="cat-chip ${isActive ? "active" : ""}" data-cat="${tcEscapeHtml(value || "")}">${tcEscapeHtml(cat)}</button>`;
  }).join("");

  container.querySelectorAll(".cat-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".cat-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      onSelect(btn.dataset.cat || null);
    });
  });
}

/* ---------------- Food grid ---------------- */

function tcFoodCardHtml(item) {
  const qty = tcGetCartQty(item.id);
  const unavailable = item.available === false;
  return `
  <div class="food-card ${unavailable ? "unavailable" : ""}" data-item-id="${item.id}">
    <div class="food-card-img">
      <img src="${tcEscapeHtml(item.image)}" alt="${tcEscapeHtml(item.name)}" loading="lazy"
           onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'">
      <span class="food-card-cat">${tcEscapeHtml(item.category)}</span>
    </div>
    <div class="food-card-body">
      <h3>${tcEscapeHtml(item.name)}</h3>
      <p class="food-card-desc">${tcEscapeHtml(item.description)}</p>
      <div class="food-card-foot">
        <span class="food-price mono">${tcFormatCurrency(item.price)}</span>
        ${unavailable
          ? `<span style="font-size:11.5px;color:#C0392B;font-weight:700;">Sold out</span>`
          : (qty > 0
            ? `<div class="qty-control" data-qty-control>
                 <button type="button" data-action="dec" aria-label="Decrease quantity">−</button>
                 <span data-qty-value>${qty}</span>
                 <button type="button" data-action="inc" aria-label="Increase quantity">+</button>
               </div>`
            : `<button type="button" class="add-cart-btn" data-action="add"><i class="fa-solid fa-cart-plus"></i> Add</button>`)
        }
      </div>
    </div>
  </div>`;
}

function tcRenderFoodGrid(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <i class="fa-solid fa-bowl-food"></i>
      <p>No items found in this category.</p>
    </div>`;
    return;
  }

  container.innerHTML = items.map(tcFoodCardHtml).join("");

  container.querySelectorAll(".food-card").forEach(card => {
    const itemId = card.dataset.itemId;
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    card.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === "add") {
        tcAddToCart(item, 1);
        tcRerenderCard(card, item);
      } else if (action === "inc") {
        const newQty = tcGetCartQty(item.id) + 1;
        tcSetCartQty(item.id, newQty);
        tcRerenderCard(card, item);
      } else if (action === "dec") {
        const newQty = tcGetCartQty(item.id) - 1;
        tcSetCartQty(item.id, newQty);
        tcRerenderCard(card, item);
      }
    });
  });
}

function tcRerenderCard(card, item) {
  const foot = card.querySelector(".food-card-foot");
  const qty = tcGetCartQty(item.id);
  const controlHtml = qty > 0
    ? `<div class="qty-control" data-qty-control>
         <button type="button" data-action="dec" aria-label="Decrease quantity">−</button>
         <span data-qty-value>${qty}</span>
         <button type="button" data-action="inc" aria-label="Increase quantity">+</button>
       </div>`
    : `<button type="button" class="add-cart-btn" data-action="add"><i class="fa-solid fa-cart-plus"></i> Add</button>`;
  const existingControl = foot.querySelector("[data-qty-control], .add-cart-btn");
  if (existingControl) existingControl.outerHTML = controlHtml;
}
