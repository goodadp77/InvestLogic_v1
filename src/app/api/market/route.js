import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 🚀 import 방식 차이 및 인스턴스 에러 방지 안전장치
    let yf = yahooFinance.default || yahooFinance;

    // 만약 yf가 함수(Class)라면 새 인스턴스 생성 시도
    if (typeof yf === 'function') {
      try {
        yf = new yf();
      } catch (e) {
        // 이미 인스턴스면 통과
      }
    }

    if (yf.suppressNotices) {
      yf.suppressNotices(['yahooSurvey', 'cookie']);
    }

    // 데이터 가져오기 (NQ=F, NDX, GSPC)
    const results = await Promise.all([
      yf.quote("NQ=F"),
      yf.quote("^NDX"),
      yf.quote("^GSPC"),
    ]);

    const [nq, ndx, sp500] = results;

    const data = {
      main: {
        symbol: "NQ=F",
        price: nq.regularMarketPrice,
        change: nq.regularMarketChange,
        changePercent: nq.regularMarketChangePercent,
        time: nq.regularMarketTime,
      },
      indexes: {
        ndx: { price: ndx.regularMarketPrice, changePercent: ndx.regularMarketChangePercent },
        sp500: { price: sp500.regularMarketPrice, changePercent: sp500.regularMarketChangePercent },
      }
    };

    return NextResponse.json(data);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Market Data Error', details: error.message },
      { status: 500 }
    );
  }
}