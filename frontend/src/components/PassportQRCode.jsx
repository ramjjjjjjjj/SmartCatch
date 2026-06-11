import { motion } from 'framer-motion';
import { getQRCodeUrl } from '../services/passportService';

/**
 * PassportQRCode — Displays a QR code for a given passport.
 * Uses the free api.qrserver.com service for generation.
 * Includes share/copy functionality.
 */
export default function PassportQRCode({ passportId, size = 200, compact = false }) {
  const qrUrl = getQRCodeUrl(passportId, size);
  const verificationUrl = `${window.location.origin}?verify=${passportId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationUrl).then(() => {
      // Brief feedback
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Паспорт улова ${passportId}`,
        text: `Цифровой паспорт улова CaspiNet: ${passportId}`,
        url: verificationUrl,
      });
    } else {
      handleCopy();
    }
  };

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        style={{ cursor: 'pointer', display: 'inline-flex' }}
        onClick={(e) => {
          e.stopPropagation();
          handleShare();
        }}
      >
        <img
          src={qrUrl}
          alt={`QR ${passportId}`}
          style={{
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: 8,
            border: '1px solid rgba(0,212,170,0.2)',
          }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '16px',
        background: '#fff',
        borderRadius: 16,
      }}
    >
      <img
        src={qrUrl}
        alt={`QR код паспорта ${passportId}`}
        style={{
          width: size,
          height: size,
          borderRadius: 12,
        }}
      />
      <div style={{
        marginTop: 10, fontSize: 10, color: '#666',
        fontFamily: 'monospace', letterSpacing: '0.3px',
        wordBreak: 'break-all', textAlign: 'center',
      }}>
        {passportId}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleCopy}
          style={{
            padding: '7px 14px', fontSize: 11,
            background: '#00D4AA', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          📋 Копировать ссылку
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleShare}
          style={{
            padding: '7px 14px', fontSize: 11,
            background: '#0078FF', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          📤 Поделиться
        </motion.button>
      </div>
    </motion.div>
  );
}
