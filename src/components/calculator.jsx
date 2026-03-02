"use client";
import React from 'react';

export default function Calculator({ planData, strategyMode, userTier, theme, onExecute, tradeHistory, symbol }) {
  const isPro = userTier === "PRO" || userTier === "ADMIN";
  const isGuest = !userTier || userTier === "GUEST";

  return (
    <div style={{ padding: '20px', backgroundColor: theme.card, borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ marginBottom: '15px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '10px' }}>
        <h3 style={{ color: theme.text, fontSize: '16px', margin: 0, fontWeight: '700' }}>
          📉 {strategyMode === "TIMING" ? "타이밍 분할 플랜" : "적립식 균등 플랜"} 상세
        </h3>
        {/* 🚀 등급별 안내 문구 */}
        {userTier === "FREE" && strategyMode === "TIMING" && (
          <p style={{ fontSize: '11px', color: theme.primary, marginTop: '6px', fontWeight: '500' }}>
            ※ 시장 상황별 정밀 해석은 PRO 등급에서 제공됩니다.
          </p>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ color: theme.subText, borderBottom: `1px solid ${theme.border}`, textAlign: 'left' }}>
              <th style={{ padding: '12px 5px', width: '40px' }}>실행</th>
              <th style={{ padding: '12px 5px', width: '50px' }}>회차</th>
              <th style={{ padding: '12px 5px', color: '#81b0ff' }}>목표가</th>
              <th style={{ padding: '12px 5px', width: '50px' }}>비중</th>
              <th style={{ padding: '12px 5px', textAlign: 'right' }}>매수금액</th>
            </tr>
          </thead>
          <tbody>
            {planData.map((plan) => {
              // 해당 종목 및 회차의 실행 여부 확인
              const isExecuted = tradeHistory?.some(t => t.symbol === symbol && t.round === plan.turn && t.type === 'buy');
              
              return (
                <tr key={plan.turn} style={{ borderBottom: `1px solid ${theme.border}`, opacity: isExecuted ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                  <td style={{ padding: '12px 5px' }}>
                    <input 
                      type="checkbox" 
                      checked={isExecuted || false} 
                      disabled={isGuest || isExecuted}
                      onChange={() => onExecute(plan)}
                      style={{ width: '18px', height: '18px', cursor: isGuest ? 'not-allowed' : 'pointer', accentColor: '#30d158' }}
                    />
                  </td>
                  <td style={{ padding: '12px 5px', color: theme.text }}>{plan.turn}차</td>
                  <td style={{ padding: '12px 5px', color: '#81b0ff', fontWeight: 'bold' }}>
                    ${plan.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </td>
                  <td style={{ padding: '12px 5px', color: theme.text }}>{plan.ratio}%</td>
                  <td style={{ padding: '12px 5px', textAlign: 'right', color: theme.text, fontWeight: 'bold' }}>
                    {plan.amount.toLocaleString()}원
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* 🚀 비회원 안내 */}
      {isGuest && (
        <div style={{ marginTop: '15px', padding: '12px', backgroundColor: theme.bg, borderRadius: '8px', textAlign: 'center', fontSize: '12px', color: theme.subText, border: `1px solid ${theme.border}` }}>
          🔒 로그인 시 매수 기록 저장 및 자동 계산 기능이 활성화됩니다.
        </div>
      )}
      
      <div style={{ textAlign: 'center', fontSize: '11px', color: '#166534', backgroundColor: '#dcfce7', padding: '8px', borderRadius: '8px', marginTop: '15px' }}>
        💡 하락 구간에서 누적 평단을 효율적으로 관리하는 시스템입니다.
      </div>
    </div>
  );
}