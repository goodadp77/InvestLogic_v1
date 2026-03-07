"use client";
import { useState, useEffect, useRef } from "react";
import { auth, db, socialLogin, getRedirectResult } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc, orderBy, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// 🚀 분리된 독립 컴포넌트 및 스타일 임포트
import InAppHandler from "../components/inapphandler"; 
import FlowChart from "../components/flowchart";
import { homeCss, getStyles } from "../components/homestyles";

// 🚀 최신 계산 엔진 및 상수 임포트
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
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} (${days[now.getDay()]})`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      margin: '10px 0',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 15, width: '100%' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: 13, fontWeight: 'bold', color: theme.text }}>오늘 시장 심리</span>
          <span style={{ backgroundColor: theme.bg, padding: '2px 8px', borderRadius: '12px', fontSize: 11, fontWeight: 'bold', color: '#0a84ff', border: `1px solid ${theme.border}`, whiteSpace: 'nowrap' }}>
            심리지수 {clampedRate}
          </span>
          {isProUser && (
            <span style={{ marginLeft: '6px', fontSize: '9px', backgroundColor: theme.bg, color: '#0a84ff', border: `1px solid #0a84ff`, padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>PRO</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: theme.subText, marginTop: 4 }}>{getTodayDate()}</div>
      </div>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
        <svg
          width="240"
          height="130"
          viewBox="0 0 240 130"
          style={{
            maxWidth: "100%",
            height: "auto",
            display: "block"
          }}
        >
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
          <text x="20" y="145" fontSize="12" fill={theme.subText} textAnchor="middle" fontWeight="bold">공포</text>
          <text x="220" y="145" fontSize="12" fill={theme.subText} textAnchor="middle" fontWeight="bold">탐욕</text>
          <g transform={`translate(120, 120) rotate(${angle})`}>
            <path d="M -5 0 L 0 -105 L 5 0 Z" fill={theme.text} />
            <circle cx="0" cy="0" r="8" fill={theme.text} />
          </g>
        </svg>
      </div>
      <div style={{ marginTop: -5, textAlign: 'center', position: 'relative', zIndex: 1, width: '100%' }}>
        <div style={{ fontWeight: 'bold', fontSize: 20, color: theme.text, marginTop: 10, wordBreak: 'keep-all' }}>{status}</div>
      </div>
    </div>
  );
};

// --- [컴포넌트 2: 상단 네비게이션 & 햄버거 메뉴] ---
const TopNav = ({ user, userTier, handleLogin, handleLogout, theme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <div style={{ width: '100%', backgroundColor: theme.card, borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
        <div style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => window.location.href='/'}>🥚 InvestLogic</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user ? <button onClick={handleLogout} style={{ padding:'5px 10px', fontSize:11, backgroundColor: theme.bg, color: theme.text, border:`1px solid ${theme.border}`, borderRadius:4, cursor:'pointer', whiteSpace: 'nowrap' }}>로그아웃</button>
            : <button onClick={handleLogin} style={{ padding:'5px 12px', fontSize:11, backgroundColor:'#4285F4', color:'white', border:'none', borderRadius:4, fontWeight:'bold', cursor:'pointer', whiteSpace: 'nowrap' }}>로그인 (무료)</button>}
          
          <div style={{ position: 'relative' }}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: theme.text, display: 'flex', alignItems: 'center' }}>☰</button>
            {isMenuOpen && (
              <div style={{ position: 'absolute', top: '45px', right: '0', width: '180px', backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div onClick={() => window.location.href='/'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.text, fontWeight: 'bold', fontSize: 13 }}>🏠 홈</div>
                <div onClick={() => window.location.href='/stocklab'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.text, fontSize: 13 }}>🔍 종목탐구 LAB</div>
                <div onClick={() => window.location.href='/pro-guide'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.text, fontSize: 13 }}>💎 PRO 등급 안내</div>
                <div onClick={() => window.location.href='/mypage'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.text, fontSize: 13 }}>⚙️ 마이페이지</div>
                {userTier === "ADMIN" && (
                  <div onClick={() => window.location.href='/admin'} style={{ padding: '12px 15px', cursor: 'pointer', color: theme.subText, fontSize: 11 }}>🔒 어드민 센터</div>
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
    <div style={{ width: '100%', backgroundColor: theme.bg, padding: '10px 15px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {isPaidUser ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 10, color: '#34c759', fontWeight: 'bold' }}>
            PRO 활성화됨
          </div>
        ) : (
          <div style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: theme.text, marginBottom: 2 }}>PRO 멤버십 안내</div>
              <div style={{ fontSize: 11, color: theme.subText, lineHeight: '1.4', wordBreak: 'keep-all' }}>하락구간 방어 시스템 + 상승장 비중 최적화 전략</div>
            </div>
            <button 
              onClick={() => window.location.href = '/pro-guide'}
              style={{ padding: '8px 16px', backgroundColor: '#0a84ff', color: 'white', border: 'none', borderRadius: '6px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              PRO 등급 안내
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

  const tradesUnsubRef = useRef(null);
  const stockSettingsUnsubRef = useRef(null);
  const authUnsubRef = useRef(null);
  const ignorePermRef = useRef(false);

  const safeUnsub = (ref) => {
    try {
      if (ref.current) {
        ref.current();
        ref.current = null;
      }
    } catch (e) {}
  };

  const [marketInfo, setMarketInfo] = useState({ finalRegime: 4, direction: "down", low36: 1, currentPrice: 1 });
  const [marketStatus, setMarketStatus] = useState("중립");
  const [upRate, setUpRate] = useState(50);
  const [interpretation, setInterpretation] = useState(null);
  const [stockTrend, setStockTrend] = useState("down");

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.style.backgroundColor = theme.bg;
      document.body.style.margin = "0";
      document.body.style.overflowX = "hidden";
      document.body.style.width = "100%";
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

  useEffect(() => {
    if (marketInfo.direction === "up" || marketInfo.direction === "down") {
      setStockTrend(marketInfo.direction);
    }
  }, [marketInfo.direction]);

  const getStockZoneLabel = (zone) => {
    if (zone === "Z1") return "매수구간";
    if (zone === "Z2" || zone === "Z3") return "중립구간";
    if (zone === "Z4") return "매도구간";
    return "-";
  };

  const getStockLabelKey = (zone) => {
    if (zone === "Z1") return "buy";
    if (zone === "Z2" || zone === "Z3") return "neutral";
    if (zone === "Z4") return "sell";
    return null;
  };

  const getStockIndicatorMention = () => {
    const stock = stockMaster[symbol];
    if (!stock) return "-";
    const zone = stock.zone;
    const labelKey = getStockLabelKey(zone);
    const mentions = stock.stockIndicatorMentions;
    if (!labelKey || !mentions) return "-";
    const mention = mentions[stockTrend]?.[labelKey];
    return mention || "-";
  };

  const getStockTrendText = () => {
    return stockTrend === "up" ? "상승추세" : "하락추세";
  };

  useEffect(() => {
    if (!user) return;
    safeUnsub(stockSettingsUnsubRef);
    const q = query(collection(db, "users", user.uid, "stockSettings"));
    stockSettingsUnsubRef.current = onSnapshot(q, (snapshot) => {
      const settingsMap = {};
      snapshot.docs.forEach(doc => { settingsMap[doc.id] = doc.data(); });
      setStockSettings(prev => ({ ...prev, ...settingsMap }));
    }, (err) => {
      if (err?.code === "permission-denied" && ignorePermRef.current) return;
      console.error(err);
    });
    return () => safeUnsub(stockSettingsUnsubRef);
  }, [user]);

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

  useEffect(() => {
    const stocksRef = collection(db, "stocks");
    const unsubscribeStocks = onSnapshot(stocksRef, (snapshot) => {
      const stockDocs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(data => data.enabled !== false);

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

  const handleSymbolChange = (newSymbol) => {
    setSymbol(newSymbol);
    localStorage.setItem("lastSelectedSymbol", newSymbol); 
    if (tabRefs.current[newSymbol]) tabRefs.current[newSymbol].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

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
    let mounted = true;
    setLoading(true);

    const unsubInterpretation = onSnapshot(doc(db, "marketInterpretation", "current"), (snapshot) => {
      if (mounted && snapshot.exists()) setInterpretation(snapshot.data());
    });

    const initAuth = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (mounted && result?.user) setUser(result.user);
      } catch (error) {
        console.error("redirect result error:", error);
      }

      authUnsubRef.current = onAuthStateChanged(auth, async (currentUser) => {
        if (!mounted) return;
        setUser(currentUser);

        if (currentUser) {
          try {
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              setUserTier(userData.tier || "FREE");
              if (userData.totalCapital) setTotalCapital(Number(userData.totalCapital));
            } else {
              await setDoc(userRef, {
                uid: currentUser.uid,
                email: currentUser.email || "",
                tier: "FREE",
                totalCapital: 100000000,
                createdAt: serverTimestamp(),
              }, { merge: true });
              setUserTier("FREE");
            }

            safeUnsub(tradesUnsubRef);
            const q = query(collection(db, "trades"), where("uid", "==", currentUser.uid), orderBy("date", "desc"));
            tradesUnsubRef.current = onSnapshot(q, (snapshot) => {
              if (mounted) setTradeHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
          } catch (err) {
            console.error("user init error:", err);
          }
        } else {
          setUserTier("FREE");
          setTradeHistory([]);
        }

        if (mounted) setLoading(false);
      });
    };

    initAuth();

    const backupTimeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 6000);

    return () => {
      mounted = false;
      clearTimeout(backupTimeout);
      unsubInterpretation();
      safeUnsub(tradesUnsubRef);
      safeUnsub(stockSettingsUnsubRef);
      safeUnsub(authUnsubRef);
    };
  }, []);

  const handleCapitalChange = (val) => {
    const num = Number(val.replace(/,/g, ""));
    setTotalCapital(num);
    if (user) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => { await updateDoc(doc(db, "users", user.uid), { totalCapital: num }); }, 500);
    }
  };

  const getProInterpretation = () => {
    if (!interpretation || !marketStatus || !interpretation.comments) return "";
    const mKeyMap = { "극공포": "M1", "공포": "M2", "중립": "M3", "탐욕": "M4" };
    const mKey = mKeyMap[marketStatus];
    const proInfo = interpretation.comments?.[mKey]?.[marketInfo.direction || "down"];
    const active = proInfo?.active;
    if (active === "A" || active === "B") return proInfo?.[active] || "";
    return proInfo?.A || "";
  };

  const handleLogin = async () => { await socialLogin(); };

  const handleLogout = async () => {
    ignorePermRef.current = true;
    safeUnsub(tradesUnsubRef);
    safeUnsub(stockSettingsUnsubRef);
    await signOut(auth);
    setTimeout(() => { ignorePermRef.current = false; }, 1000);
  };

  const getPlanData = () => {
    const stock = stockMaster[symbol];
    const userPrice = Number(stockSettings[symbol]?.currentPrice);
    const masterPrice = Number(stock?.currentPrice);
    const basePrice = userPrice > 0 ? userPrice : (masterPrice > 0 ? masterPrice : 0);
    
    if (basePrice <= 0 || !stock) return []; 

    let marketRegime = 4;
    if (marketInfo.manualRegime) {
      marketRegime = Number(marketInfo.manualRegime);
    } else {
      const R = (Number(marketInfo.currentPrice) / Number(marketInfo.low36)) - 1;
      if (R <= 0.25) marketRegime = 1;
      else if (R <= 0.60) marketRegime = 2;
      else if (R <= 1.00) marketRegime = 3;
      else marketRegime = 4;
    }

    let stockRegime = 4;
    const zoneMap = { "Z1": 1, "Z2": 2, "Z3": 3, "Z4": 4 };
    if (stock.zone && zoneMap[stock.zone]) {
      stockRegime = zoneMap[stock.zone];
    } else {
      const cur = Number(stock.currentPrice);
      const low = Number(stock.low36);
      const high = Number(stock.high36);
      if (high > low) {
        const P = (cur - low) / (high - low);
        if (P <= 0.25) stockRegime = 1;
        else if (P <= 0.60) stockRegime = 2;
        else if (P <= 0.85) stockRegime = 3;
        else stockRegime = 4;
      }
    }

    const finalRegime = Math.max(marketRegime, stockRegime);
    const proTemplates = {
      1: [40, 60],
      2: [30, 40, 30],
      3: [25, 25, 20, 15, 15],
      4: [4, 4, 4, 8, 8, 8, 12, 12, 20, 20]
    };

    let ratios = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
    if (userTier === "PRO" || userTier === "ADMIN") {
      ratios = proTemplates[finalRegime] || ratios;
    }

    const allocatedCapital = (totalCapital * (Number(stockSettings[symbol]?.percent || 100))) / 100;
    
    let accumAmount = 0;
    let accumQty = 0;

    return ratios.map((ratio, index) => {
      const turn = index + 1;
      const amount = Math.floor(allocatedCapital * (ratio / 100));
      const dropRate = DEFAULT_DROPS[index] || 0;
      const targetPrice = basePrice * (1 - dropRate);
      const qty = targetPrice > 0 ? amount / targetPrice : 0;
      const isExecuted = tradeHistory.some(t => t.symbol === symbol && t.round === turn && t.type === 'buy');
      accumAmount += amount;
      accumQty += qty;
      const expectedAvg = accumQty > 0 ? accumAmount / accumQty : 0;
      const prevExpectedAvg = (index > 0) ? ( (accumAmount - amount) / (accumQty - qty) ) : basePrice;
      const improvement = (index > 0 && prevExpectedAvg > 0) 
        ? ((prevExpectedAvg - expectedAvg) / prevExpectedAvg * 100).toFixed(1) 
        : 0;

      return { 
        turn, ratio, amount, dropRate, targetPrice, expectedQty: qty, expectedAvg, improvement, isExecuted, finalRegime
      };
    });
  };

  const buyPlan = getPlanData();
  const currentFinalRegime = buyPlan.length > 0 ? buyPlan[0].finalRegime : marketInfo.finalRegime;
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
          uid: user.uid, symbol: symbol, type: "buy", round: p.turn, amount: Math.floor(p.amount), price: Number(p.targetPrice.toFixed(2)), qty: Number((p.amount / p.targetPrice).toFixed(4)), date: new Date().toISOString(), memo: "자동등록됨" 
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
  if (loading) return <div style={{...styles.loading, width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>⏳ 데이터 동기화 중...</div>;

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{homeCss}</style>
      <InAppHandler />
      <TopNav user={user} userTier={userTier} handleLogin={handleLogin} handleLogout={handleLogout} theme={theme} />
      <ProMembershipBanner userTier={userTier} theme={theme} />
      <div className="responsive-layout" style={{ fontFamily: '-apple-system, sans-serif', padding: '10px', boxSizing: 'border-box', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="grid-controls" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', minWidth: 0 }}>
          <div style={{...styles.gaugeSection, padding: '15px', boxSizing: 'border-box', width: '100%'}}>
            <MarketGauge status={marketStatus} upRate={upRate} theme={theme} userTier={userTier} />
            <div style={{ textAlign: "center", marginTop: "12px", width: '100%' }}>
              {isProUser ? (
                <div style={{ width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: marketInfo.direction === "up" ? "#34c759" : "#ff3b30" }}>
                    {marketInfo.direction === "down" ? "▼ 하락국면" : "▲ 상승국면"}
                  </div>
                  <div style={{ fontSize: "13px", lineHeight: "1.4", color: theme.subText, whiteSpace: "pre-line", wordBreak: 'keep-all', maxWidth: '100%' }}>
                    {getProInterpretation()}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '400' }}>시장 상황별 정밀 해석은 PRO 등급에서 제공됩니다.</div>
              )}
            </div>
          </div>
          <div style={{...styles.capitalBox, padding: '15px', marginTop: '15px', boxSizing: 'border-box', width: '100%'}}>
            <label style={{color: theme.subText, fontSize:11, display: 'block', marginBottom: '8px'}}>나의 총 투자 원금 (Total Capital)</label>
            <div style={{display:'flex', alignItems:'center', gap:10, width: '100%'}}>
              <span style={{fontSize:18, fontWeight:'bold', color: theme.text}}>₩</span>
              <input type="text" value={totalCapital.toLocaleString()} onChange={(e) => handleCapitalChange(e.target.value)} style={{...styles.capitalInput, flex: 1, minWidth: 0, fontSize: '18px'}} />
            </div>
          </div>
          <div style={{...styles.section, padding: '15px', marginTop: '15px', boxSizing: 'border-box', width: '100%'}}>
            {isProUser && (
              <div style={{ marginBottom: "15px", padding: "12px", backgroundColor: theme.bg, borderRadius: "10px", border: `1px solid ${theme.border}`, width: '100%', boxSizing: 'border-box' }}>
                <div style={{ marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: theme.text }}>📊 종목지표</span>
                </div>
                <div style={{ fontSize: "11px", color: theme.text, lineHeight: "1.5", flexWrap: 'wrap', display: 'flex', wordBreak: 'break-all' }}>
                  <span style={{ fontWeight: "bold", color: theme.primary }}>{getStockZoneLabel(stockMaster[symbol]?.zone)}</span>
                  <span style={{ margin: "0 5px", color: theme.border }}>|</span>
                  <span>{getStockTrendText()}</span>
                  <span style={{ margin: "0 5px", color: theme.border }}>|</span>
                  <span style={{ color: theme.subText }}>{getStockIndicatorMention()}</span>
                </div>
              </div>
            )}

            <div style={{...styles.tabContainer, overflowX: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', whiteSpace: 'nowrap', paddingBottom: '8px', marginBottom: '15px', borderBottom: `1px solid ${theme.border}`, width: '100%', minWidth: 0 }}>
              {stocks.map((t) => (
                <button key={t} ref={el => tabRefs.current[t] = el} onClick={() => handleSymbolChange(t)} style={{... (symbol === t ? styles.activeTab : styles.tab), flex: '0 0 auto', margin: '0 8px 0 0', padding: '8px 16px', fontSize: '13px'}}>{t}</button>
              ))}
            </div>
            <div className="mobile-control-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px', width: '100%' }}>
              <div style={{...styles.controlItem, width: '100%'}}>
                <label style={{color: theme.text, fontSize: 10, display: 'block', marginBottom: '4px'}}>이 종목 비중 (%)</label>
                <div style={{display:'flex', alignItems:'center'}}>
                  <input type="text" value={stockSettings[symbol]?.percent || ""} onChange={(e) => updateStockSetting('percent', e.target.value)} style={{...styles.smallInput, width: '60px', textAlign: 'center'}} />
                  <span style={{marginLeft:5, color: theme.text, fontSize: 13}}>%</span>
                </div>
              </div>
              <div style={{...styles.controlItem, width: '100%'}}>
                <label style={{color: theme.text, fontSize: 10, display: 'block', marginBottom: '4px'}}>배정된 투자금</label>
                <div style={{color:'#30d158', fontWeight:'bold', fontSize:16, wordBreak: 'break-all'}}>{Math.floor((totalCapital * Number(stockSettings[symbol]?.percent || 100)) / 100).toLocaleString()} <span style={{fontSize:11}}>원</span></div>
              </div>
            </div>
            <div style={{...styles.controlItem, marginTop:15, width: '100%'}}>
              <label style={{color: theme.text, fontSize: 10, display: 'block', marginBottom: '4px'}}>현재 기준 가격 (Start Price)</label>
              <input type="text" value={stockSettings[symbol]?.currentPrice || ""} onChange={(e) => updateStockSetting('currentPrice', e.target.value)} style={{...styles.fullInput, width: '100%', boxSizing: 'border-box', padding: '10px'}} placeholder={`관리자 기준가: ${stockMaster[symbol]?.currentPrice || 0}`} />
            </div>
          </div>
        </div>
        <div className="grid-main" style={{ width: '100%', boxSizing: 'border-box', marginTop: '15px', minWidth: 0 }}>
          {(stocks.length === 0 || !symbol || !stockMaster[symbol]) ? (
            <div style={{ ...styles.section, textAlign: 'center', padding: '40px', color: theme.subText, minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', width: '100%' }}>⏳ 종목 데이터를 불러오고 있습니다...</div>
          ) : (
            <div style={{...styles.section, padding: '15px', boxSizing: 'border-box', width: '100%'}}>
              <div style={{ display: 'flex', justifyContent: 'space-around', backgroundColor: theme.bg, padding: '12px', borderRadius: 12, marginBottom: 15, fontSize: 11, border: `1px solid ${theme.border}`, flexWrap: 'wrap', gap: '10px' }}>
                <div style={{textAlign: 'center', flex: '1 1 70px'}}><div style={{color: theme.subText, marginBottom: '2px'}}>진입 회차</div><div style={{fontWeight: 'bold', fontSize: '13px'}}>{!user ? "-" : `${currentRound}차`}</div></div>
                <div style={{textAlign: 'center', flex: '1 1 90px'}}><div style={{color: theme.subText, marginBottom: '2px'}}>누적 평단가</div><div style={{fontWeight: 'bold', color: '#30d158', fontSize: '13px'}}>{!user ? "-" : (realAvgPrice > 0 ? `$${realAvgPrice.toLocaleString(undefined, {maximumFractionDigits:1})}` : "-")}</div></div>
                <div style={{textAlign: 'center', flex: '1 1 90px'}}><div style={{color: theme.subText, marginBottom: '2px'}}>다음 진입가</div><div style={{fontWeight: 'bold', color: '#ff453a', fontSize: '13px'}}>{!user ? "-" : (nextTargetPrice > 0 ? `$${nextTargetPrice.toLocaleString(undefined, {maximumFractionDigits:1})}` : "대기")}</div></div>
              </div>
              <div style={{...styles.sectionHeader, marginBottom: 12}}><h3 style={{color: theme.text, fontSize: 15, fontWeight: 'bold'}}>📉 매수 플랜 상세 (최종 {currentFinalRegime}구간 적용)</h3></div>
              <div style={{...styles.tableScroll, overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', borderRadius: '8px'}}>
                <div style={{ minWidth: '450px', paddingBottom: '5px' }}>
                  <div style={{ ...styles.tableHeader, display: 'flex', width: '100%', padding: '10px 0', fontSize: 11, borderBottom: `1px solid ${theme.border}`, fontWeight: '600' }}>
                    <div style={{width:35}}>실행</div><div style={{width:45}}>회차</div><div style={{width:55}}>하락%</div><div style={{width:80}}>목표가</div><div style={{width:45}}>비중</div><div style={{width:90, textAlign:'right'}}>매수금액</div><div style={{flex:1, textAlign:'right', paddingRight: '5px'}}>예상평단</div>
                  </div>
                  {buyPlan.map((p) => (
                    <div key={p.turn} style={{ ... (p.isExecuted ? styles.rowExecuted : styles.row), display: 'flex', width: '100%', padding: '12px 0', fontSize: 12, alignItems: 'center', borderBottom: `1px solid ${theme.bg}` }}>
                      <div style={{width:35}}><input type="checkbox" checked={p.isExecuted} onChange={() => toggleExecution(p)} disabled={p.isExecuted} style={{width: '18px', height: '18px', cursor: 'pointer'}} /></div>
                      <div style={{width:45, fontWeight: '500'}}>{p.turn}차</div>
                      <div style={{width:55, color:'#ff3b30', fontWeight: '600'}}>{(p.dropRate * 100).toFixed(0)}%</div>
                      <div style={{width:80, fontWeight:'bold'}}>${p.targetPrice.toLocaleString(undefined, {maximumFractionDigits:1})}</div>
                      <div style={{width:45}}>{p.ratio}%</div>
                      <div style={{width:90, textAlign:'right', fontWeight:'bold'}}>{p.amount.toLocaleString()}</div>
                      <div style={{flex:1, textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', paddingRight: '5px'}}>
                        <span style={{fontWeight: '500'}}>${p.expectedAvg.toLocaleString(undefined, {maximumFractionDigits:1})}</span>
                        {Number(p.improvement) > 0 && !p.isExecuted && <span style={{color: '#34c759', fontSize: 10, fontWeight: 'bold'}}>↓ {p.improvement}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{...styles.totalBar, padding: '12px 15px', fontSize: 14, marginTop: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box'}}>
                <span style={{fontWeight: '500'}}>총 실제 매수 운영금</span>
                <span style={{ fontSize: 16, color: '#30d158', fontWeight: 'bold' }}>{realTotalInvested.toLocaleString()} 원</span>
              </div>
              
              <div
                style={{
                  textAlign: "left",
                  fontSize: 11,
                  fontWeight: 600,
                  color: theme.text,
                  backgroundColor: theme.bg,
                  padding: "12px 15px",
                  borderRadius: 10,
                  marginTop: 20,
                  border: `1px solid ${theme.border}`,
                  lineHeight: "1.6",
                  wordBreak: 'keep-all',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                💡 하락장에서 누적 평단가를 최대 60% 이상 낮추도록 설계되었으며<br/>
                <span style={{ color: theme.subText, fontWeight: 500 }}>
                  💡 상승장에서는 전략적으로 투자 비중을 확대하도록 설계된 시스템입니다.
                </span>
              </div>
            </div>
          )}
          <div style={{...styles.section, padding: '15px', marginTop: '15px', boxSizing: 'border-box', width: '100%'}}>
            <div style={{...styles.sectionHeader, marginBottom: 12}}><h3 style={{color: theme.text, fontSize: 15, fontWeight: 'bold'}}>💰 {symbol} 실제 매수 기록</h3></div>
            {!user && (
              <div style={{ background: '#0B1220', border: '1px solid #1F2A37', color: '#E5E7EB', borderRadius: '12px', padding: '15px', textAlign: 'center', fontSize: '12px', marginBottom: '10px', boxShadow: "0 8px 24px rgba(0,0,0,0.35)", wordBreak: 'keep-all' }}>
                <span style={{ color: '#9CA3AF' }}>로그인 후 매수 기록 저장 및 투자 추적 기능이 활성화됩니다.</span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myTrades.map((trade) => (
                <div key={trade.id} style={{ display: 'flex', flexDirection: 'column', padding: '12px', backgroundColor: theme.bg, borderRadius: '12px', border: `1px solid ${theme.border}`, boxSizing: 'border-box' }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap: 'wrap', gap: '8px'}}>
                    {editingId === trade.id ? (
                      <div style={{display:'flex', gap:8, flex:1, width: '100%'}}>
                        <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{flex:1, padding:8, borderRadius:6, border:`1px solid ${theme.border}`, fontSize: 13, minWidth: 0}} />
                        <button onClick={() => saveEdit(trade)} style={{...styles.saveBtn, fontSize: 12, padding: '6px 12px'}}>저장</button>
                        <button onClick={() => setEditingId(null)} style={{...styles.delBtn, fontSize: 12, padding: '6px 12px'}}>취소</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 13, flex: 1, minWidth: '150px', wordBreak: 'break-all' }}>
                          <span style={{fontWeight:'bold', marginRight:8, color: theme.primary}}>{trade.round}차</span>
                          <span style={{fontWeight: '500'}}>{trade.amount.toLocaleString()}원 (@ {trade.price})</span>
                        </div>
                        <div style={{display:'flex', gap:8}}>
                          <button onClick={() => { setEditingId(trade.id); setEditPrice(trade.price); }} style={{...styles.editBtn, fontSize: 11, padding: '4px 10px', borderRadius: '6px'}}>수정</button>
                          <button onClick={()=>deleteTrade(trade.id)} style={{...styles.delBtn, fontSize: 11, padding: '4px 10px', borderRadius: '6px'}}>삭제</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid-chart" style={{ width: '100%', boxSizing: 'border-box', marginTop: '15px', padding: '0 5px' }}>
          <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${theme.border}` }}>
            <FlowChart theme={theme} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: theme.subText, marginTop: 10, paddingBottom: '30px' }}>※ 본 차트는 Invesco QQQ ETF의 15분 지연 데이터입니다.</div>
        </div>
      </div>
    </div>
  );
}