import { signInWithGoogle } from "../firebase";

export default function LoginPage() {
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      alert("Ошибка входа: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100vh", background: "#f0f4f0", fontFamily: "system-ui" }}>
      
      <div style={{ background: "white", borderRadius: 16, padding: 40, textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)", maxWidth: 340, width: "90%" }}>
        
        <div style={{ fontSize: 56, marginBottom: 12 }}>🐟</div>
        <h1 style={{ color: "#0F6E56", fontSize: 24, margin: "0 0 8px" }}>Smart Catch</h1>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 32 }}>
          Цифровой улов · Мангистау
        </p>

        <button onClick={handleLogin} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          width: "100%", padding: "12px 24px", borderRadius: 10, border: "1px solid #ddd",
          background: "white", cursor: "pointer", fontSize: 15, fontWeight: 500,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
        }}>
          <img src="https://www.google.com/favicon.ico" width={20} height={20} alt="Google" />
          Войти через Google
        </button>
      </div>
    </div>
  );
}