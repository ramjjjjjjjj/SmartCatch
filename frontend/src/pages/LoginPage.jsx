import { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithGoogle, auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { FishIcon, FishFloatingIcon } from '../components/DuotoneIcons.jsx';
import CaspiNetLogo from '../components/CaspiNetLogo.jsx';

const INPUT_STYLE = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, fontSize: 14, color: '#fff',
  outline: 'none', transition: 'border-color 0.2s',
  boxSizing: 'border-box',
};

const floatingFish = [
  { iconSize: 22, x: '10%', y: '15%', delay: 0, duration: 6 },
  { iconSize: 18, x: '75%', y: '20%', delay: 1.2, duration: 7 },
  { iconSize: 26, x: '85%', y: '70%', delay: 0.6, duration: 5.5 },
  { iconSize: 20, x: '20%', y: '80%', delay: 2, duration: 6.5 },
  { iconSize: 16, x: '50%', y: '10%', delay: 0.3, duration: 8 },
];

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (err) {
      setError('Ошибка входа: ' + err.message);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Заполните email и пароль');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if (err.code === 'auth/user-not-found') setError('Пользователь не найден');
      else if (err.code === 'auth/wrong-password') setError('Неверный пароль');
      else if (err.code === 'auth/invalid-credential') setError('Неверный email или пароль');
      else setError('Ошибка входа: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName) {
      setError('Введите имя и фамилию');
      return;
    }
    if (!email) {
      setError('Введите email');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: `${firstName} ${lastName}` });
      await setDoc(doc(db, "users", cred.user.uid), {
        firstName,
        lastName,
        contactNumber: contactNumber || '',
        email,
        name: `${firstName} ${lastName}`,
        createdAt: new Date(),
        role: '',
      });
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Этот email уже зарегистрирован');
      else setError('Ошибка регистрации: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputProps = (val, setter, placeholder, type = 'text') => ({
    type,
    value: val,
    onChange: (e) => { setter(e.target.value); setError(''); },
    placeholder,
    style: INPUT_STYLE,
    onFocus: (e) => e.target.style.borderColor = '#00D4AA',
    onBlur: (e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)',
  });

  const isLogin = mode === 'login';

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: '#050D1A', fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        position: 'absolute', top: -120, left: -120, width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(0,212,170,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute', bottom: -80, right: -80, width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(0,120,255,0.1) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(0,212,170,0.04) 0%, transparent 60%)',
        pointerEvents: 'none', borderRadius: '50%',
      }} />

      {floatingFish.map((f, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute', left: f.x, top: f.y,
            opacity: 0.2, pointerEvents: 'none',
          }}
          animate={{
            y: [0, -20, 0, 15, 0],
            x: [0, 10, -5, 8, 0],
            rotate: [0, -5, 3, -2, 0],
          }}
          transition={{
            repeat: Infinity, duration: f.duration, delay: f.delay,
            ease: 'easeInOut',
          }}
        >
          <FishFloatingIcon size={f.iconSize} />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(0,212,170,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(0,212,170,0.15)',
        }}>
          <CaspiNetLogo size={32} />
        </div>
        <div>
          <div style={{ color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>
            CaspiNet
          </div>
          <div style={{ color: '#00D4AA', fontSize: 12, opacity: 0.7 }}>
            Мангистау · Digital Fleet
          </div>
        </div>
      </motion.div>

      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '90%', maxWidth: 360,
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0,212,170,0.15)',
          borderRadius: 24, padding: '28px 24px',
          boxShadow: '0 8px 60px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
            {isLogin ? 'Добро пожаловать' : 'Создать аккаунт'}
          </div>
          <div style={{ fontSize: 18, color: '#fff', fontWeight: 600 }}>
            {isLogin ? 'Войдите в аккаунт' : 'Регистрация'}
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '10px 14px', marginBottom: 16,
              background: 'rgba(255,80,80,0.1)',
              border: '1px solid rgba(255,80,80,0.2)',
              borderRadius: 12, fontSize: 12, color: '#FF5050',
              textAlign: 'center',
            }}
          >{error}</motion.div>
        )}

        <form onSubmit={isLogin ? handleEmailLogin : handleRegister}>
          {!isLogin && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 5 }}>Имя *</label>
                  <input {...inputProps(firstName, setFirstName, 'Ваше имя')} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 5 }}>Фамилия *</label>
                  <input {...inputProps(lastName, setLastName, 'Ваша фамилия')} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 5 }}>Номер телефона</label>
                <input {...inputProps(contactNumber, setContactNumber, '+7 777 123 45 67')} />
              </div>
            </motion.div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 5 }}>Email *</label>
            <input {...inputProps(email, setEmail, 'your@email.com', 'email')} />
          </div>

          <div style={{ marginBottom: isLogin ? 20 : 12 }}>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 5 }}>Пароль *</label>
            <input {...inputProps(password, setPassword, isLogin ? 'Введите пароль' : 'Минимум 6 символов', 'password')} />
          </div>

          {!isLogin && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 5 }}>Подтвердите пароль *</label>
              <input {...inputProps(confirmPassword, setConfirmPassword, 'Повторите пароль', 'password')} />
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.96 }}
            style={{
              width: '100%', padding: '13px',
              background: loading ? 'linear-gradient(135deg, #00D4AA66, #0078FF66)' : 'linear-gradient(135deg, #00D4AA, #0078FF)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(0,212,170,0.2)',
            }}
          >
            {loading ? 'Подождите...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
          </motion.button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>или</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleLogin}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', padding: '12px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#fff',
            marginBottom: 16,
          }}
        >
          <img src="https://www.google.com/favicon.ico" width={18} height={18} alt="G" style={{ borderRadius: '50%' }} />
          {isLogin ? 'Войти через Google' : 'Регистрация через Google'}
        </motion.button>

        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => { setMode(isLogin ? 'register' : 'login'); setError(''); }}
            style={{
              background: 'none', border: 'none',
              color: '#00D4AA', fontSize: 13, cursor: 'pointer',
              textDecoration: 'underline', textUnderlineOffset: 3,
              opacity: 0.8,
            }}
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{
          position: 'absolute', bottom: 24,
          fontSize: 11, color: 'rgba(255,255,255,0.15)',
          textAlign: 'center',
        }}
      >
        CaspiNet v2.0 · Цифровой учёт улова
      </motion.div>
    </div>
  );
}