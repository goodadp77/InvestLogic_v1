"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  doc, getDoc, setDoc, collection, getDocs, updateDoc, 
  query, where, onSnapshot, serverTimestamp, deleteDoc, 
  addDoc, orderBy 
} from "firebase/firestore";
import { 
  Settings, RefreshCw, Save, Users, ArrowLeft, 
  UserCheck, Clock, MessageSquare, Layout, Plus, Trash2, Activity, Hash, Calendar, Edit3, X
} from "lucide-react";
import { getMarketRegime, getStockZone } from "../../lib/calcengine";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [marketData, setMarketData] = useState({ low36: "", currentPrice: "", manualRegime: "", direction: "down" });
  const [interpretation, setInterpretation] = useState(null);
  const [selectedM, setSelectedM] = useState("M1");
  const [strategy, setStrategy] = useState("A"); 
  const [stocks, setStocks] = useState([]);
  const [newStock, setNewStock] = useState({ symbol: "", name: "", currentPrice: "", low36: "", high36: "" });
  const [proRequests, setProRequests] = useState([]);
  const [userList, setUserList] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const theme = !isDarkMode ? {
    bg: "#F2F2F7", card: "#FFFFFF", text: "#1C1C1E", subText: "#636366", border: "#D1D1D6", primary: "#007AFF"
  } : {
    bg: "#121212", card: "#1E1E1E", text: "#FFFFFF", subText: "#A0A0A0", border: "#333333", primary: "#0A84FF"
  };

  // 🚀 [수정 2] 화면 로드/방향/구간 바뀔 때 strategy를 DB의 active와 동기화 (선택 유지)
  useEffect(() => {
    const a = interpretation?.comments?.[selectedM]?.[marketData.direction]?.active;
    if (a === "A" || a === "B") setStrategy(a);
  }, [interpretation, selectedM, marketData.direction]);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(!darkModeMediaQuery.matches); 
    const handler = (e) => setIsDarkMode(!e.matches);
    darkModeMediaQuery.addEventListener('change', handler);

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        const patchAny = {};
        const dataAny = userSnap.exists() ? userSnap.data() : {};
        if (!dataAny?.email && user.email) patchAny.email = user.email;
        if (!dataAny?.createdAt) patchAny.createdAt = serverTimestamp();

        if (Object.keys(patchAny).length > 0) {
          await setDoc(userRef, patchAny, { merge: true });
        }
        
        if (userSnap.exists() && userSnap.data().tier === "ADMIN") {
          setIsAdmin(true);
          onSnapshot(doc(db, "settings", "market"), (d) => d.exists() && setMarketData(prev => ({ ...prev, ...d.data() })));
          onSnapshot(doc(db, "marketInterpretation", "current"), (d) => d.exists() && setInterpretation(d.data()));
          onSnapshot(collection(db, "stocks"), (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            list.sort((a, b) => (Number(a.index) || 999) - (Number(b.index) || 999));
            setStocks(list);
          });
          onSnapshot(query(collection(db, "proRequests"), where("status", "==", "pending"), orderBy("requestedAt", "desc")), (snap) => {
            setProRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          });
          onSnapshot(collection(db, "users"), (snap) => {
            const list = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
            const toMs = (v) => {
              if (!v) return 0;
              if (typeof v === "string") {
                const t = Date.parse(v);
                return Number.isNaN(t) ? 0 : t;
              }
              if (typeof v.toMillis === "function") return v.toMillis(); 
              if (typeof v.seconds === "number") return v.seconds * 1000; 
              return 0;
            };
            list.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
            setUserList(list);
          });
          setLoading(false);
        } else window.location.href = "/";
      } else window.location.href = "/";
    });
    return () => { unsubscribeAuth(); darkModeMediaQuery.removeEventListener('change', handler); };
  }, []);

  const handleAddStock = async () => {
    if (!newStock.symbol) return alert("티커 입력 필수");
    const zone = getStockZone(newStock.currentPrice || 0, newStock.low36 || 0, newStock.high36 || 0);
    await addDoc(collection(db, "stocks"), {
      ...newStock, 
      symbol: newStock.symbol.toUpperCase(), 
      name: newStock.name, 
      zone, 
      enabled: true,
      stockIndicatorMentions: {
        up: { buy: "", neutral: "", sell: "" },
        down: { buy: "", neutral: "", sell: "" }
      },
      currentPrice: Number(newStock.currentPrice) || 0,
      low36: Number(newStock.low36) || 0,
      high36: Number(newStock.high36) || 0,
      index: stocks.length + 1, createdAt: serverTimestamp()
    });
    setNewStock({ symbol: "", name: "", currentPrice: "", low36: "", high36: "" });
  };

  const startEdit = (stock) => {
    setEditingId(stock.id);

    // 🚀 [지침 준수] 평면형 구조를 up/down 계층형 구조로 자동 변환 로직 적용
    let mentions = stock.stockIndicatorMentions;
    if (!mentions || !mentions.up) {
      const flatBuy = stock.stockIndicatorMentions?.buy || "";
      const flatNeutral = stock.stockIndicatorMentions?.neutral || "";
      const flatSell = stock.stockIndicatorMentions?.sell || "";
      
      mentions = {
        up: { buy: flatBuy, neutral: flatNeutral, sell: flatSell },
        down: { buy: flatBuy, neutral: flatNeutral, sell: flatSell }
      };
    }

    setEditValues({
      symbol: stock.symbol ?? "",
      name: stock.name ?? "",
      currentPrice: stock.currentPrice ?? "",
      low36: stock.low36 ?? "",
      high36: stock.high36 ?? "",
      index: stock.index ?? 0,
      enabled: stock.enabled ?? true,
      stockIndicatorMentions: mentions
    });
  };

  const handleUpdateStock = async (id) => {
    const original = stocks.find(s => s.id === id);
    if (!original) return;
    try {
      const currentPrice = editValues.currentPrice === "" ? original.currentPrice : Number(editValues.currentPrice);
      const low36 = editValues.low36 === "" ? original.low36 : Number(editValues.low36);
      const high36 = editValues.high36 === "" ? original.high36 : Number(editValues.high36);
      const index = editValues.index === "" ? original.index : Number(editValues.index);
      const zone = getStockZone(currentPrice, low36, high36);
      await updateDoc(doc(db, "stocks", id), { 
        ...editValues,
        currentPrice, low36, high36, index, zone 
      });
      setEditingId(null);
      alert("수정 완료");
    } catch (e) { alert("저장 실패"); }
  };

  const handleDeleteUser = async (uid) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, "users", uid));
        alert("삭제 완료");
      } catch (e) { alert("삭제 실패"); }
    }
  };

  const fetchSheetData = async () => {
    setIsFetching(true);
    try {
      const res = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vTbJy5cmV-hMbFD5QXpunAM7Al8eo_cg1mEEatBwnRlb9cobBPGtvrDNKczPAAxoyH9G4j4UViUZLhb/pub?output=csv");
      const csv = await res.text();
      const rows = csv.split('\n').map(r => r.split(','));
      const point = parseFloat(rows[1]?.[1]?.replace(/[^0-9.]/g, "") || "0");
      const low = parseFloat(rows[1]?.[3]?.replace(/[^0-9.]/g, "") || "0");
      setMarketData(prev => ({ ...prev, currentPrice: point, low36: low }));
      alert("데이터 로드 완료");
    } catch (e) { alert("로드 실패"); }
    setIsFetching(false);
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg, color: theme.text }}>⏳ 로딩 중...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text, padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>⚙️ 어드민 센터</h1>
          <button onClick={() => window.location.href = '/'} style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', backgroundColor: theme.card, color: theme.text, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '5px' }}><ArrowLeft size={16} /> 나가기</button>
        </div>

        {/* [1] 종목 마스터 관리 */}
        <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '16px', border: `1px solid ${theme.border}`, marginBottom: '20px' }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", fontSize: "16px", fontWeight: "bold" }}><Layout size={20} color={theme.primary} /> 종목 마스터 관리 ({stocks.length})</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div><label style={{ fontSize: '11px', color: theme.subText }}>티커</label><input value={newStock.symbol} onChange={e => setNewStock({...newStock, symbol: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text }} placeholder="예: SOXL" /></div>
            <div><label style={{ fontSize: '11px', color: theme.subText }}>종목명</label><input value={newStock.name} onChange={e => setNewStock({...newStock, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text }} placeholder="예: 필라델피아 반도체" /></div>
            <div><label style={{ fontSize: '11px', color: theme.subText }}>현재가</label><input type="number" value={newStock.currentPrice} onChange={e => setNewStock({...newStock, currentPrice: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text }} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div><label style={{ fontSize: '11px', color: theme.subText }}>36개월 저점</label><input type="number" value={newStock.low36} onChange={e => setNewStock({...newStock, low36: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text }} /></div>
            <div><label style={{ fontSize: '11px', color: theme.subText }}>36개월 고점</label><input type="number" value={newStock.high36} onChange={e => setNewStock({...newStock, high36: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text }} /></div>
          </div>
          
          <button onClick={handleAddStock} style={{ width: '100%', padding: '12px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}><Plus size={18} /> 종목 추가</button>
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {stocks.map(s => (
              <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', backgroundColor: theme.bg, borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                {editingId === s.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 'bold', color: theme.primary, fontSize: '14px' }}>🔥 {editValues.symbol} 수정 중</div>
                      <select 
                        value={editValues.enabled} 
                        onChange={e => setEditValues({...editValues, enabled: e.target.value === "true"})}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: `1px solid ${theme.border}` }}
                      >
                        <option value="true">활성</option>
                        <option value="false">비활성</option>
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                      <input type="text" value={editValues.name} onChange={e => setEditValues({...editValues, name: e.target.value})} placeholder="종목명" style={{ padding: '8px', borderRadius: '6px', border: `1px solid ${theme.border}` }} />
                      <input type="number" value={editValues.currentPrice} onChange={e => setEditValues({...editValues, currentPrice: e.target.value})} placeholder="현재가" style={{ padding: '8px', borderRadius: '6px', border: `1px solid ${theme.border}` }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
                      <input type="number" value={editValues.low36} onChange={e => setEditValues({...editValues, low36: e.target.value})} placeholder="저점" style={{ padding: '8px', borderRadius: '6px', border: `1px solid ${theme.border}` }} />
                      <input type="number" value={editValues.high36} onChange={e => setEditValues({...editValues, high36: e.target.value})} placeholder="고점" style={{ padding: '8px', borderRadius: '6px', border: `1px solid ${theme.border}` }} />
                      <input type="number" value={editValues.index} onChange={e => setEditValues({...editValues, index: e.target.value})} placeholder="순서" style={{ padding: '8px', borderRadius: '6px', border: `1px solid ${theme.border}` }} />
                    </div>

                    <div style={{ padding: '15px', backgroundColor: theme.card, borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                      <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>📊 종목지표 멘트 설정</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#34c759', fontWeight: 'bold' }}>▲ 상승장 (Buy / Neutral / Sell)</span>
                          <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                            <input value={editValues.stockIndicatorMentions.up.buy} onChange={e => setEditValues({...editValues, stockIndicatorMentions: {...editValues.stockIndicatorMentions, up: {...editValues.stockIndicatorMentions.up, buy: e.target.value}}})} placeholder="매수" style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '4px', border: `1px solid ${theme.border}` }} />
                            <input value={editValues.stockIndicatorMentions.up.neutral} onChange={e => setEditValues({...editValues, stockIndicatorMentions: {...editValues.stockIndicatorMentions, up: {...editValues.stockIndicatorMentions.up, neutral: e.target.value}}})} placeholder="중립" style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '4px', border: `1px solid ${theme.border}` }} />
                            <input value={editValues.stockIndicatorMentions.up.sell} onChange={e => setEditValues({...editValues, stockIndicatorMentions: {...editValues.stockIndicatorMentions, up: {...editValues.stockIndicatorMentions.up, sell: e.target.value}}})} placeholder="매도" style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '4px', border: `1px solid ${theme.border}` }} />
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#ff3b30', fontWeight: 'bold' }}>▼ 하락장 (Buy / Neutral / Sell)</span>
                          <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                            <input value={editValues.stockIndicatorMentions.down.buy} onChange={e => setEditValues({...editValues, stockIndicatorMentions: {...editValues.stockIndicatorMentions, down: {...editValues.stockIndicatorMentions.down, buy: e.target.value}}})} placeholder="매수" style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '4px', border: `1px solid ${theme.border}` }} />
                            <input value={editValues.stockIndicatorMentions.down.neutral} onChange={e => setEditValues({...editValues, stockIndicatorMentions: {...editValues.stockIndicatorMentions, down: {...editValues.stockIndicatorMentions.down, neutral: e.target.value}}})} placeholder="중립" style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '4px', border: `1px solid ${theme.border}` }} />
                            <input value={editValues.stockIndicatorMentions.down.sell} onChange={e => setEditValues({...editValues, stockIndicatorMentions: {...editValues.stockIndicatorMentions, down: {...editValues.stockIndicatorMentions.down, sell: e.target.value}}})} placeholder="매도" style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '4px', border: `1px solid ${theme.border}` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => handleUpdateStock(s.id)} style={{ flex: 1, padding: '8px', backgroundColor: theme.primary, color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>저장</button>
                      <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '8px', backgroundColor: theme.subText, color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>취소</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '30px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: theme.subText }}>{s.index || 0}</div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 'bold' }}>{s.symbol}</span> 
                            <span style={{ fontSize: '12px', color: theme.subText }}>{s.name}</span>
                            <span style={{ fontSize: '11px', color: theme.primary }}>({s.zone || "Z-"})</span>
                          </div>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: s.enabled !== false ? '#34c75922' : '#8e8e9322', color: s.enabled !== false ? '#34c759' : '#8e8e93', marginLeft: '10px' }}>
                            {s.enabled !== false ? "활성" : "비활성"}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => startEdit(s)} style={{ color: theme.primary, background: 'none', border: 'none', cursor: 'pointer' }}><Edit3 size={18} /></button>
                        <button onClick={async () => confirm("삭제?") && await deleteDoc(doc(db, "stocks", s.id))} style={{ color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: theme.subText, display: 'flex', gap: '15px', paddingLeft: '45px' }}>
                      <span>현재: {Number(s.currentPrice || 0).toLocaleString()}</span>
                      <span>저점: {Number(s.low36 || 0)}</span>
                      <span>고점: {Number(s.high36 || 0)}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '16px', border: `1px solid ${theme.border}`, marginBottom: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '16px', fontWeight: 'bold' }}><Activity size={20} color={theme.primary} /> 시장 지표 및 방향 설정</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div><label style={{ fontSize: '11px', color: theme.subText }}>36개월 저점</label><input type="number" value={marketData.low36} onChange={e => setMarketData({...marketData, low36: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text }} /></div>
            <div><label style={{ fontSize: '11px', color: theme.subText }}>현재 종가</label><input type="number" value={marketData.currentPrice} onChange={e => setMarketData({...marketData, currentPrice: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text }} /></div>
          </div>
          <button onClick={fetchSheetData} style={{ width: '100%', padding: '12px', backgroundColor: "#E2E8F0", color: "#475569", border: 'none', borderRadius: '10px', fontWeight: 'bold', marginBottom: '10px' }}>구글 시트 데이터 로드</button>
          <button onClick={async () => {
            const regime = getMarketRegime(marketData.low36, marketData.currentPrice, marketData.manualRegime);
            await setDoc(doc(db, "settings", "market"), { ...marketData, autoRegime: getMarketRegime(marketData.low36, marketData.currentPrice), finalRegime: regime, updatedAt: serverTimestamp() }, { merge: true });
            alert("저장 완료");
          }} style={{ width: '100%', padding: '15px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}><Save size={18} /> 시스템 지표 및 방향 저장</button>
        </div>

        {interpretation && (
          <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '16px', border: `1px solid ${theme.border}`, marginBottom: '20px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '16px', fontWeight: 'bold' }}><MessageSquare size={20} color={theme.primary} /> PRO 시장해석 관리 (16개 조합)</h2>
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: theme.bg, borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><input type="radio" name="dir" checked={marketData.direction === "up"} onChange={() => setMarketData({...marketData, direction: "up"})} /> ▲ 상승국면</label>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><input type="radio" name="dir" checked={marketData.direction === "down"} onChange={() => setMarketData({...marketData, direction: "down"})} /> ▼ 하락국면</label>
                </div>
                <div style={{ display: 'flex', backgroundColor: theme.card, padding: '3px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                  {['A', 'B'].map(v => (
                    <button 
                      key={v} 
                      onClick={() => {
                        setStrategy(v);
                        setInterpretation(prev => {
                          const next = { ...prev };
                          if (!next.comments?.[selectedM]) next.comments[selectedM] = {};
                          if (!next.comments[selectedM]?.[marketData.direction]) next.comments[selectedM][marketData.direction] = { A:"", B:"", active:"A" };
                          next.comments[selectedM][marketData.direction].active = v;
                          return next;
                        });
                      }} 
                      style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', backgroundColor: strategy === v ? theme.primary : 'transparent', color: strategy === v ? '#fff' : theme.text, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      전략 {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
              {["M1", "M2", "M3", "M4"].map(m => <button key={m} onClick={() => setSelectedM(m)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: selectedM === m ? theme.primary : theme.bg, color: selectedM === m ? "#fff" : theme.text, fontWeight: 'bold' }}>{m}</button>)}
            </div>
            <textarea value={interpretation.comments?.[selectedM]?.[marketData.direction]?.[strategy] || ""} onChange={e => {
              const next = {...interpretation};
              if(!next.comments?.[selectedM]?.[marketData.direction]) next.comments[selectedM][marketData.direction] = {A: "", B: "", active: strategy};
              next.comments[selectedM][marketData.direction][strategy] = e.target.value;
              setInterpretation(next);
            }} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text }} rows="3" placeholder={`시장구간 ${selectedM} / 전략 ${strategy} 내용을 입력하세요.`} />
            <button onClick={async () => {
              const next = { ...interpretation };
              if (!next.comments?.[selectedM]) next.comments[selectedM] = {};
              if (!next.comments[selectedM]?.[marketData.direction]) {
                next.comments[selectedM][marketData.direction] = { A: "", B: "", active: strategy };
              }
              next.comments[selectedM][marketData.direction].active = strategy;
              await setDoc(doc(db, "marketInterpretation", "current"), next);
              setInterpretation(next);
              alert("16개 조합 전체 저장완료");
            }} style={{ width: '100%', padding: '15px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', marginTop: '10px' }}>PRO 해석 저장</button>
          </div>
        )}

        <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '16px', border: `2px solid ${theme.primary}`, marginBottom: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '16px', fontWeight: 'bold' }}><UserCheck size={20} color={theme.primary} /> PRO 활성화 대기 요청 ({proRequests.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {proRequests.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: theme.bg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                <div><div style={{ fontWeight: 'bold' }}>{r.email}</div><div style={{ fontSize: '11px', color: theme.subText }}><Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} /> PRO 요청일: {r.requestedAt?.toDate().toLocaleString()}</div></div>
                <button onClick={async () => { await updateDoc(doc(db, "users", r.uid), { tier: "PRO" }); await updateDoc(doc(db, "proRequests", r.id), { status: "approved" }); alert("승인완료"); }} style={{ padding: '8px 16px', backgroundColor: theme.primary, color: 'white', borderRadius: '6px' }}>승인</button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", fontSize: "16px", fontWeight: "bold" }}><Users size={20} color={theme.primary} /> 회원 관리 및 가입 현황</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.subText, fontSize: '12px' }}><th align="left" style={{ padding: '10px' }}>이메일 / 가입일</th><th align="center">등급</th><th align="right">설정</th></tr></thead>
              <tbody>
                {userList.map(u => (
                  <tr key={u.uid} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontWeight: '500' }}>{u.email || u.uid}</div>
                      <div style={{ fontSize: '10px', color: theme.subText }}>가입일: {u.createdAt ? (typeof u.createdAt === 'string' ? u.createdAt : u.createdAt.toDate?.().toLocaleString()) : "-"}</div>
                    </td>
                    <td align="center"><span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: u.tier === 'PRO' ? '#0A84FF22' : '#8882', color: u.tier === 'PRO' ? theme.primary : theme.text, fontSize: '11px', fontWeight: 'bold' }}>{u.tier}</span></td>
                    <td align="right" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', padding: '10px' }}>
                      <select value={u.tier || "FREE"} onChange={async (e) => { await updateDoc(doc(db, "users", u.uid), { tier: e.target.value }); alert("변경완료"); }} style={{ fontSize: '11px', padding: '2px', borderRadius: '4px' }}><option value="FREE">FREE</option><option value="PRO">PRO</option><option value="ADMIN">ADMIN</option></select>
                      <button onClick={() => handleDeleteUser(u.uid)} style={{ color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}