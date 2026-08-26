/* Data layer — Supabase when configured, localStorage otherwise.
   localStorage mode still syncs live across browser tabs on the same device
   (storage events), which covers the demo: open the customer site and the
   admin dashboard in two tabs and orders flow between them. */

(function () {
  const CFG = window.ATHIYA;
  const LIVE = Boolean(CFG.supabase && CFG.supabase.url && CFG.supabase.anonKey);

  const LS = {
    menu: "athiya_menu",
    orders: "athiya_orders",
    settings: "athiya_settings"
  };

  let sb = null;
  let supabasePromise = null;

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* full */ }
  }

  function emit(event, detail) {
    window.dispatchEvent(new CustomEvent(event, { detail }));
  }

  /* ── Supabase bootstrap (lazy, only when configured) ───────────────────── */
  let liveFailed = false;

  function loadSupabase() {
    if (!LIVE || liveFailed) {
      console.log("[ATHIYA] loadSupabase skipped:", { LIVE, liveFailed });
      return Promise.resolve(null);
    }
    if (sb) return Promise.resolve(sb);
    if (!supabasePromise) {
      supabasePromise = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        s.onload = () => {
          try {
            sb = window.supabase.createClient(CFG.supabase.url, CFG.supabase.anonKey);
            console.log("[ATHIYA] Supabase client created OK");
            resolve(sb);
          } catch (e) {
            liveFailed = true;
            console.error("[ATHIYA] Supabase createClient() threw:", e);
            resolve(null);
          }
        };
        s.onerror = () => {
          liveFailed = true;
          console.error("[ATHIYA] Supabase CDN script failed to load");
          resolve(null);
        };
        document.head.appendChild(s);
      });
    }
    return supabasePromise;
  }

  const tables = { menu: "menu_items", orders: "orders", settings: "settings" };

  /* ── Menu ──────────────────────────────────────────────────────────────── */
  async function menuList() {
    if (LIVE) {
      const client = await loadSupabase();
      if (client) {
        console.log("[ATHIYA] Supabase client loaded OK, querying menu_items...");
        const { data, error } = await client.from(tables.menu).select("*").order("sort_order");
        if (error) {
          console.error("[ATHIYA] Menu SELECT failed:", { code: error.code, message: error.message, details: error.details, hint: error.hint });
        } else {
          console.log("[ATHIYA] Menu SELECT returned", data.length, "rows:", data);
        }
        if (!error && data && data.length) return data;
        if (!error && data && !data.length) {
          console.warn("[ATHIYA] Menu table is empty — attempting seed from MENU_SEED...");
        }
        const rows = window.MENU_SEED.map((it, i) => ({ special: false, family: false, ...it, sort_order: i }));
        const { error: seedErr } = await client.from(tables.menu).upsert(rows);
        if (seedErr) {
          console.error("[ATHIYA] Menu seed INSERT failed:", { code: seedErr.code, message: seedErr.message, details: seedErr.details, hint: seedErr.hint });
        } else {
          console.log("[ATHIYA] Menu seed INSERT succeeded");
        }
        const { data: seeded } = await client.from(tables.menu).select("*").order("sort_order");
        console.log("[ATHIYA] Post-seed SELECT returned", (seeded || []).length, "rows");
        return seeded || [];
      }
      /* Supabase unavailable or failed — fall through to localStorage. */
    }
    const seedVersion = window.MENU_SEED_VERSION || 1;
    let storedVersion = Number(localStorage.getItem("athiya_menu_version") || 0);
    let m = read(LS.menu, null);
    if (!m || !m.length) {
      /* First run: seed everything. */
      m = window.MENU_SEED.map((it, i) => ({ ...it, sort_order: i }));
      write(LS.menu, m);
      localStorage.setItem("athiya_menu_version", String(seedVersion));
    } else if (storedVersion < seedVersion) {
      /* Seed version bumped: append any new seed items not already present (by id),
         preserving owner edits to existing items. */
      const existingIds = new Set(m.map(it => it.id));
      const newItems = window.MENU_SEED.filter(it => !existingIds.has(it.id));
      if (newItems.length) {
        m = m.concat(newItems.map((it, i) => ({ ...it, sort_order: m.length + i })));
        write(LS.menu, m);
      }
      localStorage.setItem("athiya_menu_version", String(seedVersion));
    }
    return m;
  }

  async function menuSave(items) {
    if (LIVE && !liveFailed) {
      const client = await loadSupabase();
      if (client) {
        const rows = items.map((it, i) => ({ ...it, sort_order: i }));
        const { error } = await client.from(tables.menu).upsert(rows);
        if (error) throw error;
      } else {
        write(LS.menu, items);
      }
    } else {
      write(LS.menu, items);
    }
    emit("db:menu", items);
    return items;
  }

  async function menuToggleStock(id) {
    const items = await menuList();
    const next = items.map(it => (it.id === id ? { ...it, in_stock: !it.in_stock } : it));
    return menuSave(next);
  }

  async function menuUpdateItem(id, patch) {
    const items = await menuList();
    const next = items.map(it => (it.id === id ? { ...it, ...patch } : it));
    return menuSave(next);
  }

  async function menuAddItem(item) {
    const items = await menuList();
    const maxSort = items.reduce((m, it) => Math.max(m, it.sort_order || 0), 0);
    const newItem = { in_stock: true, special: false, family: false, sort_order: maxSort + 1, ...item };
    return menuSave([...items, newItem]);
  }

  /* ── Orders ────────────────────────────────────────────────────────────── */
  async function ordersList() {
    if (LIVE && !liveFailed) {
      const client = await loadSupabase();
      if (client) {
        const { data, error } = await client
          .from(tables.orders)
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      }
    }
    return read(LS.orders, []);
  }

  async function nextToken() {
    const all = await ordersList();
    const max = all.reduce((m, o) => Math.max(m, parseInt(o.token, 10) || 0), 0);
    return String(max + 1).padStart(3, "0");
  }

  async function orderInsert(order) {
    const token = order.token || (await nextToken());
    const now = new Date().toISOString();
    const full = {
      ...order,
      id: "o" + now.replace(/\D/g, "").slice(0, 14) + Math.floor(Math.random() * 90 + 10),
      token,
      status: order.status || "pending",
      payment: "pod",
      created_at: now
    };
    if (LIVE && !liveFailed) {
      const client = await loadSupabase();
      if (client) {
        const { data, error } = await client.from(tables.orders).insert(full).select();
        if (error) throw error;
        emit("db:order", data[0]);
        return data[0];
      }
    }
    const all = read(LS.orders, []);
    all.unshift(full);
    write(LS.orders, all);
    emit("db:order", full);
    emit("db:orders", all);
    return full;
  }

  async function orderUpdate(id, patch) {
    if (LIVE && !liveFailed) {
      const client = await loadSupabase();
      if (client) {
        const { data, error } = await client.from(tables.orders).update(patch).eq("id", id).select();
        if (error) throw error;
        emit("db:order", data[0]);
        return data[0];
      }
    }
    const all = read(LS.orders, []);
    const next = all.map(o => (o.id === id ? { ...o, ...patch } : o));
    write(LS.orders, next);
    emit("db:orders", next);
    return next.find(o => o.id === id);
  }

  /* Realtime: Supabase channel when live; storage events + own events otherwise. */
  async function ordersSubscribe(onInsert) {
    if (LIVE && !liveFailed) {
      const client = await loadSupabase();
      if (client) {
        const channel = client
          .channel("orders-live")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: tables.orders }, payload => {
            onInsert(payload.new);
          })
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: tables.orders }, payload => {
            emit("db:order", payload.new);
          })
          .subscribe();
        return () => { client.removeChannel(channel); };
      }
    }
    const onStorage = e => {
      if (e.key !== LS.orders) return;
      try { onInsert(null, JSON.parse(e.newValue || "[]")); } catch { /* corrupted by other tab */ }
    };
    const onOrder = e => onInsert(e.detail, null);
    window.addEventListener("storage", onStorage);
    window.addEventListener("db:order", onOrder);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("db:order", onOrder); };
  }

  /* ── Settings (pincodes etc.) ──────────────────────────────────────────── */
  async function settingsGet() {
    if (LIVE && !liveFailed) {
      const client = await loadSupabase();
      if (client) {
        const { data, error } = await client.from(tables.settings).select("*").maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        return data || { pincodes: CFG.delivery.pincodes };
      }
    }
    return read(LS.settings, { pincodes: CFG.delivery.pincodes });
  }

  async function settingsSave(patch) {
    const current = await settingsGet();
    const next = { ...current, ...patch };
    if (LIVE && !liveFailed) {
      const client = await loadSupabase();
      if (client) {
        const { error } = await client.from(tables.settings).upsert(next);
        if (error) throw error;
      } else {
        write(LS.settings, next);
      }
    } else {
      write(LS.settings, next);
    }
    emit("db:settings", next);
    return next;
  }

  window.DB = {
    isLive: LIVE,
    tables,
    loadSupabase,
    menu: { list: menuList, save: menuSave, toggleStock: menuToggleStock, updateItem: menuUpdateItem, addItem: menuAddItem },
    orders: { list: ordersList, insert: orderInsert, update: orderUpdate, nextToken, subscribe: ordersSubscribe },
    settings: { get: settingsGet, save: settingsSave }
  };
})();
