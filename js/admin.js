/* Admin dashboard — the counter: login, live chit board, sound alerts,
   order actions, stock control, earnings. */

(function () {
  const CFG = window.ATHIYA;
  const $ = sel => document.querySelector(sel);
  const SESSION_KEY = "athiya_admin_session";

  const STATUSES = {
    pending:    { label: "Pending",      stamp: "stamp--pending",    cls: "is-pending",   next: "accepted",  nextLabel: "Accept · Send to Chef" },
    accepted:   { label: "Accepted · Cooking in Kitchen", stamp: "stamp--cooking",   cls: "is-accepted",  next: "dispatched", nextLabel: "Mark Dispatched" },
    dispatched: { label: "Dispatched",   stamp: "stamp--dispatched", cls: "is-dispatched", next: "paid",       nextLabel: "Mark Paid" },
    paid:       { label: "Paid",         stamp: "stamp--paid",       cls: "is-paid",       next: null,        nextLabel: "" },
    cancelled:  { label: "Rejected",     stamp: "stamp--rejected",   cls: "is-cancelled",  next: null,        nextLabel: "" }
  };

  let menu = [];
  let orders = [];
  let filter = "active";
  let activeTab = "queue";
  let earnRange = "today";
  let lastAlertKey = "";
  let online = true;

  /* ── Login ─────────────────────────────────────────────────────────────── */
  function sessionValid() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      return s && s.t > Date.now() && s.p === CFG.admin.password;
    } catch { return false; }
  }

  function wireLogin() {
    const gate = $("#login-gate");
    if (sessionValid()) { gate.hidden = true; return; }
    gate.hidden = false;

    $("#login-form").addEventListener("submit", e => {
      e.preventDefault();
      const pin = $("#login-pin").value;
      const card = $(".login-card");
      if (pin === CFG.admin.password) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          p: CFG.admin.password,
          t: Date.now() + CFG.admin.sessionDays * 86400000
        }));
        gate.hidden = true;
        toast("Counter open");
        bootApp();
      } else {
        card.classList.add("is-error");
        $("#login-pin").value = "";
        $("#login-pin").focus();
        Chime.error();
      }
    });
  }

  $("#logout-btn").addEventListener("click", () => {
    localStorage.removeItem(SESSION_KEY);
    location.reload();
  });

  /* ── Boot ──────────────────────────────────────────────────────────────── */
  async function bootApp() {
    wireTabs();
    $("#live-dot").classList.toggle("off", !DB.isLive);
    $("#live-dot").title = DB.isLive ? "Live orders (Supabase)" : "Demo mode (this device)";

    window.addEventListener("offline", () => { online = false; toast("Offline — orders may not sync.", true); });
    window.addEventListener("online", () => { online = true; toast("Back online."); });

    try {
      menu = await DB.menu.list();
      orders = await DB.orders.list();
    } catch (err) {
      toast("Couldn't load data — check connection.", true);
      console.error(err);
    }

    renderAll();
    checkPendingAlert();
    DB.orders.subscribe(onOrderEvent);
    setInterval(refresh, 30000); // slow poll as a belt-and-braces for Supabase
  }

  async function refresh() {
    try {
      orders = await DB.orders.list();
      renderAll();
    } catch { /* keep current view */ }
  }

  function onOrderEvent(order, list) {
    if (Array.isArray(list)) {
      orders = list;
      renderAll();
      checkPendingAlert();
      return;
    }
    const idx = orders.findIndex(o => o.id === order.id);
    if (idx === -1) orders.unshift(order);
    else orders[idx] = order;

    if (order.status === "pending" && order.id !== lastAlertKey) {
      lastAlertKey = order.id;
      Chime.order();
      renderAll();
      checkPendingAlert();
      setTimeout(() => {
        /* No toast — the decision pop-up IS the announcement. */
        document.title = `🔔 #${order.token} · The Counter`;
        setTimeout(() => { document.title = "The Counter"; }, 6000);
      }, 150);
    } else {
      if (idx > -1) flashChit(order.id);   // show which chit just changed
      renderAll();
      checkPendingAlert();
    }
  }

  /* ── Tabs ───────────────────────────────────────────────────────────────── */
  function wireTabs() {
    $("#admin-tabs").addEventListener("click", e => {
      const tab = e.target.closest(".shelf-tab");
      if (!tab) return;
      activeTab = tab.dataset.tab;
      document.querySelectorAll("#admin-tabs .shelf-tab").forEach(t => t.setAttribute("aria-selected", t === tab));
      $("#queue").hidden = activeTab !== "queue";
      $("#stock").hidden = activeTab !== "stock";
      /* Stock renders only when its tab opens — polls and order events never
         rebuild it, so the list stays exactly where the owner left it. */
      if (activeTab === "stock") renderStock();
      $("#earnings").hidden = activeTab !== "earnings";
      renderAll();
    });

    $("#queue-filters").addEventListener("click", e => {
      const tab = e.target.closest(".shelf-tab");
      if (!tab) return;
      filter = tab.dataset.f;
      document.querySelectorAll("#queue-filters .shelf-tab").forEach(t => t.setAttribute("aria-selected", t === tab));
      renderQueue();
    });

    $("#earn-tabs").addEventListener("click", e => {
      const tab = e.target.closest(".shelf-tab");
      if (!tab) return;
      earnRange = tab.dataset.e;
      document.querySelectorAll("#earn-tabs .shelf-tab").forEach(t => t.setAttribute("aria-selected", t === tab));
      renderEarnings();
    });
  }

  function renderAll() { renderKpis(); renderQueue(); renderEarnings(); }

  function checkPendingAlert() {
    updateDecideModal();
    const pending = orders.some(o => o.status === "pending");
    if (pending) Chime.alertLoop(); else Chime.alertStop();
  }

  /* ── Decision pop-up: a pending order takes over the screen ─────────────── */
  let decideId = null;

  function decideMarkup(o) {
    const lines = (o.items || []).map(it =>
      `<li><span>${escapeHtml(it.name)} × ${it.qty}</span><em>${fmt(it.price * it.qty)}</em></li>`).join("");
    return `
      <p class="decide-head"><span class="stamp stamp--pending">Decision needed</span></p>
      <div class="chit-head">
        <span class="token">#${escapeHtml(o.token)}</span>
        <span class="chit-time">${time(o.created_at)}</span>
        <span class="decide-net">${fmt(o.net_amount)}</span>
      </div>
      <ul class="chit-rows" style="list-style:none;padding:0;margin:0;">${lines}</ul>
      <div class="net"><span>Net</span><span>${fmt(o.net_amount)}</span></div>
      <div class="chit-who">
        <b>${escapeHtml(o.customer_name)}</b><span>${escapeHtml(o.phone)}</span>
        <span style="grid-column:1 / -1;">${escapeHtml(o.address)}</span>
        <span class="small" style="grid-column:1 / -1;color:var(--ink-faint);">Pincode ${escapeHtml(o.pincode)} · Pay on delivery</span>
      </div>`;
  }

  function updateDecideModal() {
    const wrap = $("#decide");
    const pend = orders.filter(o => o.status === "pending");
    const current = pend.find(o => o.id === decideId) || pend[0] || null;
    const showId = current ? current.id : null;
    /* Already showing exactly this state? Leave the DOM alone (polls fire often). */
    if (showId === decideId && Boolean(showId) === !wrap.hidden) return;
    const wasHidden = wrap.hidden;
    decideId = showId;
    if (!current) { wrap.hidden = true; return; }
    $("#decide-chit").innerHTML =
      decideMarkup(current) + `
      <div class="decide-actions">
        <button class="btn btn-primary" type="button" id="decide-accept">Accept · Cook</button>
        <button class="btn btn-ghost" type="button" id="decide-reject">Reject</button>
      </div>
      <p class="decide-note">Order #${escapeHtml(current.token)} is waiting for you</p>`;
    wrap.hidden = false;
    $("#decide-accept").addEventListener("click", () => decide("accepted"));
    $("#decide-reject").addEventListener("click", () => decide("cancelled"));
    if (wasHidden) $("#decide-accept").focus({ preventScroll: true });
  }

  async function decide(status) {
    const id = decideId;
    if (!id) return;
    decideId = null;
    $("#decide").hidden = true;
    await setStatus(id, status, `#${(orders.find(o => o.id === id) || {}).token} → ${STATUSES[status].label}`);
    flashChit(id);
    checkPendingAlert();   // pops the next waiting order, if any
  }

  /* Flash + scroll to the chit a sound belongs to. */
  function flashChit(id) {
    requestAnimationFrame(() => {
      const el = document.querySelector(`#chit-board .chit[data-id="${CSS.escape(id)}"]`);
      if (!el) return;
      el.classList.remove("is-flash");
      void el.offsetWidth;   // restart the animation
      el.classList.add("is-flash");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => el.classList.remove("is-flash"), 1700);
    });
  }

  /* Takings = every order taken that isn't rejected — a live running total
     through the newest order, not just the ones already marked paid. */
  const countable = o => o.status !== "cancelled";
  const sumTakings = list => list.reduce((s, o) => s + (Number(o.net_amount) || 0), 0);

  /* ── KPIs (ledger with trend beside every value) ───────────────────────── */
  function renderKpis() {
    const today = startOfDay();
    const yest = startOfDay(-1);

    const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
    const activeCount = orders.filter(o => ["pending", "accepted", "dispatched"].includes(o.status));
    const takingsToday = sumTakings(todayOrders.filter(countable));
    const takingsYest = sumTakings(orders.filter(o => countable(o) && new Date(o.created_at) >= yest && new Date(o.created_at) < today));

    const pendingCount = orders.filter(o => o.status === "pending").length;

    $("#kpi-grid").innerHTML = [
      ledger("Orders today", todayOrders.length, todayOrders.length - orders.filter(o => new Date(o.created_at) >= yest && new Date(o.created_at) < today).length),
      ledger("Today's takings · POD", fmt(takingsToday), takingsToday - takingsYest, "₹"),
      ledger("Pending / In-kitchen", pendingCount + " · " + activeCount.length + " active", null, "", activeCount.length > 0 ? "is-alert" : "")
    ].join("");
  }

  function ledger(label, value, trend, prefix = "", extra = "") {
    const t = trend == null ? "" : (trend > 0
      ? `<span class="trend">▲ +${trend}${prefix}</span>`
      : trend < 0
        ? `<span class="trend is-down">▼ ${trend}${prefix}</span>`
        : `<span class="trend">— 0</span>`);
    return `<div class="ledger ${extra}">
      <div class="ledger-label">${label}</div>
      <div class="ledger-value">${value}</div>
      <div class="small">${t ? "vs yesterday " + t : "&nbsp;"}</div>
    </div>`;
  }

  function startOfDay(offset = 0) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d;
  }

  /* ── Queue ─────────────────────────────────────────────────────────────── */
  function filteredOrders() {
    if (filter === "paid") return orders.filter(o => o.status === "paid");
    if (filter === "all") return orders;
    return orders.filter(o => ["pending", "accepted", "dispatched"].includes(o.status));
  }

  function renderQueue() {
    const board = $("#chit-board");
    const list = filteredOrders();
    board.innerHTML = list.length
      ? list.map(chit).join("")
      : `<div class="text-center" style="padding:40px 0;">
         <svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true" style="opacity:.5;margin:0 auto 10px;">
           <path d="M4 12h16a8 8 0 0 1-16 0Z"/>
           <path d="M12 4v3M9 6h6"/>
           <path d="M5 15c-1 2 0 3.5 2 3M19 15c1 2 0 3.5-2 3"/>
         </svg>
         <p class="small muted">No ${filter === "all" ? "" : filter + " "}orders right now. The counter is quiet.</p></div>`;

    board.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", onAction));
    board.querySelectorAll("[data-kot]").forEach(b => b.addEventListener("click", onKot));
    board.querySelectorAll("[data-wa]").forEach(b => b.addEventListener("click", onWhatsapp));
  }

  function chit(o) {
    const s = STATUSES[o.status] || STATUSES.pending;
    const lines = (o.items || []).map(it =>
      `<li><span>${escapeHtml(it.name)} × ${it.qty}</span><em>${fmt(it.price * it.qty)}</em></li>`).join("");

    let actions = "";
    if (o.status === "pending") {
      actions += `<button class="btn btn-primary btn-sm" data-act="accept" data-id="${o.id}">${s.nextLabel}</button>
                  <button class="btn btn-ghost btn-sm" data-act="reject" data-id="${o.id}">Reject</button>`;
    } else if (o.status === "cancelled") {
      actions += `<button class="btn btn-ghost btn-sm" data-act="undo" data-id="${o.id}">↩ Restore to pending</button>`;
    } else if (s.next) {
      actions += `<button class="btn btn-paid btn-sm" data-act="${s.next}" data-id="${o.id}">${s.nextLabel}</button>`;
    }

    return `<article class="chit ${s.cls}" data-id="${o.id}">
      <div class="chit-head">
        <span class="token">#${escapeHtml(o.token)}</span>
        <span class="chit-time">${time(o.created_at)}</span>
        <span class="status-area"><span class="stamp ${s.stamp}">${s.label}</span></span>
      </div>
      <ul class="chit-rows" style="list-style:none;padding:0;margin:0;">${lines}</ul>
      <div class="net"><span>Net</span><span>${fmt(o.net_amount)}</span></div>
      <div class="chit-who">
        <b>${escapeHtml(o.customer_name)}</b><span>${escapeHtml(o.phone)}</span>
        <span style="grid-column:1 / -1;">${escapeHtml(o.address)}</span>
        <span class="small" style="grid-column:1 / -1;color:var(--ink-faint);">Pincode ${escapeHtml(o.pincode)} · Pay on delivery</span>
      </div>
      <div class="chit-actions">
        ${actions}
        <button class="btn btn-gold btn-sm" data-kot="${o.id}">Print KOT</button>
        <button class="btn btn-ghost btn-sm" data-wa="${o.id}">Share with rider</button>
        <button class="btn btn-ghost btn-sm" data-act="collect" data-id="${o.id}">Collect ${fmt(o.net_amount)}</button>
      </div>
    </article>`;
  }

  function time(iso) {
    try {
      return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    } catch { return ""; }
  }

  /* ── Actions ───────────────────────────────────────────────────────────── */
  async function onAction(e) {
    const id = e.currentTarget.dataset.id;
    const act = e.currentTarget.dataset.act;
    const order = orders.find(o => o.id === id);
    if (!order) return;

    if (act === "collect") {
      toast(`Collect ${fmt(order.net_amount)} from #${order.token} — cash`);
      return;
    }

    const statusMap = { accept: "accepted", reject: "cancelled", dispatched: "dispatched", paid: "paid", undo: "pending" };
    const status = statusMap[act];
    if (!status) return;
    await setStatus(id, status, `#${order.token} → ${STATUSES[status].label}`);
  }

  async function setStatus(id, status, msg) {
    try {
      await DB.orders.update(id, { status });
      orders = orders.map(o => (o.id === id ? { ...o, status } : o));
      renderAll();
      checkPendingAlert();
      toast(msg);
      if (status === "paid") Chime.stamp();
    } catch (err) {
      toast("Couldn't update — check connection.", true);
      console.error(err);
    }
  }

  /* ── KOT print ─────────────────────────────────────────────────────────── */
  function onKot(e) {
    const order = orders.find(o => o.id === e.currentTarget.dataset.kot);
    if (!order) return;
    const lines = (order.items || []).map(it =>
      `<tr><td>${escapeHtml(it.name)} × ${it.qty}</td><td>${fmt(it.price * it.qty)}</td></tr>`).join("");
    $("#kot-print").innerHTML = `
      <h1>Athiya's Hyderabad Biryani</h1>
      <div class="k-sub">Kitchen Order Ticket</div>
      <div class="k-token"><strong>#${escapeHtml(order.token)}</strong> · ${time(order.created_at)} · POD</div>
      <table>${lines}</table>
      <div class="k-total">TOTAL  ${fmt(order.net_amount)}</div>
      <div class="k-foot">Name: ${escapeHtml(order.customer_name)} · ${escapeHtml(order.phone)}</div>
      <div class="k-foot">${escapeHtml(order.address)}</div>`;
    window.print();
  }

  /* ── WhatsApp rider share ───────────────────────────────────────────────── */
  function onWhatsapp(e) {
    const order = orders.find(o => o.id === e.currentTarget.dataset.wa);
    if (!order) return;
    const lines = (order.items || []).map(it => `• ${it.name} × ${it.qty} — ${fmt(it.price * it.qty)}`).join("\n");
    const text = [
      `ATHIYA'S HYDERABAD BIRYANI — DELIVERY`,
      `Order #${order.token}`,
      `Total to collect: ${fmt(order.net_amount)} (Pay on Delivery)`,
      ``,
      lines,
      ``,
      `Customer: ${order.customer_name} · ${order.phone}`,
      `Address: ${order.address} (${order.pincode})`,
      `Collect cash or UPI QR at the door.`
    ].join("\n");
    const url = `https://wa.me/${CFG.restaurant.whatsapp || ""}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  /* ── Stock control ─────────────────────────────────────────────────────── */
  let addFormOpen = false;
  const catCollapsed = {};  // tracks which categories are collapsed on mobile

  function renderStock() {
    const wrap = $("#stock");
    if (!wrap || wrap.hidden) return;

    const cats = [...new Set(menu.map(m => m.category))];
    const catGroups = cats.map(c => ({ category: c, items: menu.filter(m => m.category === c) }));
    const isMobile = window.innerWidth < 900;

    wrap.innerHTML = `
      <button class="btn btn-primary stock-add-btn" type="button" id="stock-add-toggle">+ Add New Item</button>
      <div class="stock-add-form" id="stock-add-form" hidden>
        <div class="stock-add-fields">
          <div class="field"><label for="add-name">Name</label><input id="add-name" type="text" placeholder="Dish name" required></div>
          <div class="field" data-f="add-cat">
            <label for="add-cat-sel">Category</label>
            <select id="add-cat-sel"><option value="">— pick —</option>${cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}<option value="__new__">New category…</option></select>
            <input id="add-cat-text" type="text" placeholder="Category name" hidden>
          </div>
          <div class="field"><label for="add-price">Price (₹)</label><input id="add-price" type="number" min="0" step="1" placeholder="0" required></div>
          <div class="field stock-add-stock">
            <label>In stock</label>
            <label class="toggle"><input type="checkbox" id="add-stock" checked><span class="track"></span></label>
          </div>
        </div>
        <div class="stock-add-actions">
          <button class="btn btn-primary btn-sm" type="button" id="stock-add-save">Save item</button>
          <button class="btn btn-ghost btn-sm" type="button" id="stock-add-cancel">Cancel</button>
        </div>
      </div>
      ${catGroups.map(g => {
        const collapsed = isMobile && catCollapsed[g.category] === true;
        return `
        <div class="stock-cat-group${collapsed ? " is-collapsed" : ""}">
          <button class="stock-cat-header" type="button" data-cat-toggle="${escapeHtml(g.category)}" aria-expanded="${!collapsed}">
            <span class="cat-chevron" aria-hidden="true"></span>
            ${escapeHtml(g.category)}
            <span class="cat-count">${g.items.length}</span>
          </button>
          <div class="stock-cat-items"${collapsed ? ' hidden' : ''}>
          ${g.items.map(m => `
            <div class="stock-row${m.in_stock === false ? " is-khali" : ""}" data-id="${m.id}">
              <label class="toggle">
                <input type="checkbox" data-stock="${m.id}" ${m.in_stock !== false ? "checked" : ""} aria-label="Toggle stock for ${escapeHtml(m.name)}">
                <span class="track" aria-hidden="true"></span>
              </label>
              <span class="s-name stock-name" data-name-id="${m.id}" title="Tap to edit name">${escapeHtml(m.name)}<small>${escapeHtml(m.category)}</small></span>
              <span class="s-price stock-price" data-price-id="${m.id}" title="Tap to edit price">${fmt(m.price)}</span>
            </div>`).join("")}
          </div>
        </div>`;
      }).join("")}`;

    /* Wire stock toggles */
    wrap.querySelectorAll("[data-stock]").forEach(inp =>
      inp.addEventListener("change", () => toggleStock(inp.dataset.stock)));

    /* Wire price click-to-edit */
    wrap.querySelectorAll("[data-price-id]").forEach(el =>
      el.addEventListener("click", () => startPriceEdit(el)));

    /* Wire name click-to-edit */
    wrap.querySelectorAll("[data-name-id]").forEach(el =>
      el.addEventListener("click", () => startNameEdit(el)));

    /* Wire category accordion toggles */
    wrap.querySelectorAll("[data-cat-toggle]").forEach(btn =>
      btn.addEventListener("click", () => {
        const cat = btn.dataset.catToggle;
        catCollapsed[cat] = !catCollapsed[cat];
        const group = btn.closest(".stock-cat-group");
        const items = group.querySelector(".stock-cat-items");
        group.classList.toggle("is-collapsed", catCollapsed[cat]);
        btn.setAttribute("aria-expanded", !catCollapsed[cat]);
        items.hidden = catCollapsed[cat];
      }));

    /* Wire add-item form */
    const addBtn = $("#stock-add-toggle");
    const addForm = $("#stock-add-form");
    addBtn.addEventListener("click", () => {
      addFormOpen = !addFormOpen;
      addForm.hidden = !addFormOpen;
      addBtn.textContent = addFormOpen ? "✕ Cancel" : "+ Add New Item";
      if (addFormOpen) $("#add-name").focus();
    });
    $("#add-cat-sel").addEventListener("change", () => {
      const isNew = $("#add-cat-sel").value === "__new__";
      $("#add-cat-text").hidden = !isNew;
      if (isNew) $("#add-cat-text").focus();
    });
    $("#stock-add-save").addEventListener("click", onAddItemSave);
    $("#stock-add-cancel").addEventListener("click", () => {
      addFormOpen = false;
      addForm.hidden = true;
      addBtn.textContent = "+ Add New Item";
    });
  }

  /* ── Inline name edit ──────────────────────────────────────────────────── */
  function startNameEdit(el) {
    const id = el.dataset.nameId;
    const item = menu.find(m => m.id === id);
    if (!item) return;
    const row = el.closest(".stock-row");
    el.replaceWith(Object.assign(document.createElement("span"), { className: "s-name stock-name-input" }));
    const inputWrap = row.querySelector(".stock-name-input");
    inputWrap.innerHTML = `<input type="text" value="${escapeHtml(item.name)}" class="name-edit-input" aria-label="Edit name for ${escapeHtml(item.name)}">
      <button class="btn btn-primary btn-xs" type="button" data-save-name="${id}">✓</button>
      <button class="btn btn-ghost btn-xs" type="button" data-cancel-name="${id}">✕</button>`;
    const inp = inputWrap.querySelector("input");
    inp.focus();
    inp.select();
    inputWrap.querySelector(`[data-save-name="${id}"]`).addEventListener("click", () => saveName(id, inp.value.trim()));
    inputWrap.querySelector(`[data-cancel-name="${id}"]`).addEventListener("click", () => renderStock());
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter") saveName(id, inp.value.trim());
      if (e.key === "Escape") renderStock();
    });
  }

  async function saveName(id, newName) {
    if (!newName) { toast("Name can't be empty.", true); return; }
    try {
      menu = await DB.menu.updateItem(id, { name: newName });
      toast(`Renamed to "${newName}"`);
      Chime.add();
      renderStock();
    } catch (err) {
      toast("Couldn't update name.", true);
      console.error(err);
    }
  }

  /* ── Inline price edit ─────────────────────────────────────────────────── */
  function startPriceEdit(el) {
    const id = el.dataset.priceId;
    const item = menu.find(m => m.id === id);
    if (!item) return;
    const row = el.closest(".stock-row");
    el.replaceWith(Object.assign(document.createElement("span"), { className: "s-price stock-price-input" }));
    const inputWrap = row.querySelector(".stock-price-input");
    inputWrap.innerHTML = `<input type="number" min="0" step="1" value="${item.price}" class="price-edit-input" aria-label="Edit price for ${escapeHtml(item.name)}">
      <button class="btn btn-primary btn-xs" type="button" data-save-price="${id}">✓</button>
      <button class="btn btn-ghost btn-xs" type="button" data-cancel-price="${id}">✕</button>`;
    const inp = inputWrap.querySelector("input");
    inp.focus();
    inp.select();
    inputWrap.querySelector(`[data-save-price="${id}"]`).addEventListener("click", () => savePrice(id, Number(inp.value)));
    inputWrap.querySelector(`[data-cancel-price="${id}"]`).addEventListener("click", () => renderStock());
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter") savePrice(id, Number(inp.value));
      if (e.key === "Escape") renderStock();
    });
  }

  async function savePrice(id, newPrice) {
    if (!newPrice || newPrice < 0) { toast("Price must be ≥ ₹0", true); return; }
    try {
      menu = await DB.menu.updateItem(id, { price: newPrice });
      const item = menu.find(m => m.id === id);
      toast(`${item.name} → ${fmt(newPrice)}`);
      Chime.add();
      renderStock();
    } catch (err) {
      toast("Couldn't update price.", true);
      console.error(err);
    }
  }

  /* ── Add item ──────────────────────────────────────────────────────────── */
  async function onAddItemSave() {
    const name = $("#add-name").value.trim();
    const catSel = $("#add-cat-sel").value;
    const catText = $("#add-cat-text").value.trim();
    const category = catSel === "__new__" ? catText : catSel;
    const price = Number($("#add-price").value);
    const in_stock = $("#add-stock").checked;

    if (!name) { toast("Enter a name.", true); return; }
    if (!category) { toast("Pick a category.", true); return; }
    if (!price || price < 0) { toast("Enter a valid price.", true); return; }

    try {
      menu = await DB.menu.addItem({ name, category, price, in_stock });
      toast(`${name} added to ${category}`);
      Chime.add();
      addFormOpen = false;
      catCollapsed[category] = false;  // expand so the new item is visible
      renderStock();
    } catch (err) {
      toast("Couldn't add item.", true);
      console.error(err);
    }
  }

  /* ── Stock toggle ──────────────────────────────────────────────────────── */
  async function toggleStock(id) {
    try {
      menu = await DB.menu.toggleStock(id);
      const item = menu.find(m => m.id === id);
      const row = document.querySelector(`#stock .stock-row[data-id="${CSS.escape(id)}"]`);
      if (row) {
        row.querySelector("[data-stock]").checked = item.in_stock !== false;
        row.classList.toggle("is-khali", item.in_stock === false);
      }
      toast(`${item.name} is now ${item.in_stock === false ? "OUT of stock" : "back in stock"}`);
      if (item.in_stock === false) Chime.error(); else Chime.add();
    } catch (err) {
      toast("Couldn't update stock.", true);
      console.error(err);
    }
  }

  /* ── Earnings ──────────────────────────────────────────────────────────── */
  function rangeStart() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (earnRange === "today") return d;
    if (earnRange === "week") { d.setDate(d.getDate() - d.getDay()); return d; }
    d.setDate(1);
    return d;
  }

  function renderEarnings() {
    const wrap = $("#earn-summary");
    if (!wrap || $("#earnings").hidden) return;
    const start = rangeStart();
    const rows = orders.filter(o => countable(o) && new Date(o.created_at) >= start);
    const revenue = sumTakings(rows);
    const paidCount = rows.filter(o => o.status === "paid").length;
    const label = { today: "Today", week: "This week", month: "This month" }[earnRange];

    $("#earn-summary").innerHTML = `
      <div class="ledger"><div class="ledger-label">${label} earnings</div><div class="ledger-value">${fmt(revenue)}</div></div>
      <div class="ledger"><div class="ledger-label">${label} orders</div><div class="ledger-value">${rows.length}<small> · ${paidCount} paid</small></div></div>`;

    $("#earn-list").innerHTML = rows.length
      ? rows.map(o => `
        <div class="earn-row${o.status === "paid" ? "" : " is-unpaid"}">
          <span class="e-token">#${escapeHtml(o.token)}</span>
          <span class="e-meta">${escapeHtml(o.customer_name)} · ${time(o.created_at)}${o.status === "paid" ? "" : " · not paid yet"}</span>
          <span class="e-amt">${fmt(o.net_amount)}</span>
        </div>`).join("")
      : `<p class="small muted">No orders in this range yet.</p>`;
  }

  wireLogin();
  if (sessionValid()) bootApp();
})();
