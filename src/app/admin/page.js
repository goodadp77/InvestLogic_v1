"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, query, where, onSnapshot, serverTimestamp, deleteDoc } from "firebase/firestore";
import { Settings, RefreshCw, Save, Users, ArrowLeft, UserCheck, Clock, CheckCircle, XCircle } from "lucide-react";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentAdminEmail, setCurrentAdminEmail] = useState("");

  const [low36, setLow36] = useState("");
  const [high36, setHigh36] = useState("");
  const [point, setPoint] = useState("");
  const [upRate, setUpRate] = useState(0);
  const [marketStatus, setMarketStatus] = useState("중립");

  const [userList, setUserList] = useState([]);
  const [proRequests, setProRequests] = useState([]);

  const theme = !isDarkMode ? {
    bg: "#121212", card: "#1E1E1E", text: "#FFFFFF", subText: "#A0A0A0", border: "#333333", primary: "#0A84FF", accentBg: "#2C2C2E"
  } : {
    bg: "#F2F2F7", card: "#FFFFFF", text: "#1C1C1E", subText: "#636366", border: "#D1D1D6", primary: "#007AFF", accentBg: "#F2F2F7"
  };

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    const handler = (e) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handler);
    document.body.style.backgroundColor = theme.bg;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists() && userSnap.data().tier === "ADMIN") {
            setIsAdmin(true);
            setCurrentAdminEmail(user.email); // 관리자 본인 식별용
            setLoading(false); 

            const docSnap = await getDoc(doc(db, "settings", "market"));
            if (docSnap.exists()) {
              const data = docSnap.data();
              setPoint(data.diffPoint || "");
              setLow36(data.low36 || "");
              setHigh36(data.high36 || "");
              setUpRate(data.upRate || 0);
              setMarketStatus(data.status || "중립");
            }
            fetchUserList();

            // 🚀 PRO 요청 실시간 감시 (본인 제외 로직 추가)
            const q = query(collection(db, "proRequests"), where("status", "==", "pending"));
            onSnapshot(q, (snapshot) => {
              const requests = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(req => req.email !== user.email); // 관리자 본인은 리스트에서 제외
              setProRequests(requests);
            });
          } else {
            alert("관리자 권한이 없습니다.");
            window.location.href = "/";
          }
        } catch (e) {
          console.error("Auth Error:", e);
          setLoading(false);
        }
      } else {
        window.location.href = "/";
      }
    });

    return () => {
      unsubscribeAuth();
      darkModeMediaQuery.removeEventListener('change', handler);
    };
  }, [theme.bg]);

  const fetchUserList = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      setUserList(querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
    } catch (error) { console.error("로드 실패:", error); }
  };

  const handleApprovePro = async (request) => {
    if (!confirm(`${request.email}님을 PRO 등급으로 승인하시겠습니까?`)) return;
    try {
      await updateDoc(doc(db, "users", request.uid), { tier: "PRO", updatedAt: serverTimestamp() });
      await updateDoc(doc(db, "proRequests", request.uid), { status: "approved", approvedAt: serverTimestamp() });
      alert("✅ 승인 완료");
      fetchUserList();
    } catch (error) { alert("승인 오류"); }
  };

  // 🚀 등급 변경 로직 보완 (강등 시 신청 내역 자동 삭제)
  const handleUpdateTier = async (uid, newTier) => {
    if (!confirm(`등급을 ${newTier}로 변경하시겠습니까?`)) return;
    try {
      await updateDoc(doc(db, "users", uid), { tier: newTier });
      
      // 등급을 FREE로 내릴 경우 proRequests의 승인 기록도 함께 삭제하여 UI 초기화
      if (newTier === "FREE") {
        await deleteDoc(doc(db, "proRequests", uid));
      }
      
      alert("✅ 변경 완료 및 관련 데이터 정리됨");
      fetchUserList();
    } catch (error) { alert("오류 발생"); }
  };

  const fetchSheetData = async () => {
    setIsFetching(true);
    const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTbJy5cmV-hMbFD5QXpunAM7Al8eo_cg1mEEatBwnRlb9cobBPGtvrDNKczPAAxoyH9G4j4UViUZLhb/pub?output=csv";
    try {
      const response = await fetch(sheetUrl);
      const csvText = await response.text();
      const rows = csvText.split('\n').map(row => row.split(','));
      const nqPrice = rows[1]?.[1], nqHigh = rows[1]?.[2], nqLow = rows[1]?.[3];
      const cleanPoint = parseFloat(nqPrice?.replace(/[^0-9.]/g, "") || "0");
      const cleanHigh = parseFloat(nqHigh?.replace(/[^0-9.]/g, "") || "0");
      const cleanLow = parseFloat(nqLow?.replace(/[^0-9.]/g, "") || "0");
      const rawRate = ((cleanPoint / cleanLow) - 1) * 100;
      const finalRate = Math.min(Math.max(Math.round(rawRate), 0), 100);
      let status = finalRate <= 24 ? "극공포" : finalRate <= 49 ? "공포" : finalRate <= 74 ? "중립" : "탐욕";
      setPoint(cleanPoint); setHigh36(cleanHigh); setLow36(cleanLow); setUpRate(finalRate); setMarketStatus(status);
      alert(`✅ 분석 완료: ${status}`);
    } catch (error) { alert("시트 분석 실패"); }
    setIsFetching(false);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "market"), {
        diffPoint: Number(point), low36: Number(low36), high36: Number(high36),
        upRate: Number(upRate), status: marketStatus, updatedAt: new Date().toISOString()
      });
      alert("✅ 시스템 저장 완료");
    } catch (error) { alert("저장 오류"); }
    setIsSaving(false);
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg, color: theme.text }}>⏳ 권한 확인 중...</div>;
  if (!isAdmin) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text, padding: '20px', fontFamily: '-apple-system, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>⚙️ 어드민 센터</h1>
          <button onClick={() => window.location.href = '/'} style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', backgroundColor: theme.card, color: theme.text, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '5px' }}><ArrowLeft size={16} /> 나가기</button>
        </div>

        {/* 1. PRO 활성화 요청 관리 (신청 날짜 표시 추가) */}
        <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '16px', border: `2px solid ${theme.primary}`, marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
            <UserCheck size={20} color={theme.primary} /> PRO 활성화 대기 요청 ({proRequests.length})
          </div>
          {proRequests.length === 0 ? <p style={{ textAlign: 'center', color: theme.subText, fontSize: '14px', padding: '10px' }}>대기 중인 요청이 없습니다.</p> : 
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {proRequests.map((req) => (
                <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: theme.bg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>{req.email}</div>
                    {/* 🚀 신청 날짜 및 시간 표시 */}
                    <div style={{ fontSize: '11px', color: theme.subText, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {req.requestedAt?.toDate ? req.requestedAt.toDate().toLocaleString() : "날짜 정보 없음"}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleApprovePro(req)} style={{ padding: '8px 16px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>승인</button>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>

        {/* 2. 시장 지표 데이터 관리 */}
        <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '16px', border: `1px solid ${theme.border}`, marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
            <RefreshCw size={20} color={theme.primary} /> 시장 지표 데이터 관리
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ fontSize: '12px', color: theme.subText, display: 'block', marginBottom: '5px' }}>★ 36개월 저점 (기준)</label>
              <input type="number" value={low36} onChange={(e) => setLow36(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, fontSize: '16px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: theme.subText, display: 'block', marginBottom: '5px' }}>36개월 고점 (참고)</label>
              <input type="number" value={high36} onChange={(e) => setHigh36(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, fontSize: '16px' }} />
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: theme.subText, display: 'block', marginBottom: '5px' }}>현재 종가 (NQ1!)</label>
            <input type="number" value={point} onChange={(e) => setPoint(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, fontSize: '16px' }} />
          </div>

          <button onClick={fetchSheetData} disabled={isFetching} style={{ width: '100%', padding: '15px', backgroundColor: theme.text, color: theme.bg, border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
            {isFetching ? "분석 중..." : "구글 시트 분석 및 구간 자동 판정"}
          </button>
          <button onClick={handleSaveSettings} disabled={isSaving} style={{ width: '100%', padding: '15px', backgroundColor: theme.primary, color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            {isSaving ? "저장 중..." : "시스템 최종 업데이트 및 저장"}
          </button>
        </div>

        {/* 3. 회원 등급 관리 테이블 */}
        <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
            <Users size={20} color={theme.primary} /> 회원 등급 관리
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left', borderBottom: `1px solid ${theme.border}`, color: theme.subText, fontSize: '12px' }}><th style={{ padding: '12px' }}>이메일</th><th style={{ padding: '12px' }}>현재 등급</th><th style={{ padding: '12px', textAlign: 'right' }}>변경</th></tr></thead>
              <tbody>
                {userList.map((u) => (
                  <tr key={u.uid} style={{ borderBottom: `1px solid ${theme.border}`, fontSize: '13px' }}>
                    <td style={{ padding: '12px' }}>{u.email || u.uid.substring(0,8)}</td>
                    <td style={{ padding: '12px' }}><span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', backgroundColor: u.tier === 'PRO' ? '#f5f3ff' : '#f3f4f6', color: u.tier === 'PRO' ? '#6d28d9' : '#374151' }}>{u.tier || "FREE"}</span></td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <select value={u.tier || "FREE"} onChange={(e) => handleUpdateTier(u.uid, e.target.value)} style={{ padding: '4px', borderRadius: '4px', fontSize: '12px', backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}>
                        <option value="FREE">FREE</option><option value="PRO">PRO</option><option value="ADMIN">ADMIN</option>
                      </select>
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