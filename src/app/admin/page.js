"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../../firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from "firebase/firestore";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false); 
  
  // 🚀 데이터 상태 관리
  const [point, setPoint] = useState(0); // 현재 종가
  const [status, setStatus] = useState("2.반등 (상승초입)");
  const [emoji, setEmoji] = useState("😐");
  const [high36, setHigh36] = useState(26399); 
  const [low36, setLow36] = useState(17262);   
  const [lookbackPeriod, setLookbackPeriod] = useState(36); 

  const [userList, setUserList] = useState([]);
  const [isUserLoading, setIsUserLoading] = useState(false);

  const theme = { bg: "#F2F2F7", card: "#FFFFFF", text: "#000000", subText: "#6e6e73", border: "#d1d1d6", primary: "#0a84ff" };

  const marketPresets = [
    { s: "1.저점 (바닥다지기)", e: "🥶", min: 0, max: 25 },
    { s: "2.반등 (상승초입)", e: "😐", min: 25, max: 60 },
    { s: "3.고점 (급등구간)", e: "😊", min: 60, max: 100 },
    { s: "4.과열 (탐욕구간)", e: "🤪", min: 100, max: 999 }
  ];

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().tier === "ADMIN") {
          setIsAdmin(true);
          const docSnap = await getDoc(doc(db, "settings", "market"));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setPoint(data.diffPoint || 0);
            setStatus(data.status || "2.반등 (상승초입)");
            setEmoji(data.emoji || "😐");
            setHigh36(data.high36 || 26399);
            setLow36(data.low36 || 17262);
            setLookbackPeriod(data.lookbackPeriod || 36);
          }
          fetchUserList();
        } else {
          alert("관리자 권한이 없습니다.");
          window.location.href = "/";
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserList = async () => {
    setIsUserLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      setUserList(querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
    } catch (error) { console.error("로드 실패:", error); }
    setIsUserLoading(false);
  };

  const handleUpdateTier = async (uid, newTier) => {
    if (!confirm(`등급을 ${newTier}로 변경하시겠습니까?`)) return;
    try {
      await updateDoc(doc(db, "users", uid), { tier: newTier });
      alert("✅ 변경 완료");
      fetchUserList();
    } catch (error) { alert("오류: " + error.message); }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "market"), {
        diffPoint: Number(point),
        status: status,
        emoji: emoji,
        high36: Number(high36),
        low36: Number(low36),
        lookbackPeriod: Number(lookbackPeriod),
        updatedAt: new Date().toISOString()
      });
      alert("✅ 모든 데이터가 성공적으로 저장되었습니다!");
    } catch (error) { alert("저장 오류: " + error.message); }
    setIsSaving(false);
  };

  const fetchSheetData = async () => {
    setIsFetching(true);
    const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTbJy5cmV-hMbFD5QXpunAM7Al8eo_cg1mEEatBwnRlb9cobBPGtvrDNKczPAAxoyH9G4j4UViUZLhb/pub?output=csv";
    try {
      const response = await fetch(sheetUrl);
      const csvText = await response.text();
      const rows = csvText.split('\n').map(row => row.split(','));
      
      // 구글 시트 1안 구조: 2행 2열(현재가), 2행 3열(고점), 2행 4열(저점)
      const nqPrice = rows[1] ? rows[1][1] : null; 
      const nqHigh = rows[1] ? rows[1][2] : null;
      const nqLow = rows[1] ? rows[1][3] : null;

      const cleanPoint = Math.floor(parseFloat(nqPrice?.replace(/[^0-9.]/g, "") || "0"));
      const cleanHigh = Math.floor(parseFloat(nqHigh?.replace(/[^0-9.]/g, "") || "0"));
      const cleanLow = Math.floor(parseFloat(nqLow?.replace(/[^0-9.]/g, "") || "0"));

      if (cleanPoint === 0) throw new Error("가격을 찾을 수 없습니다.");

      const upRate = ((cleanPoint / cleanLow) - 1) * 100;
      const matched = marketPresets.find(m => upRate >= m.min && upRate < m.max) || marketPresets[1];

      setPoint(cleanPoint);
      setHigh36(cleanHigh);
      setLow36(cleanLow);
      setStatus(matched.s);
      setEmoji(matched.e);
      
      alert(`✅ 판정 결과: ${matched.s}\n\n• 현재가: ${cleanPoint.toLocaleString()}\n• 36개월 저점: ${cleanLow.toLocaleString()}\n• 36개월 고점: ${cleanHigh.toLocaleString()}\n업데이트가 완료되었습니다.`);
    } catch (error) {
      alert("⚠️ 불러오기 실패: " + error.message);
    }
    setIsFetching(false);
  };

  if (loading) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>⏳ 인증 확인 중...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text, padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: '-apple-system, sans-serif' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
          <h1 style={{ fontSize: 24 }}>⚙️ InvestLogic 어드민</h1>
          <button onClick={() => window.location.href = '/'} style={{ padding: '8px 16px', borderRadius: 6, cursor: 'pointer', border: `1px solid ${theme.border}` }}>돌아가기</button>
        </div>

        {/* 🚀 데이터 입력 섹션 */}
        <div style={{ backgroundColor: theme.card, padding: 25, borderRadius: 12, border: `1px solid ${theme.border}`, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 15 }}>📏 V1 판정 기준 및 현재가</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ fontSize: 12, color: theme.primary, fontWeight: 'bold' }}>★ 36개월 저점</label>
              <input type="number" value={low36} onChange={(e) => setLow36(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: `2px solid ${theme.primary}`, fontSize: 16 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: theme.subText }}>36개월 고점 (참고)</label>
              <input type="number" value={high36} onChange={(e) => setHigh36(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: 16 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: theme.subText, fontWeight: 'bold' }}>현재 종가 (NQ1! Current)</label>
            <input type="number" value={point} onChange={(e) => setPoint(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: 16, backgroundColor: '#f9f9f9' }} />
          </div>
        </div>

        <div style={{ backgroundColor: '#e1f5fe', padding: '20px', borderRadius: 12, marginBottom: 20, border: '1px solid #b3e5fc' }}>
            <button onClick={fetchSheetData} disabled={isFetching} style={{ width: '100%', padding: '15px', backgroundColor: '#0288d1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>
                {isFetching ? "데이터 분석 중..." : "구글 시트 분석 및 구간 자동 판정"}
            </button>
        </div>

        <div style={{ backgroundColor: theme.card, padding: 25, borderRadius: 12, border: `1px solid ${theme.border}`, marginBottom: 20 }}>
          <div style={{ backgroundColor: theme.bg, padding: 30, borderRadius: 10, textAlign: 'center', marginBottom: 15 }}>
             <div style={{ fontSize: 60, marginBottom: 10 }}>{emoji}</div>
             <div style={{ fontSize: 24, fontWeight: 'bold', color: theme.primary }}>{status}</div>
             <div style={{ fontSize: 12, color: theme.subText, marginTop: 10 }}>※ 시스템 보안 정책에 따라 원본 종가는 숨김 처리되었습니다.</div>
          </div>
          <button onClick={handleSaveSettings} disabled={isSaving} style={{ width: '100%', padding: '18px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 18, fontWeight: 'bold', cursor: 'pointer' }}>
            시스템 최종 업데이트 및 저장
          </button>
        </div>

        {/* 👥 회원 관리 */}
        <div style={{ backgroundColor: theme.card, padding: 25, borderRadius: 12, border: `1px solid ${theme.border}` }}>
          <h3 style={{ marginBottom: 15 }}>👥 회원 등급 관리</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: `1px solid ${theme.border}`, color: theme.subText, fontSize: 12 }}>
                  <th style={{ padding: '10px' }}>사용자</th>
                  <th style={{ padding: '10px' }}>등급</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>변경</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((u) => (
                  <tr key={u.uid} style={{ borderBottom: `1px solid ${theme.border}`, fontSize: 13 }}>
                    <td style={{ padding: '12px' }}>{u.email || u.uid.substring(0,8)}</td>
                    <td style={{ padding: '12px' }}><span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 'bold', backgroundColor: u.tier === 'PRO' ? '#f5f3ff' : '#f3f4f6', color: u.tier === 'PRO' ? '#6d28d9' : '#374151' }}>{u.tier || "FREE"}</span></td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <select value={u.tier || "FREE"} onChange={(e) => handleUpdateTier(u.uid, e.target.value)} style={{ padding: '4px', borderRadius: 4, fontSize: 12 }}>
                        <option value="FREE">FREE</option>
                        <option value="PRO">PRO</option>
                        <option value="ADMIN">ADMIN</option>
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