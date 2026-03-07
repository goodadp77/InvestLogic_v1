// [InvestLogic Final Engine Spec - 1단계: 엔진 코어]

// 1. 시장 구간 판정 (R 수식)
// R = (현재가 / 36개월 저점) - 1
export const getMarketRegime = (low36, currentMarketPrice, manualRegime = null) => {
  if (manualRegime && manualRegime !== "") return Number(manualRegime); // 수동 우선 원칙
  
  const R = (Number(currentMarketPrice) / Number(low36)) - 1;
  if (R < 0.25) return 1;
  if (R < 0.60) return 2;
  if (R < 1.00) return 3;
  return 4;
};

// 2. 종목 존 판정 (P 수식)
// P = (현재가 - 저점) / (고점 - 저점)
export const getStockZone = (current, low, high) => {
  const pVal = (Number(current) - Number(low)) / (Number(high) - Number(low));
  if (pVal <= 0.25) return "Z1";
  if (pVal <= 0.60) return "Z2";
  if (pVal <= 0.85) return "Z3";
  return "Z4";
};

// 3. PRO 회원용 구간별 분할 템플릿 정의
export const PRO_TEMPLATES = {
  1: [40, 60],
  2: [30, 40, 30],
  3: [25, 25, 20, 15, 15],
  4: [4, 4, 4, 8, 8, 8, 12, 12, 20, 20]
};

// 4. 하락률 템플릿 (10회차 기준 기본값 - 메인 연동용)
export const DEFAULT_DROPS = [0, 0.05, 0.10, 0.15, 0.20, 0.28, 0.33, 0.38, 0.43, 0.48];

// 5. 회원 등급별 비중 및 매수금액 계산 엔진
export const calculateSplitPlan = (userTier, marketRegime, totalBudget) => {
  let ratios = [];

  // 회원 등급별 분기 로직
  if (userTier === "PRO" || userTier === "ADMIN") {
    // PRO회원: 시장 구간 기준 템플릿 자동 적용
    ratios = PRO_TEMPLATES[marketRegime] || PRO_TEMPLATES[4]; 
  } else {
    // 비회원 및 일반회원: 10회 균등 (각 10%)
    ratios = Array(10).fill(10);
  }

  // 비중 합계 100% 검증 로직 필수
  const sumCheck = ratios.reduce((a, b) => a + b, 0);
  if (Math.round(sumCheck) !== 100) {
    console.error("Engine Error: Template sum is not 100%");
    return [];
  }

  return ratios.map((ratio, index) => ({
    turn: index + 1,
    round: index + 1, // DB 저장용 키 일치 (turn = round)
    ratio: ratio,
    amount: Math.floor(totalBudget * (ratio / 100)) // 각 회차 투자금 계산
  }));
};