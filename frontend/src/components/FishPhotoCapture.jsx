import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
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
  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [photoBase64, setPhotoBase64] = useState('');
  const [photoMimeType, setPhotoMimeType] = useState('image/jpeg');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const available = isFishRecognitionAvailable();

  const handleFile = async (file) => {
    if (!file) return;
    setConfirmed(false);

    const previewUrl = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoPreview(previewUrl);

    setProcessing(true);
    try {
      const compressed = await compressImage(file, 800, 0.7);
      const { base64, mimeType } = await fileToBase64(compressed);
      setPhotoBase64(base64);
      setPhotoMimeType(mimeType);
    } catch (e) {
      console.warn('Photo processing failed:', e);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = async () => {
  setProcessing(true);
  try {
    const result = await recognizeFish(photoBase64, photoMimeType, selectedFish.name);
    setConfirmed(true);
    setAiResult(result); 
    onPhotoVerified({
      photoBase64,
      photoMimeType,
      aiVerified: result.match,
      aiConfidence: result.confidence,
      aiSpecies: result.species,
      aiExplanation: result.explanation,
    });
  } catch (e) {
    setConfirmed(true);
    onPhotoVerified({ photoBase64, photoMimeType, aiVerified: false, aiConfidence: 0 });
  } finally {
    setProcessing(false);
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
    setConfirmed(false);
    setPhotoBase64('');
    onVerificationCleared();
  };

  if (!available) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>
        📸 Фото улова
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

          {processing && (
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
              <span>Обработка фото...</span>
            </div>
          )}

          {!processing && !confirmed && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleConfirm}
              style={{
                width: '100%', padding: '12px',
                background: 'linear-gradient(135deg, #00D4AA, #0078FF)',
                border: 'none', borderRadius: 12,
                color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,212,170,0.2)',
              }}
            >
              ✅ Подтвердить — это {selectedFish.icon} {selectedFish.name}
            </motion.button>
          )}

          {!processing && confirmed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: aiResult?.match ? 'rgba(0,212,170,0.08)' : 'rgba(255,80,80,0.08)',
                border: `1px solid ${aiResult?.match ? 'rgba(0,212,170,0.2)' : 'rgba(255,80,80,0.2)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>{aiResult?.match ? '✅' : '⚠️'}</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: aiResult?.match ? '#00D4AA' : '#FF6B6B' }}>
                  {aiResult?.match
                    ? `${selectedFish.icon} ${selectedFish.name} — ИИ подтвердил`
                    : `⚠️ ИИ определил: ${aiResult?.species || 'неизвестно'}`}
                </div>
              </div>
              {aiResult?.explanation && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                  🤖 {aiResult.explanation}
                </div>
              )}
              {aiResult?.confidence > 0 && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  Уверенность: {Math.round(aiResult.confidence * 100)}%
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {!photoPreview && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 6, textAlign: 'center' }}>
          Сфотографируйте улов для верификации. Фото проверит инспектор.
        </div>
      )}
    </div>
  );
}
