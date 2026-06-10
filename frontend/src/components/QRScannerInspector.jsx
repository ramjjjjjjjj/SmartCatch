import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CatchPassportModal from './CatchPassportModal';

const CARD = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(0,212,170,0.12)',
  borderRadius: 16,
  padding: '16px 18px',
};

/**
 * QRScannerInspector — Camera-based QR code scanner for inspectors.
 * Uses html5-qrcode library to scan QR codes from the camera.
 * Automatically looks up and displays the scanned passport.
 */
export default function QRScannerInspector() {
  const [scanning, setScanning] = useState(false);
  const [scannedId, setScannedId] = useState(null);
  const [showPassport, setShowPassport] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [error, setError] = useState(null);
  const scannerContainerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      // Use a visible element ID for the scanner
      const scannerId = 'qr-inspector-scanner';
      // Ensure element exists
      if (!document.getElementById(scannerId)) {
        // The ref will handle this — element is in the JSX below
      }

      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanResult(decodedText);
        },
        () => {
          // On decode failure — keep scanning
        }
      );
    } catch (e) {
      setError('Не удалось запустить камеру: ' + e.message);
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {}
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  const handleScanResult = (decodedText) => {
    // Stop scanning
    stopScanning();

    // Extract passport ID from URL
    // Expected format: URL with ?verify=PASSPORT_ID
    let passportId = decodedText;
    try {
      const url = new URL(decodedText);
      const vid = url.searchParams.get('verify');
      if (vid) passportId = vid;
    } catch {
      // Not a URL — use raw text
    }

    setScannedId(passportId);
    setShowPassport(true);

    // Add to scan history
    setScanHistory((prev) => {
      const updated = [
        {
          id: passportId,
          scannedAt: new Date().toISOString(),
        },
        ...prev.filter((h) => h.id !== passportId),
      ].slice(0, 20);
      return updated;
    });
  };

  return (
    <div>
      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              ...CARD, marginBottom: 14,
              border: '1px solid rgba(255,80,80,0.3)',
              background: 'rgba(255,80,80,0.08)',
              color: '#FF5050', fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            {!scanning && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setError(null)}
                style={{
                  marginTop: 10, padding: '6px 14px', fontSize: 11,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                }}
              >
                Закрыть
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanner section */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
        }}>
          📷 Сканер QR-кода
        </div>

        {!scanning ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={startScanning}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #00D4AA, #0078FF)',
                color: '#fff', border: 'none', borderRadius: 14,
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,212,170,0.2)',
              }}
            >
              📷 Сканировать QR-код
            </motion.button>
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.25)',
              marginTop: 12,
            }}>
              Наведите камеру на QR-код паспорта улова
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            {/* Live camera feed — rendered by html5-qrcode */}
            <div
              id="qr-inspector-scanner"
              ref={scannerContainerRef}
              style={{
                width: '100%', height: 240,
                borderRadius: 12, overflow: 'hidden',
                marginBottom: 12,
                border: '2px solid rgba(0,212,170,0.3)',
                position: 'relative',
              }}
            />

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={stopScanning}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,80,80,0.1)',
                border: '1px solid rgba(255,80,80,0.25)',
                borderRadius: 10, color: '#FF5050',
                fontSize: 13, cursor: 'pointer', fontWeight: 500,
              }}
            >
              ✕ Остановить сканирование
            </motion.button>
          </div>
        )}
      </div>

      {/* Scanned passport modal */}
      {showPassport && scannedId && (
        <CatchPassportModal
          passportId={scannedId}
          onClose={() => {
            setShowPassport(false);
            setScannedId(null);
          }}
        />
      )}

      {/* Scan history */}
      {scanHistory.length > 0 && (
        <div style={CARD}>
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>📋 История сканирований</span>
            <span style={{ fontSize: 10 }}>{scanHistory.length}</span>
          </div>

          {scanHistory.slice(0, 10).map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', marginBottom: 6,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
              }}
              onClick={() => {
                setScannedId(item.id);
                setShowPassport(true);
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'rgba(0,212,170,0.08)',
                border: '1px solid rgba(0,212,170,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
              }}>
                📄
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>
                  {item.id}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                  {new Date(item.scannedAt).toLocaleTimeString('ru-RU', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setScannedId(item.id);
                  setShowPassport(true);
                }}
                style={{
                  padding: '6px 12px', fontSize: 10,
                  background: 'rgba(0,212,170,0.1)',
                  border: '1px solid rgba(0,212,170,0.2)',
                  borderRadius: 8, color: '#00D4AA', cursor: 'pointer',
                }}
              >
                Открыть
              </motion.button>
            </motion.div>
          ))}

          {/* Rescan button at bottom of history */}
          {!scanning && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={startScanning}
              style={{
                width: '100%', padding: '10px', marginTop: 8,
                background: 'rgba(0,212,170,0.08)',
                border: '1px dashed rgba(0,212,170,0.2)',
                borderRadius: 10, color: '#00D4AA',
                fontSize: 12, cursor: 'pointer',
              }}
            >
              + Сканировать ещё
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
