/* Customer site — menu wall, cart, checkout, order confirmation chit. */

(function () {
  const CFG = window.ATHIYA;

  const $ = sel => document.querySelector(sel);

  /* ── State ──────────────────────────────────────────────────────────────── */
  let menu = [];
  let cart = loadCart();
  let settings = { pincodes: CFG.delivery.pincodes, open: true };
  let scrollSpy = null;

  function loadCart() {
    try { return JSON.parse(localStorage.getItem("athiya_cart")) || {}; } catch { return {}; }
  }
  function saveCart() {
    localStorage.setItem("athiya_cart", JSON.stringify(cart));
  }

  /* ── Boot ───────────────────────────────────────────────────────────────── */
  async function boot() {
    /* Defensive: ensure the order-confirm overlay is never visible on load. */
    $("#confirm").hidden = true;

    document.getElementById("restaurant-name").textContent = CFG.restaurant.name;
    document.getElementById("restaurant-tagline").textContent = CFG.restaurant.tagline;
    document.getElementById("foot-name").textContent = CFG.restaurant.shortName;
    document.getElementById("foot-hours").textContent = "Open " + CFG.restaurant.hours;
    const logo = document.getElementById("logo-img");
    logo.src = CFG.restaurant.logo;
    logo.onerror = () => { logo.remove(); };

    try {
      settings = await DB.settings.get();
    } catch (e) { console.error("settings", e); }

    renderStatus();
    renderContact();

    try {
      menu = await DB.menu.list();
      renderShelf();
      renderWall();
      updateCartBar();
      initScrollSpy();
      if (!menu.length) {
        $("#category-shelf").innerHTML = "";
        $("#menu-wall").innerHTML = `<div class="text-center" style="padding:48px 0;"><p class="small muted">Menu is loading — check back in a moment.</p></div>`;
      }
    } catch (e) {
      toast("Couldn't load the menu — check your connection.", true);
      console.error(e);
    }

    buildPhotoGrid();
    wireEvents();
  }

  function renderStatus() {
    const strip = document.getElementById("status-strip");
    const text = document.getElementById("status-text");
    const open = settings.open !== false;
    strip.classList.toggle("is-closed", !open);
    text.textContent = open
      ? "Open — taking orders · " + CFG.restaurant.hours
      : "Closed for now — please check back";
  }

  function renderContact() {
    const wrap = document.getElementById("contact-cards");
    const cards = [];
    if (CFG.restaurant.phone) cards.push({ label: "Call us", value: CFG.restaurant.phone, tel: true });
    if (CFG.restaurant.phone2) cards.push({ label: "Order also on", value: CFG.restaurant.phone2, tel: true });
    if (CFG.restaurant.address) cards.push({ label: "Find us", value: CFG.restaurant.address });
    cards.push({ label: "Kitchen hours", value: CFG.restaurant.hours });
    cards.push({ label: "Delivery zone", value: settings.pincodes.join(", ") + " — pay on delivery" });
    wrap.innerHTML = cards.map(c => {
      const tel = String(c.value).replace(/\D/g, "");
      const body = c.tel
        ? `<a href="tel:${tel}">${escapeHtml(c.value)}</a>`
        : escapeHtml(c.value);
      return `
        <div class="ledger">
          <div class="ledger-label">${c.label}</div>
          <div class="ledger-value small" style="font-size:15px;line-height:1.35;padding-top:2px;">${body}</div>
        </div>`;
    }).join("");
  }

  /* ── Menu wall ──────────────────────────────────────────────────────────── */
  function categories() {
    return [...new Set(menu.map(m => m.category))];
  }

  function renderShelf() {
    const cats = categories();
    $("#category-shelf").innerHTML = cats.map((c, i) => `
      <button class="shelf-tab" role="tab" aria-selected="${i === 0}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>
    `).join("");
  }

  function renderWall() {
    const cats = categories();
    const wall = $("#menu-wall");
    wall.innerHTML = cats.map(cat => {
      const items = menu.filter(m => m.category === cat);
      return `
        <section class="menu-section" data-category="${escapeHtml(cat)}">
          <h2 class="section-title">${escapeHtml(cat)}</h2>
          <div class="wall-grid">${items.map(board).join("")}</div>
        </section>`;
    }).join("");
    wall.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", onAdd));
    wall.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", () => { changeQty(b.dataset.inc, 1); renderWall(); }));
    wall.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", () => { changeQty(b.dataset.dec, -1); renderWall(); }));
  }

  function board(m) {
    const qty = cart[m.id] || 0;
    const marks = [
      m.special ? `<span class="mark mark--special">Special</span>` : "",
      m.family ? `<span class="mark mark--family">Family</span>` : ""
    ].join("");
    const khali = m.in_stock === false;
    let action = "";
    if (khali) {
      action = `<span class="out-of-stock-label">Out of stock</span>`;
    } else if (qty > 0) {
      action = `<span class="qty-selector"><button type="button" data-dec="${m.id}" aria-label="Remove one ${escapeHtml(m.name)}">−</button><span class="qty-num">${qty}</span><button type="button" data-inc="${m.id}" aria-label="Add one ${escapeHtml(m.name)}">+</button></span>`;
    } else {
      action = `<button class="add-btn" type="button" data-add="${m.id}" aria-label="Add ${escapeHtml(m.name)}">+</button>`;
    }
    return `
      <article class="board${khali ? " is-khali" : ""}" aria-disabled="${khali}">
        ${marks}
        <h3 class="board-name">${escapeHtml(m.name)}</h3>
        <p class="board-desc">${m.category} · cooked to order</p>
        <div class="board-foot">
          ${khali ? action : `<span class="swing-tag">${fmt(m.price)}</span>`}
          ${khali ? "" : action}
        </div>
      </article>`;
  }

  function onAdd(e) {
    const id = e.currentTarget.dataset.add;
    const item = menu.find(m => m.id === id);
    if (!item || item.in_stock === false) return;
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    Chime.add();
    updateCartBar();
    renderWall();
  }

  /* ── Scroll-spy ─────────────────────────────────────────────────────────── */
  function initScrollSpy() {
    const shelf = $("#category-shelf");
    const sections = document.querySelectorAll(".menu-section");
    if (!sections.length) return;

    /* When a tab is clicked, scroll the matching section into view. */
    shelf.addEventListener("click", e => {
      const tab = e.target.closest(".shelf-tab");
      if (!tab) return;
      const cat = tab.dataset.cat;
      const target = document.querySelector(`.menu-section[data-category="${cat}"]`);
      if (target) {
        const shelfHeight = shelf.offsetHeight;
        const top = target.getBoundingClientRect().top + window.scrollY - shelfHeight - 8;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });

    /* IntersectionObserver watches each section and highlights its tab. */
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const cat = entry.target.dataset.category;
        setActiveTab(cat);
      });
    }, {
      /* Trigger when the section's top crosses the area just below the sticky shelf. */
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0
    });

    sections.forEach(s => observer.observe(s));
    scrollSpy = observer;
  }

  function setActiveTab(cat) {
    const tabs = document.querySelectorAll("#category-shelf .shelf-tab");
    let activeIdx = 0;
    tabs.forEach((tab, i) => {
      const sel = tab.dataset.cat === cat;
      tab.setAttribute("aria-selected", sel);
      if (sel) activeIdx = i;
    });
    /* Scroll the active tab into view within the horizontal shelf. */
    const activeTab = tabs[activeIdx];
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }

  /* ── Cart bar + cart sheet ──────────────────────────────────────────────── */
  function cartCount() { return Object.values(cart).reduce((a, b) => a + b, 0); }
  function cartTotal() {
    return menu.reduce((sum, m) => sum + (cart[m.id] || 0) * m.price, 0);
  }

  function updateCartBar() {
    const n = cartCount();
    $("#cart-count").textContent = n;
    $("#cart-total").textContent = fmt(cartTotal());
    $("#cart-label").textContent = n ? "Your pan" + (n > 1 ? " — " + n + " items" : " — 1 item") : "Your pan is empty";
    $("#cart-bar").classList.toggle("is-show", n > 0);
    renderCartLines();
  }

  function renderCartLines() {
    const lines = $("#cart-lines");
    const rows = menu
      .filter(m => cart[m.id])
      .map(m => `
        <div class="cart-line">
          <div class="cl-name">${escapeHtml(m.name)}<small>${fmt(m.price)} each</small></div>
          <div class="qty" role="group" aria-label="Quantity for ${escapeHtml(m.name)}">
            <button type="button" data-dec="${m.id}" aria-label="Remove one ${escapeHtml(m.name)}">−</button>
            <span class="qty-num">${cart[m.id]}</span>
            <button type="button" data-inc="${m.id}" aria-label="Add one ${escapeHtml(m.name)}">+</button>
          </div>
          <div class="cl-total">${fmt((cart[m.id] || 0) * m.price)}</div>
        </div>`).join("");
    lines.innerHTML = rows || `<p class="small muted">Your pan is empty — pick some boards from the wall.</p>`;
    lines.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.inc, 1)));
    lines.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.dec, -1)));
    $("#checkout-net").textContent = fmt(cartTotal());
  }

  function changeQty(id, d) {
    const next = (cart[id] || 0) + d;
    if (next <= 0) { delete cart[id]; } else if (next <= 20) { cart[id] = next; }
    saveCart();
    if (d > 0) Chime.add();
    updateCartBar();
  }

  /* ── Sheets / scrim ─────────────────────────────────────────────────────── */
  function openSheet(el) {
    $("#scrim").hidden = false;
    requestAnimationFrame(() => $("#scrim").classList.add("is-show"));
    el.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeSheets() {
    $("#scrim").classList.remove("is-show");
    $("#cart-sheet").classList.remove("is-open");
    $("#checkout-sheet").classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => { $("#scrim").hidden = true; }, 220);
  }

  /* ── Checkout ───────────────────────────────────────────────────────────── */
  function pincodeAllowed(pc) {
    return settings.pincodes.some(p => String(p).trim() === String(pc).trim());
  }

  function wireCheckout() {
    const form = $("#checkout-form");
    const pin = $("#f-pincode");

    pin.addEventListener("input", () => {
      const ok = pin.value.trim() && pincodeAllowed(pin.value);
      pin.closest(".field").classList.toggle("is-error", Boolean(pin.value.trim()) && !ok);
    });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const name = $("#f-name").value.trim();
      const phone = $("#f-phone").value.trim();
      const pincode = $("#f-pincode").value.trim();
      const address = $("#f-address").value.trim();

      let firstError = null;
      const setErr = (field, has) => {
        form.querySelector(`[data-f="${field}"]`).classList.toggle("is-error", has);
        const inp = form.querySelector(`[data-f="${field}"] input, [data-f="${field}"] textarea`);
        if (inp) inp.setAttribute("aria-invalid", String(has));
        if (has && !firstError) firstError = inp;
      };
      setErr("name", !name);
      setErr("phone", !/^[6-9]\d{9}$/.test(phone));
      setErr("pincode", !pincodeAllowed(pincode));
      setErr("address", !address);

      if (firstError) { firstError.focus(); Chime.error(); return; }

      if (cartCount() === 0) { toast("Your pan is empty — add something first.", true); return; }

      const items = menu.filter(m => cart[m.id]).map(m => ({ id: m.id, name: m.name, price: m.price, qty: cart[m.id] }));
      const submit = $("#place-order-btn");
      submit.disabled = true;
        submit.textContent = "Placing…";

      try {
        const order = await DB.orders.insert({
          customer_name: name,
          phone,
          address,
          pincode,
          items,
          net_amount: cartTotal(),
          status: "pending"
        });
        Chime.stamp();
        showConfirm(order.token);
        cart = {};
        saveCart();
        updateCartBar();
        closeSheets();
      } catch (err) {
        console.error(err);
        toast("Couldn't place your order — please try again.", true);
        Chime.error();
      } finally {
        submit.disabled = false;
        submit.textContent = "Place order";
      }
    });
  }

  function showConfirm(token) {
    $("#confirm-token").textContent = "#" + token;
    $("#confirm").hidden = false;
  }

  /* ── About photos: auto-sliding strip with manual arrows ────────────────── */
  function buildPhotoGrid() {
    const photos = CFG.restaurant.photos || [];
    const wrap = $("#photo-grid");
    if (!photos.length) { wrap.remove(); return; }
    wrap.classList.add("photo-carousel");
    wrap.innerHTML = `
      <div class="pc-track" id="pc-track" aria-label="Shop photos">
        ${photos.map(p => `
          <figure>
            <img src="${p.src}" alt="${escapeHtml(p.caption)}" loading="lazy" draggable="false">
            <figcaption>${escapeHtml(p.caption)}</figcaption>
          </figure>`).join("")}
      </div>
      <button class="pc-arrow pc-prev" type="button" aria-label="Previous photo">‹</button>
      <button class="pc-arrow pc-next" type="button" aria-label="Next photo">›</button>`;

    const track = $("#pc-track");
    const motion = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    const step = () => (track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width + 12 : track.clientWidth);
    const next = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      if (track.scrollLeft >= max) track.scrollTo({ left: 0, behavior: motion });
      else track.scrollBy({ left: step(), behavior: motion });
    };
    const prev = () => {
      if (track.scrollLeft <= 2) track.scrollTo({ left: track.scrollWidth, behavior: motion });
      else track.scrollBy({ left: -step(), behavior: motion });
    };
    /* Auto-slide every 4s; hold off while the guest is handling the strip. */
    let timer = null;
    const play = () => { clearInterval(timer); timer = setInterval(next, 4000); };
    const pause = () => clearInterval(timer);
    $(".pc-next").addEventListener("click", () => { next(); play(); });
    $(".pc-prev").addEventListener("click", () => { prev(); play(); });
    track.addEventListener("pointerdown", pause);
    ["pointerup", "pointerleave", "pointercancel"].forEach(ev => track.addEventListener(ev, play));
    document.addEventListener("visibilitychange", () => { document.hidden ? pause() : play(); });
    play();
  }

  /* ── Events + helpers ───────────────────────────────────────────────────── */
  function wireEvents() {
    $("#open-cart").addEventListener("click", () => openSheet($("#cart-sheet")));
    $("#close-cart").addEventListener("click", closeSheets);
    $("#close-checkout").addEventListener("click", closeSheets);
    $("#scrim").addEventListener("click", closeSheets);

    $("#checkout-btn").addEventListener("click", () => {
      $("#checkout-net").textContent = fmt(cartTotal());
      closeSheets();
      setTimeout(() => openSheet($("#checkout-sheet")), 240);
    });

    $("#confirm-done").addEventListener("click", () => { $("#confirm").hidden = true; });

    document.addEventListener("keydown", e => { if (e.key === "Escape") { closeSheets(); $("#confirm").hidden = true; } });

    wireCheckout();
  }

  boot();
})();
