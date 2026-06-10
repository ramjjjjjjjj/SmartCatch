import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const timeout = setTimeout(() => setLoading(false), 5000);
  
  const unsubscribe = onAuthStateChanged(auth, async (u) => {
    clearTimeout(timeout);
    setUser(u);
    if (u) {
      const snap = await getDoc(doc(db, "users", u.uid));
      setRole(snap.exists() ? snap.data().role : null);
    } else {
      setRole(null);
    }
    setLoading(false);
  });
  
  return () => { unsubscribe(); clearTimeout(timeout); };
}, []);

if (loading) return (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", height: "100vh",
    background: "#050D1A", fontFamily: "'Inter', system-ui, sans-serif"
  }}>
    <style>{`
      @keyframes dots {
        0%, 20% { opacity: 0; }
        50% { opacity: 1; }
        80%, 100% { opacity: 0; }
      }
      @keyframes progressBar {
        0% { width: 0%; }
        30% { width: 40%; }
        70% { width: 70%; }
        100% { width: 90%; }
      }
      @keyframes wave {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
    `}</style>

    <div style={{ display: "flex", alignItems: "center", gap: 2, color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 40 }}>
      <span>Загружаем данные</span>
      {[0, 0.3, 0.6].map((delay, i) => (
        <span key={i} style={{ animation: `dots 1.6s ease-in-out infinite ${delay}s`, opacity: 0 }}>.</span>
      ))}
    </div>

    <div style={{ width: 180, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        background: "linear-gradient(90deg, #00D4AA, #0078FF)",
        borderRadius: 99,
        animation: "progressBar 3s ease-out forwards"
      }} />
    </div>

    <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
      {[
        { delay: "0s", opacity: 0.5 },
        { delay: "0.2s", opacity: 0.35 },
        { delay: "0.4s", opacity: 0.2 },
      ].map((f, i) => (
        <span key={i} style={{
          fontSize: 18, display: "inline-block", opacity: f.opacity,
          animation: `wave 1.4s ease-in-out infinite ${f.delay}`
        }}>🐟</span>
      ))}
    </div>
  </div>
);

  return (
    <AuthContext.Provider value={{ user, role, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);