import { useState, useEffect } from "react";

const API = "https://smartcatch-production.up.railway.app";

export default function RestaurantView() {
  const [catches, setCatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ restaurant_name: "", restaurant_contact: "", quantity_kg: "", message: "" });
  const [tab, setTab] = useState("catches");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/catches`).then(r => r.json()).then(setCatches).catch(() => {});
    fetch(`${API}/api/orders`).then(r => r.json()).then(setOrders).catch(() => {});
  }, []);

  const handleOrder = async () => {
    if (!form.restaurant_name || !form.quantity_kg) return alert("Заполните имя и количество");
    setLoading(true);
    try {
      await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, catch_id: selected.id, quantity_kg: Number(form.quantity_kg) })
      });
      setSuccess(true);
      setSelected(null);
      setForm({ restaurant_name: "", restaurant_contact: "", quantity_kg: "", message: "" });
      const updated = await fetch(`${API}/api/orders`).then(r => r.json());
      setOrders(updated);
    } catch {
      alert("Ошибка при отправке заказа");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>🍽️ Портал ресторана</h2>

      {success && (
        <div style={{ background: "#d4edda", padding: 12, borderRadius: 8, marginBottom: 12 }}>
          ✅ Заказ отправлен! Рыбак свяжется с вами.
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["catches", "orders"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: tab === t ? "#0077b6" : "#e0e0e0", color: tab === t ? "white" : "#333" }}>
            {t === "catches" ? "🐟 Свежие уловы" : "📋 Мои заказы"}
          </button>
        ))}
      </div>

      {tab === "catches" && (
        <div>
          {catches.length === 0 && <p style={{ color: "#999" }}>Нет доступных уловов</p>}
          {catches.map(c => (
            <div key={c.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>🐠 {c.fish_type}</strong>
                  <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
                    ⚖️ {c.weight_kg} кг &nbsp;|&nbsp; 🚤 {c.boat_number} &nbsp;|&nbsp; 👤 {c.boat_number}
                  </div>
                </div>
                <button onClick={() => { setSelected(c); setSuccess(false); }}
                  style={{ background: "#0077b6", color: "white", border: "none", borderRadius: 8,
                    padding: "8px 14px", cursor: "pointer" }}>
                  Заказать
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "orders" && (
        <div>
          {orders.length === 0 && <p style={{ color: "#999" }}>Заказов пока нет</p>}
          {orders.map(o => (
            <div key={o.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <strong>{o.fish_type}</strong> — {o.quantity_kg} кг
              <div style={{ fontSize: 13, color: "#555" }}>от: {o.restaurant_name}</div>
              <div style={{ fontSize: 12, color: o.status === "pending" ? "#e67e22" : "#27ae60" }}>
                Статус: {o.status === "pending" ? "⏳ Ожидает" : "✅ Принят"}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, width: 320 }}>
            <h3>Заказать: {selected.fish_type}</h3>
            <p style={{ color: "#555", fontSize: 13 }}>Доступно: {selected.weight_kg} кг</p>
            {[
              { key: "restaurant_name", label: "Название ресторана *", type: "text" },
              { key: "restaurant_contact", label: "Контакт (тел/email)", type: "text" },
              { key: "quantity_kg", label: "Количество (кг) *", type: "number" },
              { key: "message", label: "Сообщение рыбаку", type: "text" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>{f.label}</label>
                <input type={f.type} value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={handleOrder} disabled={loading}
                style={{ flex: 1, background: "#0077b6", color: "white", border: "none",
                  borderRadius: 8, padding: 10, cursor: "pointer" }}>
                {loading ? "Отправка..." : "Отправить заказ"}
              </button>
              <button onClick={() => setSelected(null)}
                style={{ flex: 1, background: "#e0e0e0", border: "none", borderRadius: 8, padding: 10, cursor: "pointer" }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}