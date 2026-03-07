"use client";
import { useState, useEffect, useRef } from "react";
import { auth, db, socialLogin, getRedirectResult } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc, orderBy, getDoc, setDoc } from "firebase/firestore";

// 🚀 분리된 독립 컴포넌트 및 스타일 임포트 (성공하셨던 경로 적용)
import InAppHandler from "../components/inapphandler"; 
import FlowChart from "../components/flowchart";
import { homeCss, getStyles } from "../components/homestyles";

// 🚀 [주입 1] 최신 계산 엔진 및 상수 임포트
import { calculateSplitPlan, DEFAULT_DROPS } from "../lib/calcengine";

// --- [컴포넌트 1: 시장 상황 게이지] ---
const MarketGauge = ({ status, upRate, theme, userTier }) => {
  const safeUpRate = isNaN(upRate) || upRate === null ? 50 : upRate;
  const clampedRate = Math.min(Math.max(Math.round(safeUpRate), 0), 100);
  const angle = (clampedRate / 100 * 180) - 90;
  const isProUser = userTier === "PRO" || userTier === "ADMIN";

  const getTodayDate = () => {
    const now = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const day = days[now.getDay()];
    return `${yyyy}.${mm}.${dd} (${day})`;
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
            <stop offset="0%" stopColor="#ff3b30" />
            <stop offset="30%" stopColor="#ff9500" />
            <stop offset="70%" stopColor="#ffcc00" />
            <stop offset="100%" stopColor="#34c759" />
          </linearGradient>
        </defs>
        <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="url(#gaugeGradient)" strokeWidth="18" strokeLinecap="butt" />
        {[-45, 0, 45].map((sepAngle) => (
          <line key={sepAngle} x1="120" y1="10" x2="120" y2="30" stroke={theme.bg} strokeWidth="3" transform={`rotate(${sepAngle} 120 120)`} />
        ))}
        {/* 🥊 지침 2: 공포/탐욕 텍스트 위치 및 스타일 수정 */}
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

// --- [컴포넌트 2: 상단 네비게이션 & 햄버거 메뉴] ---
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
                <div onClick={() => window.location.href='/stocklab'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.text }}>🔍 종목탐구 LAB</div>
                <div onClick={() => window.location.href='/pro-guide'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.text }}>💎 PRO 등급 안내</div>
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

// --- [컴포넌트 3: PRO 멤버십 배너] ---
const ProMembershipBanner = ({ userTier, theme }) => {
  const isPaidUser = userTier === "PRO" || userTier === "ADMIN";

  return (
    <div style={{ width: '100%', backgroundColor: theme.bg, padding: '10px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {isPaidUser ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 11, color: '#34c759', fontWeight: 'bold' }}>
            PRO 활성화됨
          </div>
        ) : (
          <div style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: theme.text }}>PRO 멤버십</div>
              <div style={{ fontSize: 12, color: theme.subText }}>하락 구간 방어 + 비중 최적화 전략 리포트 제공</div>
            </div>
            <button 
              onClick={() => window.location.href = '/pro-guide'}
              style={{ padding: '8px 16px', backgroundColor: '#0a84ff', color: 'white', border: 'none', borderRadius: '6px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}
            >
              PRO 등급 안내 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userTier, setUserTier] = useState("FREE");
  const theme = { bg: "#F2F2F7", card: "#FFFFFF", text: "#000000", subText: "#6e6e73", border: "#d1d1d6", inputBg: "#F2F2F7", primary: "#0a84ff" };

  // 🚀 지침 3: 최신 어드민 시장 설정 상태 연동 (onSnapshot 실시간 반영 유지)
  const [marketInfo, setMarketInfo] = useState({ finalRegime: 4, direction: "down", low36: 1, currentPrice: 1 });
  const [marketStatus, setMarketStatus] = useState("중립");
  const [upRate, setUpRate] = useState(50);
  const [interpretation, setInterpretation] = useState(null);

  // 🥊 PATCH #1 (비회원 검정 배경 방지 유지)
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.style.backgroundColor = theme.bg;
      document.body.style.margin = "0";
    }
  }, [theme.bg]);

  const [totalCapital, setTotalCapital] = useState(100000000);
  const [stocks, setStocks] = useState([]); 
  const [stockMaster, setStockMaster] = useState({}); 
  const [stockSettings, setStockSettings] = useState({});
  const [symbol, setSymbol] = useState("");
  
  const [tradeHistory, setTradeHistory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");

  const tabRefs = useRef({});
  const saveTimerRef = useRef(null); 

  // 🥊 1. 사용자별 종목 설정값 실시간 리스너 (불러오기)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "stockSettings"));
    const unsubscribeSettings = onSnapshot(q, (snapshot) => {
      const settingsMap = {};
      snapshot.docs.forEach(doc => { settingsMap[doc.id] = doc.data(); });
      setStockSettings(prev => ({ ...prev, ...settingsMap }));
    });
    return () => unsubscribeSettings();
  }, [user]);

  // 🥊 2. 설정값 변경 시 DB 자동 저장 (Debounce 적용)
  const updateStockSetting = (key, value) => {
    setStockSettings(prev => {
      const currentVal = prev[symbol] || { percent: "100", currentPrice: "" };
      const updated = { ...prev, [symbol]: { ...currentVal, [key]: value } };
      
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        if (user && symbol) {
          await setDoc(doc(db, "users", user.uid, "stockSettings", symbol), updated[symbol], { merge: true });
        }
      }, 500);
      
      return updated;
    });
  };

  // 🥊 3. 지침 3: 안전한 종목 로드 로직 (index=0 노출 보장 유지)
  useEffect(() => {
    const stocksRef = collection(db, "stocks");
    
    const unsubscribeStocks = onSnapshot(stocksRef, (snapshot) => {
      const stockDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      stockDocs.sort((a, b) => {
        const indexA = a.index !== undefined && a.index !== null ? Number(a.index) : 9999;
        const indexB = b.index !== undefined && b.index !== null ? Number(b.index) : 9999;
        if (indexA !== indexB) return indexA - indexB;
        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      });

      const stockList = [];
      const masterMap = {};
      stockDocs.forEach(item => {
        const s = String(item.symbol || item.id).toUpperCase();
        stockList.push(s);
        masterMap[s] = item;
      });

      if (stockList.length > 0) {
        setStocks(stockList);
        setStockMaster(masterMap);
        const lastSymbol = localStorage.getItem("lastSelectedSymbol");
        setSymbol(prev => (stockList.includes(lastSymbol) ? lastSymbol : (stockList.includes(prev) ? prev : stockList[0])));
      }
    });
    return () => unsubscribeStocks();
  }, []);

  // 🥊 UX 지침 3: 종목 선택 시 자동 스크롤 및 로컬 저장
  const handleSymbolChange = (newSymbol) => {
    setSymbol(newSymbol);
    localStorage.setItem("lastSelectedSymbol", newSymbol); 
    if (tabRefs.current[newSymbol]) {
      tabRefs.current[newSymbol].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest"
      });
    }
  };

  // 🚀 지침 3: 시장 지표 실시간 리스너 (onSnapshot 유지)
  useEffect(() => {
    const docRef = doc(db, "settings", "market");
    const unsubscribeMarket = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMarketInfo(data);
        const { currentPrice, low36 } = data;
        if (currentPrice && low36) {
          const calculatedRate = ((currentPrice / low36) - 1) * 100;
          const clamped = Math.min(Math.max(Math.round(calculatedRate), 0), 100);
          setUpRate(clamped);
          setMarketStatus(clamped < 25 ? "극공포" : clamped < 50 ? "공포" : clamped < 75 ? "중립" : "탐욕");
        }
      }
    });
    return () => unsubscribeMarket();
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const timeoutId = setTimeout(() => { setLoading(false); }, 3500);

      try {
        const result = await getRedirectResult(auth);
        if (result?.user) { setUser(result.user); }
        onSnapshot(doc(db, "marketInterpretation", "current"), (snapshot) => {
          if (snapshot.exists()) setInterpretation(snapshot.data());
        });
      } catch (error) {
        console.error("인증 처리 중 오류:", error.message);
      } finally {
        clearTimeout(timeoutId);
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
          setUser(currentUser);
          if (currentUser) {
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              setUserTier(userSnap.data().tier || "FREE");
              if (userSnap.data().totalCapital) setTotalCapital(Number(userSnap.data().totalCapital));
            }
            const q = query(collection(db, "trades"), where("uid", "==", currentUser.uid), orderBy("date", "desc"));
            onSnapshot(q, (snapshot) => {
              setTradeHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
          } else {
            setUserTier("FREE");
            setTradeHistory([]);
          }
          setLoading(false);
        });
        return unsubscribeAuth;
      }
    };

    initAuth();
  }, []);

  const handleCapitalChange = (val) => {
    const num = Number(val.replace(/,/g, ""));
    setTotalCapital(num);
    if (user) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        await updateDoc(doc(db, "users", user.uid), { totalCapital: num });
      }, 500);
    }
  };

  // 🚀 지침 3: PRO 시장해석 (undefined 방지 가드 로직 유지)
  const getProInterpretation = () => {
    if (!interpretation || !marketStatus || !interpretation.comments) return "";
    const mKeyMap = { "극공포": "M1", "공포": "M2", "중립": "M3", "탐욕": "M4" };
    const mKey = mKeyMap[marketStatus];
    const proInfo = interpretation.comments[mKey]?.[marketInfo.direction || "down"];
    return proInfo?.A || "";
  };

  const handleLogin = async () => { await socialLogin(); };
  const handleLogout = () => { signOut(auth); };

  // 🚀 지침 4: 계산기 엔진 연동 여부 확인 (3개 필수 코드 유지)
  const getPlanData = () => {
    const userPrice = Number(stockSettings[symbol]?.currentPrice);
    const masterPrice = Number(stockMaster[symbol]?.currentPrice);
    const basePrice = userPrice > 0 ? userPrice : (masterPrice > 0 ? masterPrice : 0);

    if (basePrice <= 0) return []; 

    const percentVal = Number(stockSettings[symbol]?.percent || 100);
    const allocatedBudget = (totalCapital * percentVal) / 100;

    const template = calculateSplitPlan(userTier, marketInfo.finalRegime, allocatedBudget);

    let accumAmount = 0;
    let accumQty = 0;

    return template.map((item, index) => {
      const dropRate = DEFAULT_DROPS[index] || 0;
      const targetPrice = basePrice * (1 - dropRate);
      const qty = targetPrice > 0 ? item.amount / targetPrice : 0;
      const isExecuted = tradeHistory.some(t => t.symbol === symbol && t.round === item.turn && t.type === 'buy');
      
      const prevAvgPrice = accumQty > 0 ? accumAmount / accumQty : basePrice;
      
      accumAmount += item.amount;
      accumQty += qty;
      
      const avgPrice = accumQty > 0 ? accumAmount / accumQty : 0;
      const improvement = (index > 0 && prevAvgPrice > 0 && avgPrice > 0) 
        ? ((prevAvgPrice - avgPrice) / prevAvgPrice * 100).toFixed(1) 
        : 0;

      return { 
        ...item,
        dropRate, 
        targetPrice, 
        expectedQty: qty, 
        expectedAvg: avgPrice, 
        improvement, 
        isExecuted 
      };
    });
  };

  const buyPlan = getPlanData();
  const mySetting = stockSettings[symbol] || { percent: "100", currentPrice: "" };
  const allocatedBudget = (totalCapital * Number(mySetting.percent || 100)) / 100;
  
  const myTrades = tradeHistory.filter(t => t.symbol === symbol && t.type === 'buy');
  const realTotalInvested = myTrades.reduce((acc, cur) => acc + cur.amount, 0);
  const realTotalQty = myTrades.reduce((acc, cur) => acc + (cur.qty || 0), 0);
  const realAvgPrice = realTotalQty > 0 ? realTotalInvested / realTotalQty : 0;
  const currentRound = myTrades.length > 0 ? Math.max(...myTrades.map(t => t.round)) : 0;
  
  const nextPlan = buyPlan.find(p => p.turn === currentRound + 1);
  const nextTargetPrice = nextPlan ? nextPlan.targetPrice : null;

  const toggleExecution = async (p) => {
    if (!user) return alert("로그인 필요");
    if (p.isExecuted) return;
    if (confirm(`${symbol} ${p.turn}회차 기록하시겠습니까?`)) {
      try { 
        await addDoc(collection(db, "trades"), { 
          uid: user.uid, 
          symbol: symbol, 
          type: "buy", 
          // 🚀 지침 3: trades 저장 시 round 가드 로직 유지
          round: p.round ?? p.turn, 
          amount: Math.floor(p.amount), 
          price: Number(p.targetPrice.toFixed(2)), 
          qty: Number((p.amount / p.targetPrice).toFixed(4)), 
          date: new Date().toISOString(), 
          memo: "자동등록됨" 
        }); 
      } catch (e) { alert("저장 실패"); }
    }
  };

  const deleteTrade = async (id) => { if(confirm("삭제?")) await deleteDoc(doc(db, "trades", id)); };
  const saveEdit = async (trade) => {
    if (!editPrice || isNaN(editPrice)) return alert("가격 확인 필요");
    const priceNum = Number(editPrice);
    await updateDoc(doc(db, "trades", trade.id), { price: priceNum, qty: priceNum > 0 ? trade.amount / priceNum : 0 });
    setEditingId(null);
  };

  const styles = getStyles(theme);
  const isProUser = userTier === "PRO" || userTier === "ADMIN";
  if (loading) return <div style={styles.loading}>⏳ 데이터 동기화 중...</div>;

  const proText = getProInterpretation();

  return (
    <>
      <style>{homeCss}</style>
      <InAppHandler />
      <TopNav user={user} userTier={userTier} handleLogin={handleLogin} handleLogout={handleLogout} theme={theme} />
      <ProMembershipBanner userTier={userTier} theme={theme} />
      <div className="responsive-layout" style={{ fontFamily: '-apple-system, sans-serif' }}>
        <div className="grid-controls">
          <div style={styles.gaugeSection}>
            <MarketGauge status={marketStatus} upRate={upRate} theme={theme} userTier={userTier} />
            <div style={{ textAlign: 'center', padding: '0 15px 20px 15px', marginTop: '-10px' }}>
              {isProUser ? (
                <div style={{ fontSize: '13px', color: theme.subText, fontWeight: '500', lineHeight: '1.5' }}>
                  <span style={{ color: marketInfo.direction === "up" ? "#34c759" : "#ff3b30", fontWeight: 'bold' }}>
                    {marketInfo.direction === "up" ? "▲ 상승 국면" : "▼ 하락 국면"}
                  </span>
                  <span style={{ margin: '0 6px', color: theme.border }}>|</span>
                  {proText}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '400' }}>
                  시장 상황별 정밀 해석은 PRO 등급에서 제공됩니다.
                </div>
              )}
            </div>
          </div>
          <div style={styles.capitalBox}>
            <label style={{color: theme.subText, fontSize:12}}>나의 총 투자 원금 (Total Capital)</label>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <span style={{fontSize:20, fontWeight:'bold', color: theme.text}}>₩</span>
              <input type="text" value={totalCapital.toLocaleString()} onChange={(e) => handleCapitalChange(e.target.value)} style={styles.capitalInput} />
            </div>
          </div>
          <div style={styles.section}>
            <div style={styles.tabContainer}>
              {stocks.map((t) => (
                <button 
                  key={t} 
                  ref={el => tabRefs.current[t] = el} 
                  onClick={() => handleSymbolChange(t)} 
                  style={symbol === t ? styles.activeTab : styles.tab}
                >
                  {t}
                </button>
              ))}
            </div>
            <div style={styles.controlGrid}>
              <div style={styles.controlItem}>
                <label style={{color: theme.text, fontSize: 11}}>이 종목 비중 (%)</label>
                <div style={{display:'flex', alignItems:'center'}}>
                  <input type="text" value={mySetting?.percent || ""} onChange={(e) => updateStockSetting('percent', e.target.value)} style={styles.smallInput} />
                  <span style={{marginLeft:5, color: theme.text}}>%</span>
                </div>
              </div>
              <div style={styles.controlItem}>
                <label style={{color: theme.text, fontSize: 11}}>배정된 투자금</label>
                <div style={{color:'#30d158', fontWeight:'bold', fontSize:18}}>{Math.floor((totalCapital * Number(mySetting.percent || 100)) / 100).toLocaleString()} <span style={{fontSize:12}}>원</span></div>
              </div>
            </div>
            <div style={{...styles.controlItem, marginTop:10}}>
              <label style={{color: theme.text, fontSize: 11}}>현재 기준 가격 (Start Price)</label>
              <input type="text" value={mySetting?.currentPrice || ""} onChange={(e) => updateStockSetting('currentPrice', e.target.value)} style={styles.fullInput} placeholder="미입력 시 어드민 기준가 적용" />
            </div>
          </div>
        </div>
        <div className="grid-main">
          {/* 🥊 PATCH #2 (매수 플랜 표 영역만 안전 가드 적용) */}
          {(stocks.length === 0 || !symbol || !stockMaster[symbol]) ? (
            <div style={{ ...styles.section, textAlign: 'center', padding: '40px', color: theme.subText, minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ⏳ 종목 데이터를 불러오고 있습니다...
            </div>
          ) : (
            <div style={styles.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: theme.bg, padding: '10px 15px', borderRadius: 8, marginBottom: 15, fontSize: 12, border: `1px solid ${theme.border}` }}>
                <div style={{textAlign: 'center'}}><div style={{color: theme.subText, marginBottom: 2}}>진입 회차</div><div style={{fontWeight: 'bold', color: theme.text}}>{!user ? "-" : `${currentRound}차 완료`}</div></div>
                <div style={{textAlign: 'center'}}><div style={{color: theme.subText, marginBottom: 2}}>누적 평단가</div><div style={{fontWeight: 'bold', color: '#30d158'}}>{!user ? "-" : (realAvgPrice > 0 ? `$${realAvgPrice.toLocaleString(undefined, {maximumFractionDigits:2})}` : "-")}</div></div>
                <div style={{textAlign: 'center'}}><div style={{color: theme.subText, marginBottom: 2}}>다음 진입가</div><div style={{fontWeight: 'bold', color: '#ff453a'}}>{!user ? "-" : (nextTargetPrice > 0 ? `$${nextTargetPrice.toLocaleString(undefined, {maximumFractionDigits:1})}` : "대기")}</div></div>
              </div>
              <div style={{...styles.sectionHeader, marginBottom: 10}}><h3 style={{color: theme.text}}>📉 매수 플랜 상세 (시장 {marketInfo.finalRegime}구간 적용)</h3></div>
              <div style={styles.tableScroll}>
                <div style={{ position: 'relative' }}>
                  <div style={{ ...styles.tableHeader, display: 'flex', width: '100%' }}><div style={{width:40}}>실행</div><div style={{width:50}}>회차</div><div style={{width:60}}>하락%</div><div style={{width:80, color:'#81b0ff'}}>목표가</div><div style={{width:50}}>비중</div><div style={{width:100, textAlign:'right'}}>매수금액</div><div style={{flex:1, textAlign:'right', paddingRight: 5, color: theme.subText}}>예상평단</div></div>
                  {buyPlan.length > 0 ? buyPlan.map((p) => {
                    return (
                      <div key={p.turn} style={{ ... (p.isExecuted ? styles.rowExecuted : styles.row), display: 'flex', width: '100%' }}>
                        <div style={{width:40}}><input type="checkbox" checked={p.isExecuted} onChange={() => toggleExecution(p)} disabled={p.isExecuted} style={{cursor: 'pointer', width: '20px', height: '20px', accentColor: '#30d158'}} /></div>
                        <div style={{width:50, color: theme.text}}>{p.turn}차</div>
                        <div style={{width:60, color:'#ff453a'}}>{(p.dropRate * 100).toFixed(0)}%</div>
                        <div style={{width:80, color:'#81b0ff', fontWeight:'bold'}}>${p.targetPrice.toLocaleString(undefined, {maximumFractionDigits:1})}</div>
                        <div style={{width:50, fontSize:12, color: theme.text}}>{p.ratio}%</div>
                        <div style={{width:100, textAlign:'right', fontWeight:'bold', color: theme.text}}>{p.amount.toLocaleString()}</div>
                        <div style={{flex:1, textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', paddingRight: 5}}>
                          <span style={{color: theme.subText, fontSize: 12}}>${p.expectedAvg.toLocaleString(undefined, {maximumFractionDigits:1})}</span>
                          {Number(p.improvement) > 0 && !p.isExecuted && <span style={{color: '#30d158', fontSize: 10, fontWeight: 'bold'}}>↓ {p.improvement}% 개선</span>}
                        </div>
                      </div>
                    )
                  }) : <div style={{padding:40, textAlign:'center', color: theme.subText}}>기준가(Start Price)를 입력해주세요.</div>}
                </div>
              </div>
              <div style={styles.totalBar}><span style={{color: theme.text}}>총 실제 매수 운영금</span><span style={{ fontSize: 18, color: '#30d158', fontWeight: 'bold' }}>{realTotalInvested.toLocaleString()} 원</span></div>
              <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#166534', backgroundColor: '#dcfce7', padding: '10px', borderRadius: 8, marginTop: 30, border: '1px solid #bbf7d0' }}>💡 하락장 누적 평단가를 최대 60%까지 낮추도록 설계된 시스템입니다.</div>
            </div>
          )}
          <div style={styles.section}>
            <div style={styles.sectionHeader}><h3 style={{color: theme.text}}>💰 {symbol} 실제 매수 기록</h3></div>
            {!user && <div className="login-guide-box" style={{ padding: "20px", textAlign: "center", backgroundColor: theme.bg, borderRadius: "12px", border: `1px dashed ${theme.border}`, marginBottom: "15px" }}><div style={{ color: theme.text, fontWeight: "bold", fontSize: "14px" }}>로그인 시 기록/저장 기능이 활성화됩니다.</div></div>}
            {myTrades.map((trade) => (
              <div key={trade.id} style={styles.historyItem}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  {editingId === trade.id ? (
                    <div style={{display:'flex', gap:10, flex:1}}>
                      <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{flex:1, padding:5, borderRadius:4, border:`1px solid ${theme.border}`, backgroundColor:theme.card, color:theme.text}} />
                      <button onClick={() => saveEdit(trade)} style={styles.saveBtn}>저장</button>
                      <button onClick={() => setEditingId(null)} style={styles.delBtn}>취소</button>
                    </div>
                  ) : (
                    <>
                      <div><span style={{fontWeight:'bold', marginRight:10, color: theme.text}}>{trade.round}차</span><span style={{color: theme.subText}}>{trade.amount.toLocaleString()}원 (@ {trade.price})</span></div>
                      <div style={{display:'flex', gap:8}}>
                        <button onClick={() => { setEditingId(trade.id); setEditPrice(trade.price); }} style={styles.editBtn}>수정</button>
                        <button onClick={()=>deleteTrade(trade.id)} style={styles.delBtn}>삭제</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid-chart"><FlowChart theme={theme} /><div style={{ textAlign: 'center', fontSize: 11, color: theme.subText, marginTop: 8 }}>※ 본 차트는 Invesco QQQ ETF의 15분 지연 데이터입니다.</div></div>
      </div>
    </>
  );
}