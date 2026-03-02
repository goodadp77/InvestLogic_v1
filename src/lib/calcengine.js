// src/lib/calcengine.js

// 🚀 [4구간로직] 시장 및 종목 구간 판정
export const getMarketRegime = (point, low36) => {
  const p = Number(point) || 0;
  const l = Number(low36) || 1;
  const r = (p / l) - 1;
  if (r <= 0.25) return "M1";
  if (r <= 0.60) return "M2";
  if (r <= 1.00) return "M3";
  return "M4";
};

// 🚀 [계산기로직] 고정 템플릿 데이터
const FIXED_TEMPLATES = {
  M1: [40, 60],
  M2: [30, 40, 30],
  M3: [25, 25, 20, 15, 15],
  M4: [4, 4, 4, 8, 8, 8, 12, 12, 20, 20],
  REGULAR: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
};

const FIXED_DROPS = {
  M1: [0, 0.10],
  M2: [0, 0.08, 0.15],
  M3: [0, 0.05, 0.12, 0.20, 0.30],
  M4: [0, 0.05, 0.10, 0.15, 0.20, 0.28, 0.33, 0.38, 0.43, 0.48],
  REGULAR: [0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45]
};

// 🚀 [계산기로직] 메인 엔진 (유저 등급/모드별 분할 배열 생성)
export const generateSplitPlan = (userTier, strategyMode, marketRegime, totalCapital, stockPercent, basePrice) => {
  const isPro = userTier === "PRO" || userTier === "ADMIN";
  const budget = (Number(totalCapital) * (Number(stockPercent) || 0)) / 100;
  const startPrice = Number(basePrice) || 0;
  
  // PRO이며 타이밍 모드일 때만 시장구간 연동, 그 외엔 적립식 10회
  let key = (isPro && strategyMode === "TIMING") ? marketRegime : "REGULAR";
  const ratios = FIXED_TEMPLATES[key] || FIXED_TEMPLATES.REGULAR;
  const drops = FIXED_DROPS[key] || FIXED_DROPS.REGULAR;

  return ratios.map((ratio, i) => ({
    turn: i + 1,
    ratio,
    targetPrice: startPrice * (1 - (drops[i] || 0)),
    amount: Math.floor(budget * (ratio / 100))
  }));
};