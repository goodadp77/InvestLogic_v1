"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../../firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from "firebase/firestore";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // 🚀 13단계 공탐지수 관련 상태
  const [point, setPoint] = useState(0);
  const [status, setStatus] = useState("반등 (중립)");
  const [emoji, setEmoji] = useState("😐");
  
  // 회원 관리 전용 상태값
  const [userList, setUserList] = useState([]);
  const [isUserLoading, setIsUserLoading] = useState(false);

  const theme = { bg: "#F2F2F7", card: "#FFFFFF", text: "#000000", subText: "#6e6e73", border: "#d1d1d6", primary: "#0a84ff" };

  // 🚀 기획안 기반 13단계 자동 매칭 로직
  const getAutoSettings = (p) => {
    if (p <= -1201) return { s: "저점 (폭락 · 구조 붕괴)", e: "😱" };
    if (p <= -801) return { s: "저점 (급락 · 투매)", e: "😨" };
    if (p <= -501) return { s: "저점 (패닉 하락)", e: "😰" };
    if (p <= -251) return { s: "저점 (약세 · 공포)", e: "😟" };
    if (p <= -100) return { s: "반등 (조정)", e: "😕" };
    if (p <= -51) return { s: "반등 (약보합)", e: "😐" };
    if (p <= 50) return { s: "반등 (중립)", e: "😐" };
    if (p <= 99) return { s: "반등 (강보합)", e: "😐" };
    if (p <= 150) return { s: "고점 (기술 반등)", e: "🙂" };
    if (p <= 250) return { s: "고점 (상승 시도)", e: "😊" };
    if (p <= 400) return { s: "고점 (추세 상승)", e: "😄" };
    if (p <= 650) return { s: "과열 (급등)", e: "😁" };
    return { s: "과열 (폭등 · 탐욕)", e: "🤪" };
  };

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().tier === "ADMIN") {
          setIsAdmin(true);
          const docRef = doc(db, "settings", "market");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setPoint(data.diffPoint || 0);
            setStatus(data.status || "반등 (중립)");
            setEmoji(data.emoji || "😐");
          }
          fetchUserList();
        } else {
          setIsAdmin(false);
          alert("관리자 권한이 없습니다.");
          window.location.href = "/";
        }
      } else {
        setIsAdmin(false);
        window.location.href = "/login";
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 포인트 변경 시 표정/상태 자동 계산
  useEffect(() => {
    const { s, e } = getAutoSettings(point);
    setStatus(s);
    setEmoji(e);
  }, [point]);

  const fetchUserList = async () => {
    setIsUserLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const users = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setUserList(users);
    } catch (error) { console.error("유저 목록 로드 실패:", error); }
    setIsUserLoading(false);
  };

  const handleUpdateTier = async (uid, newTier) => {
    if (!confirm(`해당 유저의 등급을 ${newTier}(으)로 변경하시겠습니까?`)) return;
    try {
      await updateDoc(doc(db, "users", uid), { tier: newTier });
      alert("✅ 등급 변경이 완료되었습니다.");
      fetchUserList();
    } catch (error) { alert("❌ 오류 발생: " + error.message); }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "market"), {
        diffPoint: Number(point),
        status: status,
        emoji: emoji,
        updatedAt: new Date().toISOString()
      });
      alert("✅ 시장 지표(market)가 실시간으로 반영되었습니다!");
    } catch (error) { 
      alert("❌ 저장 오류: " + error.message); 
    }
    setIsSaving(false);
  };

  if (loading) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', color: theme.text}}>⏳ 인증 확인 중...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text, width: '100vw', margin: 0, padding: 0 }}>
      {/* 🚀 상단 배포 확인 바 */}
      <div style={{ backgroundColor: '#FFD700', color: '#000', padding: '12px', fontSize: '16px', textAlign: 'center', fontWeight: 'bold' }}>
          ✅ InvestLogic V1 클린 리셋 및 13단계 엔진 설치 완료
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: '-apple-system, sans-serif' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <div>
            <h1 style={{ color: theme.text, margin: 0, fontSize: 24 }}>⚙️ 어드민 센터</h1>
            <p style={{ color: theme.subText, fontSize: 13, marginTop: 5 }}>전역 설정 및 회원 권한 관리</p>
          </div>
          <button onClick={() => window.location.href = '/'} style={{ padding: '8px 16px', backgroundColor: theme.card, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer' }}>
            홈으로 이동
          </button>
        </div>

        {/* 1. 시장 지표 제어 섹션 */}
        <div style={{ backgroundColor: theme.card, padding: 25, borderRadius: 12, border: `1px solid ${theme.border}`, marginBottom: 25 }}>
          <h3 style={{ color: theme.text, marginTop: 0, marginBottom: 15, borderBottom: `1px solid ${theme.border}`, paddingBottom: 10 }}>📊 시장 상황 실시간 제어</h3>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: theme.subText, marginBottom: 8 }}>NQ1! 변동 포인트 입력 (-1500 ~ 1000)</label>
            <input 
              type="number" 
              value={point} 
              onChange={(e) => setPoint(Number(e.target.value))}
              style={{ width: '100%', padding: '15px', borderRadius: 8, backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, fontSize: 20, fontWeight: 'bold' }}
            />
          </div>

          <div style={{ backgroundColor: theme.bg, padding: 20, borderRadius: 10, textAlign: 'center', marginBottom: 20 }}>
             <div style={{ fontSize: 45, marginBottom: 5 }}>{emoji}</div>
             <div style={{ fontSize: 18, fontWeight: 'bold', color: theme.primary }}>{status}</div>
             <div style={{ fontSize: 12, color: theme.subText, marginTop: 5 }}>지수 {point}p 기준 자동 계산됨</div>
          </div>

          <button 
            onClick={handleSaveSettings} 
            disabled={isSaving}
            style={{ width: '100%', padding: '15px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}
          >
            {isSaving ? "저장 중..." : "시장 지표 실시간 업데이트"}
          </button>
        </div>

        {/* 2. 회원 등급 관리 섹션 */}
        <div style={{ backgroundColor: theme.card, padding: 25, borderRadius: 12, border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottom: `1px solid ${theme.border}`, paddingBottom: 10 }}>
            <h3 style={{ color: theme.text, margin: 0 }}>👥 회원 관리</h3>
            <button onClick={fetchUserList} style={{ fontSize: 12, color: theme.primary, border: 'none', background: 'none', cursor: 'pointer' }}>🔄 새로고침</button>
          </div>
          
          {isUserLoading ? <p style={{textAlign:'center', padding:'20px'}}>불러오는 중...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: `1px solid ${theme.border}`, color: theme.subText }}>
                    <th style={{ padding: '10px 5px' }}>이메일</th>
                    <th style={{ padding: '10px 5px' }}>등급</th>
                    <th style={{ padding: '10px 5px', textAlign: 'right' }}>변경</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.map((u) => (
                    <tr key={u.uid} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '12px 5px', color: theme.text }}>
                        {u.email || <span style={{color: theme.subText, fontSize: 11}}>{u.uid.substring(0,8)}...</span>}
                      </td>
                      <td style={{ padding: '12px 5px' }}>
                        <span style={{ 
                          padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 'bold',
                          backgroundColor: u.tier === 'PRO' ? '#f5f3ff' : u.tier === 'ADMIN' ? '#eff6ff' : '#f3f4f6',
                          color: u.tier === 'PRO' ? '#6d28d9' : u.tier === 'ADMIN' ? '#1d4ed8' : '#374151'
                        }}>
                          {u.tier || "FREE"}
                        </span>
                      </td>
                      <td style={{ padding: '12px 5px', textAlign: 'right' }}>
                        <select 
                          value={u.tier || "FREE"}
                          onChange={(e) => handleUpdateTier(u.uid, e.target.value)}
                          style={{ padding: '4px', borderRadius: 4, border: `1px solid ${theme.border}`, fontSize: 12 }}
                        >
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
          )}
        </div>
      </div>
    </div>
  );
}