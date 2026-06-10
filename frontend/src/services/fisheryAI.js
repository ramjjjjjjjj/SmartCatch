/**
 * Fishery AI Service — Smart Catch
 *
 * Uses Google Gemini API when available (VITE_GEMINI_API_KEY),
 * falls back to a local rule-based prediction algorithm.
 *
 * Analyzes catch data, predicts limit exceedance, detects anomalies.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MODEL = 'gemini-2.0-flash';

// ─── Default limits per fish type ─────────────────────────────────
export const DEFAULT_DAILY_LIMITS = {
  'Осётр': { daily: 200, monthly: 5000 },
  'Сазан': { daily: 500, monthly: 12000 },
  'Вобла': { daily: 1000, monthly: 25000 },
};

// ─── Gemini-powered analysis ─────────────────────────────────────
async function analyzeWithGemini(catches, limits) {
  if (!GEMINI_API_KEY) return null;

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const prompt = `
You are a fishery monitoring AI for Smart Catch in the Mangistau region, Kazakhstan, Caspian Sea.

Current catches (last 7 days):
${JSON.stringify(catches.slice(0, 100))}

Current daily/monthly limits:
${JSON.stringify(limits)}

Analyze the fishing activity and return ONLY valid JSON (no markdown, no code fences) with this structure:
{
  "analysis": {
    "atRisk": [
      { "fishType": "string", "dailyUsage": number, "dailyLimit": number, "percentDaily": number, "monthlyUsage": number, "monthlyLimit": number, "percentMonthly": number, "hoursUntilExceeded": number | null, "riskLevel": "low" | "medium" | "high" | "critical" }
    ],
    "anomalies": [
      { "type": "string", "description": "string", "severity": "low" | "medium" | "high" }
    ],
    "recommendation": "string",
    "overallStatus": "safe" | "warning" | "critical"
  }
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
}

// ─── Local prediction engine (fallback) ──────────────────────────
function analyzeLocally(catches, limits) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStr = now.toISOString().slice(0, 7);

  // Aggregate catches by fish type
  const dailyTotals = {};
  const monthlyTotals = {};

  catches.forEach((c) => {
    const fish = c.fish || c.fish_type;
    const weight = parseFloat(c.weight || c.weight_kg || 0);
    const date = c.caught_at || c.createdAt || now.toISOString();
    const day = date.slice(0, 10);
    const month = date.slice(0, 7);

    if (day === todayStr) {
      dailyTotals[fish] = (dailyTotals[fish] || 0) + weight;
    }
    if (month === monthStr) {
      monthlyTotals[fish] = (monthlyTotals[fish] || 0) + weight;
    }
  });

  const atRisk = Object.entries(limits).map(([fishType, lim]) => {
    const dailyUsage = dailyTotals[fishType] || 0;
    const monthlyUsage = monthlyTotals[fishType] || 0;
    const percentDaily = lim.daily > 0 ? Math.round((dailyUsage / lim.daily) * 100) : 0;
    const percentMonthly = lim.monthly > 0 ? Math.round((monthlyUsage / lim.monthly) * 100) : 0;

    // Predict hours until daily limit exceeded
    // Based on hours elapsed today and current catch rate
    const hoursElapsed = now.getHours() + now.getMinutes() / 60;
    const catchRate = hoursElapsed > 0 ? dailyUsage / hoursElapsed : 0;
    const remaining = lim.daily - dailyUsage;
    const hoursUntilExceeded = catchRate > 0 ? Math.round(remaining / catchRate) : null;

    let riskLevel = 'low';
    if (percentDaily >= 100 || percentMonthly >= 100) riskLevel = 'critical';
    else if (percentDaily >= 85 || percentMonthly >= 85) riskLevel = 'high';
    else if (percentDaily >= 60 || percentMonthly >= 60) riskLevel = 'medium';

    return {
      fishType,
      dailyUsage: Math.round(dailyUsage),
      dailyLimit: lim.daily,
      percentDaily,
      monthlyUsage: Math.round(monthlyUsage),
      monthlyLimit: lim.monthly,
      percentMonthly,
      hoursUntilExceeded: hoursUntilExceeded !== null ? Math.max(0, hoursUntilExceeded) : null,
      riskLevel,
    };
  });

  const anomalies = atRisk
    .filter((r) => r.riskLevel === 'high' || r.riskLevel === 'critical')
    .map((r) => ({
      type: 'rapid_catch',
      description: `${r.fishType}: ${r.percentDaily}% дневной квоты использовано${r.riskLevel === 'critical' ? ' — ПРЕВЫШЕНИЕ!' : ''}`,
      severity: r.riskLevel === 'critical' ? 'high' : 'medium',
    }));

  const severityLevels = atRisk.map((r) => r.riskLevel);
  const overallStatus = severityLevels.includes('critical')
    ? 'critical'
    : severityLevels.includes('high')
      ? 'warning'
      : 'safe';

  return {
    analysis: {
      atRisk,
      anomalies,
      recommendation: overallStatus === 'critical'
        ? 'Немедленно принять меры! Превышение квот требует вмешательства.'
        : overallStatus === 'warning'
          ? 'Приближается превышение квот. Рекомендуется усилить контроль.'
          : 'Ситуация стабильная. Квоты не превышены.',
      overallStatus,
    },
  };
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Analyze catches and returns AI-powered analysis.
 * Uses Gemini if API key is available, otherwise falls back to local algorithm.
 */
export async function analyzeCatches(catches, limits = DEFAULT_DAILY_LIMITS) {
  if (!catches || catches.length === 0) {
    return {
      analysis: {
        atRisk: [],
        anomalies: [],
        recommendation: 'Недостаточно данных для анализа.',
        overallStatus: 'safe',
      },
    };
  }

  try {
    if (GEMINI_API_KEY) {
      const result = await analyzeWithGemini(catches, limits);
      if (result) return result;
    }
  } catch (e) {
    console.warn('Gemini analysis failed, falling back to local:', e.message);
  }

  return analyzeLocally(catches, limits);
}

/**
 * Predict how many hours until a specific fish type exceeds its daily limit.
 */
export function predictHoursUntilExceeded(catches, fishType, dailyLimit) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const hoursElapsed = now.getHours() + now.getMinutes() / 60;

  const todayCatches = catches.filter((c) => {
    const d = c.caught_at || c.createdAt || '';
    return d.slice(0, 10) === todayStr && (c.fish || c.fish_type) === fishType;
  });

  const totalKg = todayCatches.reduce((s, c) => s + parseFloat(c.weight || c.weight_kg || 0), 0);
  const catchRate = hoursElapsed > 0 ? totalKg / hoursElapsed : 0;
  const remaining = dailyLimit - totalKg;

  if (catchRate <= 0 || remaining <= 0) return null;
  return Math.round(remaining / catchRate);
}

/**
 * Generate a police alert object for a critical exceedance.
 */
export function generatePoliceAlert(atRiskItem, region = 'Мангистау') {
  return {
    id: `alert-${Date.now()}`,
    type: 'police_dispatch',
    fishType: atRiskItem.fishType,
    region,
    dailyUsage: atRiskItem.dailyUsage,
    dailyLimit: atRiskItem.dailyLimit,
    percent: atRiskItem.percentDaily,
    message: `🚨 ПРЕВЫШЕНИЕ КВОТЫ! ${atRiskItem.fishType}: ${atRiskItem.percentDaily}% дневного лимита (${atRiskItem.dailyUsage}/${atRiskItem.dailyLimit} кг). Требуется вмешательство полиции в регионе ${region}.`,
    severity: 'critical',
    timestamp: new Date().toISOString(),
    policeNotified: false,
    acknowledged: false,
  };
}
