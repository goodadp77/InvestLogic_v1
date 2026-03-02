"use client";
import { useState, useEffect } from "react";
// 🚀 소문자 파일 시스템 기반 임포트
import { getMarketRegime, generateSplitPlan } from "../lib/calcengine";
import Calculator from "../components/calculator";
import InAppHandler from "../components/inapphandler";

import { auth, db, socialLogin, getRedirectResult } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc, orderBy, getDoc, setDoc } from "firebase/firestore";

// --- [컴포넌트 1: 시장 상황 게이지] ---
const MarketGauge = ({ status, upRate, theme, userTier }) => {
  const clampedRate = Math.min(Math.max(Math.round(upRate), 0), 100);
  const angle = (clampedRate / 100 * 180) - 90;
  const isProUser = userTier === "PRO" || userTier === "ADMIN";

  const getTodayDate = () => {
    const now = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} (${days[now.getDay()]})`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 15, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 13, fontWeight: 'bold', color: theme.text }}>오늘 시장 심리</span>
          <span style={{ backgroundColor: theme.bg, padding: '2px 8px', borderRadius: '12px', fontSize: 11, fontWeight: 'bold', color: '#0a84ff', border: `1px solid ${theme.border}` }}>
            심리지수 {clampedRate}
          </span>
          {isProUser && (
            <span style={{ marginLeft: '6px', fontSize: '9px', backgroundColor: theme.bg, color: '#0a84ff', border: `1px solid #0a84ff`, padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>PRO</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: theme.subText, marginTop: 4 }}>{getTodayDate()}</div>
      </div>
      <svg width="240" height="130" viewBox="0 0 240 130">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff3b30" /><stop offset="30%" stopColor="#ff9500" />
            <stop offset="70%" stopColor="#ffcc00" /><stop offset="100%" stopColor="#34c759" />
          </linearGradient>
        </defs>
        <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="url(#gaugeGradient)" strokeWidth="18" strokeLinecap="butt" />
        {[-45, 0, 45].map((sepAngle) => (
          <line key={sepAngle} x1="120" y1="10" x2="120" y2="30" stroke={theme.bg} strokeWidth="3" transform={`rotate(${sepAngle} 120 120)`} />
        ))}
        <text x="20" y="145" fontSize="12" fill={theme.subText} textAnchor="middle" fontWeight="bold">공포</text>
        <text x="220" y="145" fontSize="12" fill={theme.subText} textAnchor="middle" fontWeight="bold">탐욕</text>
        <g transform={`translate(120, 120) rotate(${angle})`}>
          <path d="M -5 0 L 0 -105 L 5 0 Z" fill={theme.text} />
          <circle cx="0" cy="0" r="8" fill={theme.text} />
        </g>
      </svg>
      <div style={{ marginTop: -10, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: 20, color: theme.text, marginTop: 10 }}>{status}</div>
      </div>
    </div>
  );
};

// --- [컴포넌트 2: 상단 네비게이션] ---
const TopNav = ({ user, userTier, handleLogin, handleLogout, theme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <div style={{ width: '100%', backgroundColor: theme.card, borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, cursor: 'pointer' }} onClick={() => window.location.href='/'}>🥚 InvestLogic</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {user ? <button onClick={handleLogout} style={{ padding:'6px 12px', fontSize:12, backgroundColor: theme.bg, color: theme.text, border:`1px solid ${theme.border}`, borderRadius:4, cursor:'pointer' }}>로그아웃</button>
            : <button onClick={handleLogin} style={{ padding:'6px 15px', fontSize:12, backgroundColor:'#4285F4', color:'white', border:'none', borderRadius:4, fontWeight:'bold', cursor:'pointer' }}>로그인 (무료)</button>}
          
          <div style={{ position: 'relative' }}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: theme.text }}>☰</button>
            {isMenuOpen && (
              <div style={{ position: 'absolute', top: '45px', right: '0', width: '200px', backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div onClick={() => window.location.href='/'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.text, fontWeight: 'bold' }}>🏠 홈</div>
                <div onClick={() => window.location.href='/mypage'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.text }}>⚙️ 마이페이지</div>
                {userTier === "ADMIN" && (
                  <div onClick={() => window.location.href='/admin'} style={{ padding: '12px 15px', cursor: 'pointer', color: theme.subText, fontSize: 12 }}>🔒 어드민 센터</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userTier, setUserTier] = useState("FREE");
  const theme = { bg: "#F2F2F7", card: "#FFFFFF", text: "#000000", subText: "#6e6e73", border: "#d1d1d6", primary: "#0a84ff" };

  const [marketStatus, setMarketStatus] = useState("중립");
  const [upRate, setUpRate] = useState(50);
  const [point, setPoint] = useState(0);
  const [low36, setLow36] = useState(1);
  const [strategyMode, setStrategyMode] = useState("TIMING");
  const [totalCapital, setTotalCapital] = useState(100000000);
  const [stockSettings, setStockSettings] = useState({ "SOXL": { percent: "100", currentPrice: "30" } });
  const [symbol, setSymbol] = useState("SOXL");
  const [tradeHistory, setTradeHistory] = useState([]);

  // 🚀 [4구간로직] & [계산기로직] 엔진 조립
  const marketRegime = getMarketRegime(point, low36);
  const splitPlan = generateSplitPlan(
    userTier, 
    strategyMode, 
    marketRegime, 
    totalCapital, 
    stockSettings[symbol]?.percent || 0, 
    stockSettings[symbol]?.currentPrice || 0
  );

  useEffect(() => {
    const initAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (userSnap.exists()) setUserTier(userSnap.data().tier || "FREE");
        
        const q = query(collection(db, "trades"), where("uid", "==", currentUser.uid), orderBy("date", "desc"));
        onSnapshot(q, (snap) => {
          setTradeHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      }
      setLoading(false);
    });
    
    const fetchMarket = async () => {
      const docSnap = await getDoc(doc(db, "settings", "market"));
      if (docSnap.exists()) {
        const { diffPoint, low36 } = docSnap.data();
        setPoint(diffPoint); setLow36(low36);
        const rate = ((diffPoint / low36) - 1) * 100;
        setUpRate(rate);
        if (rate < 25) setMarketStatus("극공포"); else if (rate < 50) setMarketStatus("공포");
        else if (rate < 75) setMarketStatus("중립"); else setMarketStatus("탐욕");
      }
    };
    
    fetchMarket();
    return () => initAuth();
  }, []);

  const toggleExecution = async (plan) => {
    if (!user) return alert("로그인이 필요합니다.");
    if (confirm(`${symbol} ${plan.turn}회차를 기록하시겠습니까?`)) {
      await addDoc(collection(db, "trades"), {
        uid: user.uid, symbol, type: "buy", round: plan.turn, 
        amount: plan.amount, price: plan.targetPrice, date: new Date().toISOString()
      });
    }
  };

  if (loading) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>⏳ 로딩 중...</div>;

  return (
    <>
      <InAppHandler />
      <TopNav user={user} userTier={userTier} handleLogin={socialLogin} handleLogout={() => signOut(auth)} theme={theme} />
      <div className="responsive-layout" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <style>{`@media (min-width: 768px) { .responsive-layout { grid-template-columns: 400px 1fr !important; } }`}</style>
        
        <div className="grid-controls">
          <div style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '15px', border: `1px solid ${theme.border}`, marginBottom: '20px' }}>
            <MarketGauge status={marketStatus} upRate={upRate} theme={theme} userTier={userTier} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button onClick={() => setStrategyMode("TIMING")} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: strategyMode === "TIMING" ? theme.primary : theme.bg, color: strategyMode === "TIMING" ? "#fff" : theme.subText, fontWeight: 'bold', cursor: 'pointer' }}>타이밍 분할</button>
              <button onClick={() => setStrategyMode("REGULAR")} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: strategyMode === "REGULAR" ? theme.primary : theme.bg, color: strategyMode === "REGULAR" ? "#fff" : theme.subText, fontWeight: 'bold', cursor: 'pointer' }}>적립식(10회)</button>
            </div>
          </div>
          
          <div style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '15px', border: `1px solid ${theme.border}` }}>
            <label style={{ fontSize: '12px', color: theme.subText }}>나의 총 투자 원금</label>
            <input 
              type="text" 
              value={totalCapital.toLocaleString()} 
              onChange={(e) => setTotalCapital(Number(e.target.value.replace(/,/g, "")))} 
              style={{ width: '100%', border: 'none', fontSize: '24px', fontWeight: 'bold', outline: 'none', marginTop: '10px' }} 
            />
          </div>
        </div>

        <div className="grid-main">
          {/* 🚀 분리된 계산기 컴포넌트 호출 */}
          <Calculator 
            planData={splitPlan}
            strategyMode={strategyMode}
            userTier={userTier}
            theme={theme}
            tradeHistory={tradeHistory}
            symbol={symbol}
            onExecute={toggleExecution}
          />
        </div>
      </div>
    </>
  );
}