import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { useAuth } from './AuthContext.jsx';

const ROLES = [
  { id: "fisher",     emoji: "🎣", label: "Рыбак",      desc: "Фиксирую улов и продаю" },
  { id: "restaurant", emoji: "🍽️", label: "Ресторан",   desc: "Покупаю свежую рыбу" },
  { id: "inspector",  emoji: "📋", label: "Инспектор",  desc: "Слежу за квотами" },
];

export default function RegisterPage() {
  const { user, setRole } = useAuth();

  const handleSelect = async (roleId) => {
    await setDoc(doc(db, "users", user.uid), {
      role: roleId,
      name: user.displayName,
      email: user.email,
      createdAt: new Date(),
    });
    setRole(roleId);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100vh", background: "#f0f4f0", padding: 20 }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🐟</div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Smart Catch</h1>
      <p style={{ color: "#888", marginBottom: 32 }}>Кто вы?</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 340 }}>
        {ROLES.map((r) => (
          <button key={r.id} onClick={() => handleSelect(r.id)} style={{
            display: "flex", alignItems: "center", gap: 16, padding: "18px 24px",
            borderRadius: 14, border: "2px solid #e0e0e0", background: "white",
            cursor: "pointer", fontSize: 16, textAlign: "left",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <span style={{ fontSize: 32 }}>{r.emoji}</span>
            <div>
              <div style={{ fontWeight: 600 }}>{r.label}</div>
              <div style={{ color: "#888", fontSize: 13 }}>{r.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}