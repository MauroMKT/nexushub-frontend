import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";

// Pagina del modulo pilota "Ristorazione & Hospitality" (Fase 9.1, estesa in
// Fase 9.15 con un vero POS ristorante). Condivisa tra 4 slug del catalogo
// (ristorazione, bar_bistrot, locali_notturni, hotel), che restano attivabili
// e vendibili separatamente — vedi modules_catalog.py. Il tipo di attività
// (ristorante/hotel) è invece un menu a tendina lato utente (HospitalityProfile),
// indipendente da quale modulo è stato acquistato: decide solo quali tab
// mostrare, per non forzare un ristorante dentro l'interfaccia di un hotel o
// viceversa.

const RES_STATUSES = ["confirmed", "seated", "completed", "cancelled", "no_show"];
const MENU_CATEGORIES = ["antipasti", "primi", "secondi", "dolci", "bevande", "altro"];
const ORDER_STATUSES = ["in_attesa", "in_preparazione", "pronto", "consegnato", "annullato"];
const KITCHEN_STATUSES = ["in_attesa", "in_preparazione", "pronto"];

const emptyReservation = {
  client_id: "", guest_name: "", party_size: 2, table_label: "",
  reservation_time: "", status: "confirmed", notes: "",
};
const emptyMenuItem = { name: "", category: "antipasti", price: 0, description: "", is_available: true };

export default function Hospitality() {
  const { t } = useTranslation();
  const tp = (k) => t(`pilotModules.${k}`);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("reservations");

  useEffect(() => {
    api.getHospitalityProfile().then((p) => {
      setProfile(p);
      // Prima apertura: per un ristorante partiamo dalla mappa tavoli (il punto
      // di lavoro quotidiano), per un hotel dalle prenotazioni.
      setTab(p.business_type === "hotel" ? "reservations" : "tables");
    }).catch(() => setProfile({ business_type: "ristorante" }));
  }, []);

  async function handleBusinessTypeChange(business_type) {
    const updated = await api.updateHospitalityProfile({ business_type });
    setProfile(updated);
    setTab(business_type === "hotel" ? "reservations" : "tables");
  }

  if (!profile) return null;
  const isRestaurant = profile.business_type !== "hotel";

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{tp("hospitality.title")}</h1>
          <p className="text-sm text-ink/60">{tp("hospitality.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-ink/50">{tp("hospitality.field_business_type")}</label>
          <select
            value={profile.business_type}
            onChange={(e) => handleBusinessTypeChange(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl2 px-3 py-1.5 bg-white font-semibold"
          >
            <option value="ristorante">{tp("hospitality.business_type_ristorante")}</option>
            <option value="hotel">{tp("hospitality.business_type_hotel")}</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {isRestaurant && <TabButton active={tab === "tables"} onClick={() => setTab("tables")} label={tp("hospitality.tab_tables")} />}
        {isRestaurant && <TabButton active={tab === "kitchen"} onClick={() => setTab("kitchen")} label={tp("hospitality.tab_kitchen")} />}
        {isRestaurant && <TabButton active={tab === "delivery"} onClick={() => setTab("delivery")} label={tp("hospitality.tab_delivery")} />}
        {isRestaurant && <TabButton active={tab === "orders"} onClick={() => setTab("orders")} label={tp("hospitality.tab_orders")} />}
        <TabButton active={tab === "reservations"} onClick={() => setTab("reservations")} label={tp("hospitality.tab_reservations")} />
        <TabButton active={tab === "menu"} onClick={() => setTab("menu")} label={tp("hospitality.tab_menu")} />
      </div>

      {tab === "tables" && isRestaurant && <TablesTab tp={tp} />}
      {tab === "kitchen" && isRestaurant && <KitchenTab tp={tp} />}
      {tab === "delivery" && isRestaurant && <DeliveryTab tp={tp} />}
      {tab === "orders" && isRestaurant && <OrdersTab tp={tp} />}
      {tab === "reservations" && <ReservationsTab tp={tp} />}
      {tab === "menu" && <MenuTab tp={tp} />}
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl2 text-sm font-semibold border transition-colors ${
        active ? "bg-primary border-primary text-ink" : "border-slate-200 text-ink/60 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

// ===================== Mappa tavoli =====================
function TablesTab({ tp }) {
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ label: "", seats: 2 });
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  function refresh() {
    api.listRestaurantTables().then(setTables).catch((e) => setError(e.message));
  }
  useEffect(() => {
    refresh();
    api.listMenuItems().then(setMenuItems).catch(() => {});
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.createRestaurantTable({ label: form.label, seats: Number(form.seats) || 2, pos_x: 8, pos_y: 8 });
      setForm({ label: "", seats: 2 });
      setShowAddForm(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(tp("hospitality.confirm_delete_table"))) return;
    await api.deleteRestaurantTable(id);
    if (selectedId === id) setSelectedId(null);
    refresh();
  }

  function handlePointerDown(e, tableId) {
    e.preventDefault();
    const mapEl = mapRef.current;
    if (!mapEl) return;
    function point(ev) {
      const t0 = ev.touches ? ev.touches[0] : ev;
      return { x: t0.clientX, y: t0.clientY };
    }
    function onMove(ev) {
      const rect = mapEl.getBoundingClientRect();
      const { x: clientX, y: clientY } = point(ev);
      let x = ((clientX - rect.left) / rect.width) * 100;
      let y = ((clientY - rect.top) / rect.height) * 100;
      x = Math.max(0, Math.min(95, x));
      y = Math.max(0, Math.min(90, y));
      setTables((prev) => prev.map((tt) => (tt.id === tableId ? { ...tt, pos_x: x, pos_y: y } : tt)));
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
      setTables((current) => {
        const moved = current.find((tt) => tt.id === tableId);
        if (moved) api.updateRestaurantTable(tableId, { pos_x: moved.pos_x, pos_y: moved.pos_y }).catch(() => {});
        return current;
      });
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
  }

  const selected = tables.find((tt) => tt.id === selectedId) || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        {error && <div className="bg-accent/30 text-ink text-sm rounded-xl2 p-2 mb-3">{error}</div>}
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-ink/50">{tp("hospitality.tables_drag_hint")}</p>
          <button onClick={() => setShowAddForm((s) => !s)} className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-3 py-1.5 text-xs">
            {tp("hospitality.add_table")}
          </button>
        </div>
        {showAddForm && (
          <Card className="mb-3">
            <form onSubmit={handleAdd} className="flex gap-2 items-end flex-wrap">
              <Input label={tp("hospitality.field_table_name")} value={form.label} onChange={(v) => setForm({ ...form, label: v })} required />
              <Input label={tp("hospitality.field_table_seats")} type="number" value={form.seats} onChange={(v) => setForm({ ...form, seats: v })} />
              <button type="submit" className="bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-3 py-2 text-sm">
                {tp("common.save")}
              </button>
            </form>
          </Card>
        )}
        <div
          ref={mapRef}
          className="relative w-full h-[420px] bg-secondary/10 border-2 border-dashed border-secondary/40 rounded-xl2 overflow-hidden"
        >
          {tables.map((tt) => (
            <button
              key={tt.id}
              onMouseDown={(e) => handlePointerDown(e, tt.id)}
              onTouchStart={(e) => handlePointerDown(e, tt.id)}
              onClick={() => setSelectedId(tt.id)}
              style={{ left: `${tt.pos_x}%`, top: `${tt.pos_y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-xl2 flex flex-col items-center justify-center text-xs font-semibold shadow cursor-move select-none ${
                tt.occupied ? "bg-red-200 border-2 border-red-400 text-red-800" : "bg-green-200 border-2 border-green-400 text-green-800"
              } ${selectedId === tt.id ? "ring-2 ring-primary" : ""}`}
            >
              <span className="truncate max-w-[56px]">{tt.label}</span>
              <span className="text-[10px] opacity-70">{tt.seats}p</span>
            </button>
          ))}
          {tables.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-ink/40">{tp("hospitality.no_tables")}</p>
          )}
        </div>
        <div className="flex gap-3 mt-2 text-[11px] text-ink/50">
          <span><span className="inline-block w-3 h-3 rounded bg-green-200 border border-green-400 mr-1 align-middle" />{tp("hospitality.table_free")}</span>
          <span><span className="inline-block w-3 h-3 rounded bg-red-200 border border-red-400 mr-1 align-middle" />{tp("hospitality.table_occupied")}</span>
        </div>
      </div>

      <div>
        {selected ? (
          <TableDetailPanel
            table={selected}
            menuItems={menuItems}
            tp={tp}
            onDelete={() => handleDelete(selected.id)}
            onChanged={refresh}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <Card>
            <p className="text-sm text-ink/50">{tp("hospitality.select_table_hint")}</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function TableDetailPanel({ table, menuItems, tp, onDelete, onChanged, onClose }) {
  const [orders, setOrders] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [error, setError] = useState(null);

  function refreshOrders() {
    api.listKitchenOrders({ table_id: table.id }).then(setOrders).catch(() => {});
  }
  useEffect(refreshOrders, [table.id]);

  function handleOrderCreated() {
    setShowOrderForm(false);
    refreshOrders();
    onChanged();
  }

  const activeOrders = orders.filter((o) => !o.billed && o.status !== "annullato");

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-lg">{table.label}</div>
          <div className="text-xs text-ink/50">{table.seats} {tp("hospitality.seats_short")}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={onDelete} className="text-ink/30 hover:text-red-500 text-xs">🗑️</button>
          <button onClick={onClose} className="text-ink/30 hover:text-ink/70 text-xs">✕</button>
        </div>
      </div>

      {error && <div className="bg-accent/30 text-ink text-xs rounded-xl2 p-2 my-2">{error}</div>}

      <div className="mt-3 space-y-2">
        {activeOrders.length === 0 && <p className="text-xs text-ink/40">{tp("hospitality.no_active_orders")}</p>}
        {activeOrders.map((o) => (
          <OrderCard key={o.id} order={o} tp={tp} onChanged={refreshOrders} />
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={() => setShowOrderForm((s) => !s)} className="flex-1 bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-3 py-2 text-xs">
          🍽️ {tp("hospitality.new_order")}
        </button>
        {activeOrders.length > 0 && (
          <button onClick={() => setShowBill(true)} className="flex-1 bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-3 py-2 text-xs">
            🧾 {tp("hospitality.view_bill")}
          </button>
        )}
      </div>

      {showOrderForm && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <NewOrderForm orderType="tavolo" tableId={table.id} menuItems={menuItems} tp={tp} onCreated={handleOrderCreated} onError={setError} />
        </div>
      )}

      {showBill && (
        <BillModal mode="table" tableId={table.id} tp={tp} onClose={() => setShowBill(false)}
                   onClosed={() => { setShowBill(false); refreshOrders(); onChanged(); }} />
      )}
    </Card>
  );
}

// ===================== Nuova comanda (riusata da tavolo/asporto/delivery) =====================
function NewOrderForm({ orderType, tableId, menuItems, tp, onCreated, onError }) {
  const [rows, setRows] = useState([{ menu_item_id: "", name: "", quantity: 1, notes: "" }]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateRow(i, field, value) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { menu_item_id: "", name: "", quantity: 1, notes: "" }]);
  }
  function removeRow(i) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    onError(null);
    const items = rows
      .filter((r) => r.menu_item_id || r.name.trim())
      .map((r) => ({
        menu_item_id: r.menu_item_id || null,
        name: r.name.trim() || null,
        quantity: Math.max(1, Number(r.quantity) || 1),
        notes: r.notes || null,
      }));
    if (items.length === 0) {
      onError(tp("hospitality.error_no_items"));
      return;
    }
    setSubmitting(true);
    try {
      await api.createKitchenOrder({
        order_type: orderType, table_id: tableId || null,
        customer_name: customerName || null, customer_phone: customerPhone || null,
        delivery_address: orderType === "delivery" ? deliveryAddress || null : null,
        items,
      });
      onCreated();
    } catch (err) {
      onError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {orderType !== "tavolo" && (
        <div className="grid grid-cols-2 gap-2">
          <Input label={tp("hospitality.field_customer_name")} value={customerName} onChange={setCustomerName} required />
          <Input label={tp("hospitality.field_customer_phone")} value={customerPhone} onChange={setCustomerPhone} />
          {orderType === "delivery" && (
            <div className="col-span-2">
              <Input label={tp("hospitality.field_delivery_address")} value={deliveryAddress} onChange={setDeliveryAddress} required />
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-1 items-center bg-bg rounded-xl2 p-1.5">
            <select
              value={row.menu_item_id}
              onChange={(e) => updateRow(i, "menu_item_id", e.target.value)}
              className="flex-1 text-xs border border-slate-200 rounded-lg px-1.5 py-1 bg-white"
            >
              <option value="">{tp("hospitality.custom_item_option")}</option>
              {menuItems.map((m) => (
                <option key={m.id} value={m.id}>{m.name} · {m.price}</option>
              ))}
            </select>
            {!row.menu_item_id && (
              <input
                value={row.name}
                onChange={(e) => updateRow(i, "name", e.target.value)}
                placeholder={tp("hospitality.custom_item_placeholder")}
                className="flex-1 text-xs border border-slate-200 rounded-lg px-1.5 py-1"
              />
            )}
            <input
              type="number" min="1" value={row.quantity}
              onChange={(e) => updateRow(i, "quantity", e.target.value)}
              className="w-12 text-xs border border-slate-200 rounded-lg px-1 py-1"
            />
            <button type="button" onClick={() => removeRow(i)} className="text-ink/30 hover:text-red-500 text-xs shrink-0">✕</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addRow} className="text-xs text-primary hover:underline">
        + {tp("hospitality.add_item_row")}
      </button>
      <button type="submit" disabled={submitting} className="w-full bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-3 py-2 text-xs disabled:opacity-50">
        {submitting ? "…" : `🍽️ ${tp("hospitality.send_to_kitchen")}`}
      </button>
    </form>
  );
}

// ===================== Card ordine (usata in tavolo/cucina/delivery/ordini) =====================
function OrderCard({ order, tp, onChanged, big = false }) {
  const [busy, setBusy] = useState(false);

  const NEXT_STATUS = { in_attesa: "in_preparazione", in_preparazione: "pronto", pronto: "consegnato" };
  const STATUS_LABEL_KEY = { in_attesa: "advance_to_preparing", in_preparazione: "advance_to_ready", pronto: "advance_to_delivered" };

  async function advance() {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setBusy(true);
    try {
      await api.updateKitchenOrderStatus(order.id, next);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!window.confirm(tp("hospitality.confirm_cancel_order"))) return;
    setBusy(true);
    try {
      await api.updateKitchenOrderStatus(order.id, "annullato");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  const label = order.order_type === "tavolo" ? order.table_label
    : order.order_type === "delivery" ? `🛵 ${order.customer_name || tp("hospitality.order_type_delivery")}`
    : `🥡 ${order.customer_name || tp("hospitality.order_type_asporto")}`;

  return (
    <div className={`bg-slate-50 rounded-xl2 p-2 ${big ? "p-3" : ""}`}>
      <div className="flex items-start justify-between">
        <div className={`font-semibold ${big ? "text-base" : "text-xs"}`}>{label}</div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full bg-secondary/50 ${big ? "text-xs" : ""}`}>{tp(`hospitality.order_status_${order.status}`)}</span>
      </div>
      <ul className={`mt-1 space-y-0.5 ${big ? "text-sm" : "text-[11px]"} text-ink/70`}>
        {order.items.map((it) => (
          <li key={it.id}>{it.quantity}× {it.name}{it.notes ? ` (${it.notes})` : ""}</li>
        ))}
      </ul>
      {order.delivery_address && <div className="text-[11px] text-ink/50 mt-0.5">📍 {order.delivery_address}</div>}
      <div className="flex gap-2 mt-2">
        {NEXT_STATUS[order.status] && (
          <button onClick={advance} disabled={busy} className="flex-1 bg-primary hover:bg-primary/80 text-ink font-semibold rounded-lg px-2 py-1 text-[11px] disabled:opacity-50">
            {tp(`hospitality.${STATUS_LABEL_KEY[order.status]}`)}
          </button>
        )}
        {order.status !== "annullato" && order.status !== "consegnato" && (
          <button onClick={cancel} disabled={busy} className="text-red-500 hover:underline text-[11px]">{tp("hospitality.cancel_order")}</button>
        )}
      </div>
    </div>
  );
}

// ===================== Conto =====================
function BillModal({ mode, tableId, order, tp, onClose, onClosed }) {
  const [preview, setPreview] = useState(mode === "order" ? order : null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("contanti");
  const [error, setError] = useState(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (mode === "table") {
      api.previewTableBill(tableId).then(setPreview).catch((e) => setError(e.message));
    }
  }, [mode, tableId]);

  async function handleClose() {
    setClosing(true);
    setError(null);
    try {
      const payload = { discount: Number(discount) || 0, payment_method: paymentMethod };
      if (mode === "table") await api.closeTableBill(tableId, payload);
      else await api.closeOrderBill(order.id, payload);
      onClosed();
    } catch (err) {
      setError(err.message);
    } finally {
      setClosing(false);
    }
  }

  const orders = mode === "table" ? preview?.orders || [] : [order];
  const subtotal = mode === "table" ? preview?.subtotal || 0 : order.total;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl2 shadow-lg max-w-md w-full p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">{tp("hospitality.bill_title")}</h3>
          <button onClick={onClose} className="text-ink/30 hover:text-ink/70">✕</button>
        </div>
        {error && <div className="bg-accent/30 text-ink text-xs rounded-xl2 p-2 mb-2">{error}</div>}
        <div className="space-y-2 mb-3">
          {orders.map((o) => (
            <div key={o.id} className="text-xs bg-slate-50 rounded-lg p-2">
              {o.items.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span>{it.quantity}× {it.name}</span>
                  <span>{(it.unit_price * it.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-ink/60">{tp("hospitality.subtotal")}</span>
          <span className="font-semibold">{subtotal.toFixed(2)}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Input label={tp("hospitality.discount")} type="number" value={discount} onChange={setDiscount} />
          <Select label={tp("hospitality.payment_method")} value={paymentMethod} onChange={setPaymentMethod}
                  options={["contanti", "carta", "altro"].map((m) => ({ value: m, label: tp(`hospitality.payment_${m}`) }))} />
        </div>
        <div className="flex justify-between text-base font-bold mb-4">
          <span>{tp("hospitality.total")}</span>
          <span>{Math.max(0, subtotal - (Number(discount) || 0)).toFixed(2)}</span>
        </div>
        <button onClick={handleClose} disabled={closing} className="w-full bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm disabled:opacity-50">
          {closing ? "…" : `✅ ${tp("hospitality.close_bill")}`}
        </button>
      </div>
    </div>
  );
}

// ===================== Cucina / Display =====================
function KitchenTab({ tp }) {
  const [orders, setOrders] = useState([]);

  function refresh() {
    api.listKitchenOrders({ status: KITCHEN_STATUSES.join(",") }).then(setOrders).catch(() => {});
  }
  useEffect(() => {
    refresh();
    // Pensato per restare aperto su un tablet/monitor in cucina: si aggiorna
    // da solo, non serve che qualcuno prema "aggiorna".
    const id = setInterval(refresh, 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {KITCHEN_STATUSES.map((status) => (
        <div key={status}>
          <div className="font-semibold text-sm mb-2 flex items-center gap-2">
            {tp(`hospitality.order_status_${status}`)}
            <span className="text-xs text-ink/40">({orders.filter((o) => o.status === status).length})</span>
          </div>
          <div className="space-y-2">
            {orders.filter((o) => o.status === status).map((o) => (
              <OrderCard key={o.id} order={o} tp={tp} onChanged={refresh} big />
            ))}
            {orders.filter((o) => o.status === status).length === 0 && (
              <p className="text-xs text-ink/30">{tp("hospitality.kitchen_empty_column")}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ===================== Delivery & Asporto =====================
function DeliveryTab({ tp }) {
  const [orderType, setOrderType] = useState("delivery");
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [billOrder, setBillOrder] = useState(null);

  function refresh() {
    api.listKitchenOrders({ order_type: orderType }).then(setOrders).catch((e) => setError(e.message));
  }
  useEffect(refresh, [orderType]);
  useEffect(() => { api.listMenuItems().then(setMenuItems).catch(() => {}); }, []);

  const activeOrders = orders.filter((o) => !o.billed && o.status !== "annullato");
  const pastOrders = orders.filter((o) => o.billed || o.status === "annullato");

  return (
    <div>
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <div className="flex gap-2">
          <TabButton active={orderType === "delivery"} onClick={() => setOrderType("delivery")} label={`🛵 ${tp("hospitality.order_type_delivery")}`} />
          <TabButton active={orderType === "asporto"} onClick={() => setOrderType("asporto")} label={`🥡 ${tp("hospitality.order_type_asporto")}`} />
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-3 py-1.5 text-xs">
          {tp("hospitality.new_order")}
        </button>
      </div>

      {error && <div className="bg-accent/30 text-ink text-sm rounded-xl2 p-2 mb-3">{error}</div>}

      {showForm && (
        <Card className="mb-4">
          <NewOrderForm orderType={orderType} tableId={null} menuItems={menuItems} tp={tp}
                        onCreated={() => { setShowForm(false); refresh(); }} onError={setError} />
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeOrders.map((o) => (
          <Card key={o.id}>
            <OrderCard order={o} tp={tp} onChanged={refresh} />
            <button onClick={() => setBillOrder(o)} className="w-full mt-2 bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-3 py-1.5 text-xs">
              🧾 {tp("hospitality.close_bill")}
            </button>
          </Card>
        ))}
        {activeOrders.length === 0 && <p className="text-sm text-ink/40">{tp("hospitality.no_active_orders")}</p>}
      </div>

      {pastOrders.length > 0 && (
        <div className="mt-6">
          <div className="text-xs font-semibold text-ink/50 mb-2">{tp("hospitality.recent_history")}</div>
          <div className="space-y-1">
            {pastOrders.slice(0, 10).map((o) => (
              <div key={o.id} className="text-xs flex justify-between bg-slate-50 rounded-lg px-2 py-1">
                <span>{o.customer_name || "—"} · {o.items.length} {tp("hospitality.items_short")}</span>
                <span className="text-ink/40">{tp(o.billed ? "hospitality.order_billed" : "hospitality.order_status_annullato")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {billOrder && (
        <BillModal mode="order" order={billOrder} tp={tp} onClose={() => setBillOrder(null)}
                   onClosed={() => { setBillOrder(null); refresh(); }} />
      )}
    </div>
  );
}

// ===================== Gestione ordini (vista completa, tutti i canali) =====================
function OrdersTab({ tp }) {
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showBills, setShowBills] = useState(false);

  function refresh() {
    const params = {};
    if (filterType) params.order_type = filterType;
    if (filterStatus) params.status = filterStatus;
    api.listKitchenOrders(params).then(setOrders).catch(() => {});
  }
  useEffect(refresh, [filterType, filterStatus]);
  useEffect(() => { if (showBills) api.listBills().then(setBills).catch(() => {}); }, [showBills]);

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap items-end">
        <Select label={tp("hospitality.filter_type")} value={filterType} onChange={setFilterType}
                options={[{ value: "", label: tp("hospitality.filter_all") },
                          { value: "tavolo", label: tp("hospitality.order_type_tavolo") },
                          { value: "asporto", label: tp("hospitality.order_type_asporto") },
                          { value: "delivery", label: tp("hospitality.order_type_delivery") }]} />
        <Select label={tp("hospitality.filter_status")} value={filterStatus} onChange={setFilterStatus}
                options={[{ value: "", label: tp("hospitality.filter_all") },
                          ...ORDER_STATUSES.map((s) => ({ value: s, label: tp(`hospitality.order_status_${s}`) }))]} />
        <button onClick={() => setShowBills((s) => !s)} className="text-xs text-primary hover:underline mb-2">
          {showBills ? tp("hospitality.hide_bill_history") : tp("hospitality.show_bill_history")}
        </button>
      </div>

      {showBills && (
        <Card className="mb-4">
          <div className="text-xs font-semibold mb-2">{tp("hospitality.bill_history")}</div>
          <div className="space-y-1">
            {bills.map((b) => (
              <div key={b.id} className="flex justify-between text-xs bg-slate-50 rounded-lg px-2 py-1">
                <span>{b.table_label || tp("hospitality.order_no_table")} · {tp(`hospitality.payment_${b.payment_method || "altro"}`)}</span>
                <span className="font-semibold">{b.total.toFixed(2)}</span>
              </div>
            ))}
            {bills.length === 0 && <p className="text-xs text-ink/40">{tp("hospitality.no_bills_yet")}</p>}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {orders.map((o) => (
          <Card key={o.id}>
            <OrderCard order={o} tp={tp} onChanged={refresh} />
          </Card>
        ))}
        {orders.length === 0 && <p className="text-sm text-ink/40">{tp("common.empty")}</p>}
      </div>
    </div>
  );
}

// ===================== Prenotazioni (invariato) =====================
function ReservationsTab({ tp }) {
  const [reservations, setReservations] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyReservation);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

  function refresh() {
    api.listReservations().then(setReservations).catch((e) => setError(e.message));
  }

  useEffect(() => {
    refresh();
    api.listClients().then(setClients).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        ...form, client_id: form.client_id || null,
        guest_name: form.guest_name || null,
        party_size: Number(form.party_size) || 1,
        reservation_time: form.reservation_time ? new Date(form.reservation_time).toISOString() : null,
      };
      await api.createReservation(payload);
      setForm(emptyReservation);
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(r, status) {
    await api.updateReservation(r.id, { status });
    refresh();
  }

  async function handleDelete(id) {
    await api.deleteReservation(id);
    refresh();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm((s) => !s)} className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
          {tp("common.new")}
        </button>
      </div>
      {error && <div className="bg-accent/30 text-ink text-sm rounded-xl2 p-2 mb-4">{error}</div>}
      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select label={tp("common.client_label")} value={form.client_id}
                    onChange={(v) => setForm({ ...form, client_id: v })}
                    options={[{ value: "", label: `— ${tp("common.client_none")}` },
                              ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
            <Input label={tp("hospitality.field_guest_name")} value={form.guest_name}
                   onChange={(v) => setForm({ ...form, guest_name: v })} />
            <Input label={tp("hospitality.field_party_size")} type="number" value={form.party_size}
                   onChange={(v) => setForm({ ...form, party_size: v })} />
            <Input label={tp("hospitality.field_table_label")} value={form.table_label}
                   onChange={(v) => setForm({ ...form, table_label: v })} />
            <Input label={tp("hospitality.field_reservation_time")} type="datetime-local" value={form.reservation_time}
                   onChange={(v) => setForm({ ...form, reservation_time: v })} required />
            <Select label={tp("hospitality.field_status")} value={form.status}
                    onChange={(v) => setForm({ ...form, status: v })}
                    options={RES_STATUSES.map((s) => ({ value: s, label: tp(`hospitality.status_${s}`) }))} />
            <div className="md:col-span-2">
              <label className="text-sm font-medium block mb-1">{tp("common.notes_label")}</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl2 px-3 py-2" rows={2} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
                {tp("common.save")}
              </button>
            </div>
          </form>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reservations.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between">
              <div className="font-semibold">{r.client_name || r.guest_name || "—"}</div>
              <button onClick={() => handleDelete(r.id)} className="text-ink/30 hover:text-ink/70 text-xs">✕</button>
            </div>
            <div className="text-sm text-ink/60">{new Date(r.reservation_time).toLocaleString()}</div>
            <select
              value={r.status}
              onChange={(e) => handleStatusChange(r, e.target.value)}
              className="mt-2 text-xs border border-slate-200 rounded-xl2 px-2 py-1 bg-secondary/20"
            >
              {RES_STATUSES.map((s) => (
                <option key={s} value={s}>{tp(`hospitality.status_${s}`)}</option>
              ))}
            </select>
            <div className="text-sm text-ink/70 mt-2 space-y-0.5">
              <div>👥 {r.party_size}</div>
              {r.table_label && <div>🪑 {r.table_label}</div>}
            </div>
          </Card>
        ))}
        {reservations.length === 0 && <p className="text-ink/50 text-sm">{tp("common.empty")}</p>}
      </div>
    </div>
  );
}

// ===================== Menu (invariato) =====================
function MenuTab({ tp }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyMenuItem);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

  function refresh() {
    api.listMenuItems().then(setItems).catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.createMenuItem({ ...form, price: Number(form.price) || 0 });
      setForm(emptyMenuItem);
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleAvailable(item) {
    await api.updateMenuItem(item.id, { is_available: !item.is_available });
    refresh();
  }

  async function handleDelete(id) {
    await api.deleteMenuItem(id);
    refresh();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm((s) => !s)} className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
          {tp("common.new")}
        </button>
      </div>
      {error && <div className="bg-accent/30 text-ink text-sm rounded-xl2 p-2 mb-4">{error}</div>}
      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label={tp("hospitality.field_menu_name")} value={form.name}
                   onChange={(v) => setForm({ ...form, name: v })} required />
            <Select label={tp("hospitality.field_menu_category")} value={form.category}
                    onChange={(v) => setForm({ ...form, category: v })}
                    options={MENU_CATEGORIES.map((c) => ({ value: c, label: tp(`hospitality.category_${c}`) }))} />
            <Input label={tp("hospitality.field_menu_price")} type="number" value={form.price}
                   onChange={(v) => setForm({ ...form, price: v })} />
            <label className="flex items-center gap-2 text-sm mt-6">
              <input type="checkbox" checked={form.is_available}
                     onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
              {tp("hospitality.field_menu_available")}
            </label>
            <div className="md:col-span-2">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl2 px-3 py-2" rows={2} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
                {tp("common.save")}
              </button>
            </div>
          </form>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((m) => (
          <Card key={m.id} className={m.is_available ? "" : "opacity-50"}>
            <div className="flex items-start justify-between">
              <div className="font-semibold">{m.name}</div>
              <button onClick={() => handleDelete(m.id)} className="text-ink/30 hover:text-ink/70 text-xs">✕</button>
            </div>
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-secondary/40 mt-1">
              {tp(`hospitality.category_${m.category}`)}
            </span>
            <div className="text-sm text-ink/70 mt-2">💰 {m.price}</div>
            <button onClick={() => toggleAvailable(m)} className="mt-2 text-xs underline text-ink/60">
              {tp("hospitality.field_menu_available")}: {m.is_available ? "✓" : "✕"}
            </button>
          </Card>
        ))}
        {items.length === 0 && <p className="text-ink/50 text-sm">{tp("common.empty")}</p>}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <input
        type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl2 px-3 py-2"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-slate-200 rounded-xl2 px-3 py-2">
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
