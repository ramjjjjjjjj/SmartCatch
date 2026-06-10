import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isFishRecognitionAvailable, fileToBase64, compressImage, recognizeFish } from '../services/fishRecognition';

const CARD = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(0,212,170,0.12)',
  borderRadius: 14,
  padding: '14px 16px',
};

export default function FishPhotoCapture({ selectedFish, onPhotoVerified, onVerificationCleared }) {
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const available = isFishRecognitionAvailable();

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setResult(null);

    const previewUrl = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoPreview(previewUrl);

    setAnalyzing(true);
    try {
      const compressed = await compressImage(file, 800, 0.7);
      const { base64, mimeType } = await fileToBase64(compressed);
      const aiResult = await recognizeFish(base64, mimeType, selectedFish.name);
      setResult(aiResult);

      if (aiResult.match) {
        onPhotoVerified({
          photoBase64: base64,
          photoMimeType: mimeType,
          aiVerified: true,
          aiConfidence: aiResult.confidence,
        });
      } else {
        onVerificationCleared();
      }
    } catch (e) {
      setError('Ошибка AI анализа: ' + e.message);
      onVerificationCleared();
    } finally {
      setAnalyzing(false);
    }
  };

  const skipAiAndProceed = async () => {
    setError(null);
    setAnalyzing(true);
    try {
      const compressed = await compressImage(photoFile, 800, 0.7);
      const { base64, mimeType } = await fileToBase64(compressed);
      setResult({
        match: true,
        species: selectedFish.name,
        confidence: 0,
        explanation: 'Подтверждено рыбаком вручную (AI недоступен)',
      });
      onPhotoVerified({
        photoBase64: base64,
        photoMimeType: mimeType,
        aiVerified: false,
        aiConfidence: 0,
      });
    } catch (e) {
      setError('Ошибка: ' + e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    setResult(null);
    setError(null);
    onVerificationCleared();
  };

  if (!available) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>
        📸 Фото улова (AI верификация)
      </label>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      {!photoPreview ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={handleCameraClick}
            style={{
              flex: 1, padding: '12px 8px',
              background: 'rgba(0,212,170,0.08)',
              border: '1px dashed rgba(0,212,170,0.25)',
              borderRadius: 12,
              color: '#00D4AA', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>📷</div>
            <div>Сделать фото</div>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={handleGalleryClick}
            style={{
              flex: 1, padding: '12px 8px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed rgba(255,255,255,0.15)',
              borderRadius: 12,
              color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>🖼️</div>
            <div>Из галереи</div>
          </motion.button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={CARD}>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <img
              src={photoPreview}
              alt="Улов"
              style={{
                width: '100%', height: 160,
                objectFit: 'cover', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleClear}
              style={{
                position: 'absolute', top: 6, right: 6,
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                border: 'none', color: '#fff', fontSize: 14,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </motion.button>
          </div>

          {analyzing && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px',
              background: 'rgba(0,120,255,0.08)',
              borderRadius: 10,
              fontSize: 12, color: '#4DA6FF',
            }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{
                  width: 14, height: 14,
                  border: '2px solid rgba(0,120,255,0.3)',
                  borderTop: '2px solid #4DA6FF',
                  borderRadius: '50%',
                }}
              />
              <span>AI анализирует фото: определение {selectedFish.name}...</span>
            </div>
          )}

          {error && !analyzing && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(255,80,80,0.08)',
              borderRadius: 10,
              fontSize: 12, color: '#FF5050',
            }}>
              <div style={{ marginBottom: 8 }}>⚠️ {error}</div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={skipAiAndProceed}
                style={{
                  width: '100%', padding: '8px',
                  background: 'rgba(255,149,0,0.15)',
                  border: '1px solid rgba(255,149,0,0.25)',
                  borderRadius: 8, color: '#FF9500',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                👤 Подтвердить вручную
              </motion.button>
            </div>
          )}

          {result && !analyzing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                background: result.match ? 'rgba(0,212,170,0.08)' : 'rgba(255,149,0,0.08)',
                border: `1px solid ${result.match ? 'rgba(0,212,170,0.2)' : 'rgba(255,149,0,0.2)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  style={{ fontSize: 18 }}
                >
                  {result.match ? '✅' : '❌'}
                </motion.span>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: result.match ? '#00D4AA' : '#FF9500',
                }}>
                  {result.match
                    ? `${selectedFish.icon} ${selectedFish.name} — подтверждено`
                    : 'Вид не совпадает'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                {result.species && (
                  <span>AI определил: <b style={{ color: 'rgba(255,255,255,0.7)' }}>{result.species}</b></span>
                )}
                {result.confidence > 0 && (
                  <span>
                    {result.species ? ' · ' : ''}
                    Уверенность: {Math.round(result.confidence * 100)}%
                  </span>
                )}
              </div>
              {result.explanation && (
                <div style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.4)',
                  marginTop: 6, fontStyle: 'italic',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingTop: 6,
                }}>
                  {result.explanation}
                </div>
              )}
              {!result.match && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGalleryClick}
                  style={{
                    marginTop: 8, padding: '6px 14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: 'rgba(255,255,255,0.5)',
                    fontSize: 11, cursor: 'pointer',
                  }}
                >
                  🔄 Попробовать другое фото
                </motion.button>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {!photoPreview && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 6, textAlign: 'center' }}>
          Сфотографируйте улов для AI-верификации вида рыбы
        </div>
      )}
    </div>
  );
}
