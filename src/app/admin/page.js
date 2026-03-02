"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, query, where, onSnapshot, serverTimestamp, deleteDoc } from "firebase/firestore";
import { Settings, RefreshCw, Save, Users, ArrowLeft, UserCheck, Clock, MessageSquare, Layout } from "lucide-react";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // 시장 지표 상태
  const [low36, setLow36] = useState("");
  const [high36, setHigh36] = useState("");
  const [point, setPoint] = useState("");
  const [upRate, setUpRate] = useState(0);
  const [marketStatus, setMarketStatus] = useState("중립");

  // 회원 및 요청 관리 상태
  const [userList, setUserList] = useState([]);
  const [proRequests, setProRequests] = useState([]);

  // 🚀 PRO 시장 해석 상태 추가
  const [interpretation, setInterpretation] = useState(null);
  const [selectedM, setSelectedM] = useState("M1");

  const theme = !isDarkMode ? {
    bg: "#121212", card: "#1E1E1E", text: "#FFFFFF", subText: "#A0A0A0", border: "#333333", primary: "#0A84FF"
  } : {
    bg: "#F2F2F7", card: "#FFFFFF", text: "#1C1C1E", subText: "#636366", border: "#D1D1D6", primary: "#007AFF"
  };

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    const handler = (e) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handler);

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().tier === "ADMIN") {
          setIsAdmin(true);

          // 1. 시장 지표 로드
          const marketSnap = await getDoc(doc(db, "settings", "market"));
          if (marketSnap.exists()) {
            const data = marketSnap.data();
            setPoint(data.diffPoint || "");
            setLow36(data.low36 || "");
            setHigh36(data.high36 || "");
            setUpRate(data.upRate || 0);
            setMarketStatus(data.status || "중립");
          }

          // 2. PRO 해석 데이터 로드 (에러 방지용 초기화 로직 포함)
          const interpRef = doc(db, "marketInterpretation", "current");
          const interpSnap = await getDoc(interpRef);
          
          if (interpSnap.exists()) {
            const dbData = interpSnap.data();
            // DB에 'comments' 필드가 없거나 비어있을 때를 대비한 방어 로직
            if (!dbData.comments || Object.keys(dbData.comments).length === 0) {
              setInterpretation(getInitialInterpretation());
            } else {
              setInterpretation(dbData);
            }
          } else {
            // 문서 자체가 없을 경우 빈 구조 생성
            setInterpretation(getInitialInterpretation());
          }

          setLoading(false);
          fetchUserList();

          const q = query(collection(db, "proRequests"), where("status", "==", "pending"));
          onSnapshot(q, (snapshot) => {
            setProRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(req => req.email !== user.email));
          });
        } else {
          window.location.href = "/";
        }
      } else {
        window.location.href = "/";
      }
    });

    return () => {
      unsubscribeAuth();
      darkModeMediaQuery.removeEventListener('change', handler);
    };
  }, []);

  // 🚀 초기 데이터 구조 생성 함수
  const getInitialInterpretation = () => ({
    direction: "up",
    comments: {
      M1: { up: { A: "", B: "", active: "A" }, down: { A: "", B: "", active: "A" } },
      M2: { up: { A: "", B: "", active: "A" }, down: { A: "", B: "", active: "A" } },
      M3: { up: { A: "", B: "", active: "A" }, down: { A: "", B: "", active: "A" } },
      M4: { up: { A: "", B: "", active: "A" }, down: { A: "", B: "", active: "A" } }
    }
  });

  const fetchUserList = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    setUserList(querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
  };

  const handleApprovePro = async (request) => {
    if (!confirm(`${request.email}님 승인?`)) return;
    await updateDoc(doc(db, "users", request.uid), { tier: "PRO", updatedAt: serverTimestamp() });
    await updateDoc(doc(db, "proRequests", request.uid), { status: "approved", approvedAt: serverTimestamp() });
    alert("승인 완료");
    fetchUserList();
  };

  const handleUpdateTier = async (uid, newTier) => {
    await updateDoc(doc(db, "users", uid), { tier: newTier });
    if (newTier === "FREE") await deleteDoc(doc(db, "proRequests", uid));
    alert("변경 완료");
    fetchUserList();
  };

  const fetchSheetData = async () => {
    setIsFetching(true);
    const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTbJy5cmV-hMbFD5QXpunAM7Al8eo_cg1mEEatBwnRlb9cobBPGtvrDNKczPAAxoyH9G4j4UViUZLhb/pub?output=csv";
    try {
      const response = await fetch(sheetUrl);
      const csvText = await response.text();
      const rows = csvText.split('\n').map(row => row.split(','));
      const nqPrice = rows[1]?.[1], nqLow = rows[1]?.[3];
      const cleanPoint = parseFloat(nqPrice?.replace(/[^0-9.]/g, "") || "0");
      const cleanLow = parseFloat(nqLow?.replace(/[^0-9.]/g, "") || "0");
      const rawRate = ((cleanPoint / cleanLow) - 1) * 100;
      const finalRate = Math.min(Math.max(Math.round(rawRate), 0), 100);
      let status = finalRate <= 24 ? "극공포" : finalRate <= 49 ? "공포" : finalRate <= 74 ? "중립" : "탐욕";
      setPoint(cleanPoint); setLow36(cleanLow); setUpRate(finalRate); setMarketStatus(status);
      alert(`판정 완료: ${status}`);
    } catch (e) { alert("분석 실패"); }
    setIsFetching(false);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await setDoc(doc(db, "settings", "market"), {
      diffPoint: Number(point), low36: Number(low36), high36: Number(high36),
      upRate: Number(upRate), status: marketStatus, updatedAt: new Date().toISOString()
    });
    alert("시스템 저장 완료");
    setIsSaving(false);
  };

  // 🚀 PRO 해석 저장 로직
  const handleSaveInterpretation = async () => {
    try {
      await setDoc(doc(db, "marketInterpretation", "current"), interpretation);
      alert("✅ PRO 시장 해석 저장 완료");
    } catch (e) { alert("저장 중 오류 발생"); }
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg, color: theme.text }}>⏳ 권한 확인 중...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text, padding: '20px', fontFamily: '-apple-system, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>⚙️ 어드민 센터</h1>
          <button onClick={() => window.location.href = '/'} style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', backgroundColor: theme.card, color: theme.text, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '5px' }}><ArrowLeft size={16} /> 나가기</button>
        </div>

        {/* 1. PRO 활성화 요청 */}
        <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '16px', border: `2px solid ${theme.primary}`, marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
            <UserCheck size={20} color={theme.primary} /> PRO 활성화 대기 요청 ({proRequests.length})
          </div>
          {proRequests.length === 0 ? <p style={{ textAlign: 'center', color: theme.subText, fontSize: '14px' }}>대기 중인 요청이 없습니다.</p> : 
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {proRequests.map((req) => (
                <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: theme.bg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                  <div><div style={{ fontSize: '14px', fontWeight: 'bold' }}>{req.email}</div><div style={{ fontSize: '11px', color: theme.subText }}><Clock size={12} /> {req.requestedAt?.toDate ? req.requestedAt.toDate().toLocaleString() : ""}</div></div>
                  <button onClick={() => handleApprovePro(req)} style={{ padding: '8px 16px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>승인</button>
                </div>
              ))}
            </div>
          }
        </div>

        {/* 2. PRO 시장 해석 관리 */}
        {interpretation && interpretation.comments && (
          <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '16px', border: `1px solid ${theme.border}`, marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
              <MessageSquare size={20} color={theme.primary} /> PRO 시장 해석 관리
            </div>
            
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: theme.bg, borderRadius: '10px' }}>
              <p style={{ fontSize: '13px', marginBottom: '10px', fontWeight: 'bold' }}>1. 현재 시장 국면 (방향성)</p>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ cursor: 'pointer' }}><input type="radio" name="dir" value="up" checked={interpretation.direction === "up"} onChange={(e) => setInterpretation({ ...interpretation, direction: e.target.value })} /> ▲ 상승 국면</label>
                <label style={{ cursor: 'pointer' }}><input type="radio" name="dir" value="down" checked={interpretation.direction === "down"} onChange={(e) => setInterpretation({ ...interpretation, direction: e.target.value })} /> ▼ 하락 국면</label>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontSize: '13px', marginBottom: '10px', fontWeight: 'bold' }}>2. 구간별 멘트 편집 ({selectedM})</p>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                {["M1", "M2", "M3", "M4"].map(m => (
                  <button key={m} onClick={() => setSelectedM(m)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: selectedM === m ? theme.primary : theme.bg, color: selectedM === m ? "#fff" : theme.text, cursor: 'pointer', fontWeight: 'bold' }}>{m}</button>
                ))}
              </div>
              
              {/* 🚀 에러 방지용 상세 조건문 */}
              {interpretation.comments[selectedM] && interpretation.comments[selectedM][interpretation.direction] ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: theme.subText }}>버전 A (기본형)</label>
                    <textarea value={interpretation.comments[selectedM][interpretation.direction].A} onChange={(e) => { const next = { ...interpretation }; next.comments[selectedM][interpretation.direction].A = e.target.value; setInterpretation(next); }} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, fontSize: '14px' }} rows="2" />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: theme.subText }}>버전 B (전략형)</label>
                    <textarea value={interpretation.comments[selectedM][interpretation.direction].B} onChange={(e) => { const next = { ...interpretation }; next.comments[selectedM][interpretation.direction].B = e.target.value; setInterpretation(next); }} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, fontSize: '14px' }} rows="2" />
                  </div>
                  <div style={{ padding: '10px', backgroundColor: theme.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>활성 버전:</span>
                    <label><input type="radio" name={`active-${selectedM}`} value="A" checked={interpretation.comments[selectedM][interpretation.direction].active === "A"} onChange={(e) => { const next = { ...interpretation }; next.comments[selectedM][interpretation.direction].active = e.target.value; setInterpretation(next); }} /> A</label>
                    <label><input type="radio" name={`active-${selectedM}`} value="B" checked={interpretation.comments[selectedM][interpretation.direction].active === "B"} onChange={(e) => { const next = { ...interpretation }; next.comments[selectedM][interpretation.direction].active = e.target.value; setInterpretation(next); }} /> B</label>
                  </div>
                </div>
              ) : <p style={{fontSize:'12px', color:theme.primary}}>데이터 초기화 대기 중...</p>}
            </div>
            <button onClick={handleSaveInterpretation} style={{ width: '100%', padding: '15px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>PRO 해석 저장 및 적용</button>
          </div>
        )}

        {/* 3. 시장 지표 관리 */}
        <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '16px', border: `1px solid ${theme.border}`, marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
            <RefreshCw size={20} color={theme.primary} /> 시장 지표 데이터 관리 (자동 계산 유지)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div><label style={{ fontSize: '11px', color: theme.subText }}>36개월 저점</label><input type="number" value={low36} onChange={(e) => setLow36(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text }} /></div>
            <div><label style={{ fontSize: '11px', color: theme.subText }}>현재 종가</label><input type="number" value={point} onChange={(e) => setPoint(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text }} /></div>
          </div>
          <button onClick={fetchSheetData} disabled={isFetching} style={{ width: '100%', padding: '15px', backgroundColor: theme.text, color: theme.bg, border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>{isFetching ? "분석 중..." : "구글 시트 분석 및 구간 판정"}</button>
          <button onClick={handleSaveSettings} disabled={isSaving} style={{ width: '100%', padding: '15px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>시스템 지표 저장</button>
        </div>

        {/* 4. 회원 등급 관리 */}
        <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
            <Users size={20} color={theme.primary} /> 회원 등급 관리
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.subText, fontSize: '12px' }}><th style={{ padding: '12px', textAlign: 'left' }}>이메일</th><th style={{ padding: '12px', textAlign: 'left' }}>등급</th><th style={{ padding: '12px', textAlign: 'right' }}>변경</th></tr></thead>
              <tbody>
                {userList.map((u) => (
                  <tr key={u.uid} style={{ borderBottom: `1px solid ${theme.border}`, fontSize: '13px' }}>
                    <td style={{ padding: '12px' }}>{u.email || u.uid.substring(0,8)}</td>
                    <td style={{ padding: '12px' }}><span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: u.tier === 'PRO' ? '#0A84FF22' : '#8882', color: u.tier === 'PRO' ? theme.primary : theme.subText, fontWeight: 'bold' }}>{u.tier || "FREE"}</span></td>
                    <td style={{ padding: '12px', textAlign: 'right' }}><select value={u.tier || "FREE"} onChange={(e) => handleUpdateTier(u.uid, e.target.value)} style={{ padding: '4px', borderRadius: '4px', backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}><option value="FREE">FREE</option><option value="PRO">PRO</option><option value="ADMIN">ADMIN</option></select></td>
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