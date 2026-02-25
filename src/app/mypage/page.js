"use client";
import { useState, useEffect } from "react";
// 🚀 수정: socialLogin과 getRedirectResult 추가, provider 제거
import { auth, db, socialLogin, getRedirectResult } from "../../firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, orderBy, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { User, Shield, ListChecks, LogIn, Info, Zap, Clock, CheckCircle } from "lucide-react";

// --- [컴포넌트 1: 상단 네비게이션] ---
const TopNav = ({ user, handleLogin, handleLogout, theme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <div style={{ width: '100%', backgroundColor: theme.card, borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, cursor: 'pointer' }} onClick={() => window.location.href='/'}>🥚 InvestLogic</div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative' }}>
          {user ? <button onClick={handleLogout} style={{ padding:'6px 12px', fontSize:12, backgroundColor: theme.bg, color: theme.text, border:`1px solid ${theme.border}`, borderRadius:4, cursor:'pointer' }}>로그아웃</button> 
                : <button onClick={handleLogin} style={{ padding:'6px 12px', fontSize:12, backgroundColor: theme.primary, color:'white', border:'none', borderRadius:4, fontWeight:'bold', cursor:'pointer' }}>로그인</button>}
          
          <div style={{ position: 'relative' }}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: theme.text }}>☰</button>
            {isMenuOpen && (
              <div style={{ position: 'absolute', top: '45px', right: '0', width: '200px', backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
                <div onClick={() => window.location.href='/'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.text }}>🏠 홈</div>
                <div onClick={() => window.location.href='/stocklab'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.text }}>🔍 종목탐구 LAB</div>
                <div onClick={() => window.location.href='/pro-guide'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.text }}>💎 PRO 등급 안내</div>
                <div onClick={() => window.location.href='/mypage'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.primary, fontWeight: 'bold' }}>⚙️ 마이페이지</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MyPage() {
  const [user, setUser] = useState(null);
  const [userTier, setUserTier] = useState("FREE");
  const [tradeSummary, setTradeSummary] = useState({ count: 0, lastDate: "-" });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proRequestStatus, setProRequestStatus] = useState(null); 

  const theme = !isDarkMode ? {
    bg: "#121212", card: "#1E1E1E", text: "#FFFFFF", subText: "#A0A0A0", border: "#333333", primary: "#0A84FF", accentBg: "#2C2C2E"
  } : {
    bg: "#F2F2F7", card: "#FFFFFF", text: "#1C1C1E", subText: "#636366", border: "#D1D1D6", primary: "#007AFF", accentBg: "#F9F9F9"
  };

  const getTierName = (tier) => {
    if (tier === "PRO") return "PRO회원";
    if (tier === "ADMIN") return "ADMIN";
    return "일반회원";
  };

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    const handler = (e) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handler);
    document.body.style.backgroundColor = theme.bg;

    // 🚀 모바일 리다이렉트 로그인 결과 확인 로직 추가
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) { console.log("리다이렉트 로그인 성공"); }
      } catch (e) { console.error("리다이렉트 에러:", e); }
    };
    checkRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // 1. 유저 등급 실시간 감시
        const userRef = doc(db, "users", currentUser.uid);
        onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) setUserTier(docSnap.data().tier || "FREE");
        });

        // 2. PRO 활성화 요청 상태 실시간 감시
        const requestRef = doc(db, "proRequests", currentUser.uid);
        onSnapshot(requestRef, (reqSnap) => {
          if (reqSnap.exists()) setProRequestStatus(reqSnap.data().status);
        });

        try {
          const q = query(collection(db, "trades"), where("uid", "==", currentUser.uid), orderBy("date", "desc"));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const lastTradeDate = querySnapshot.docs[0].data().date;
            setTradeSummary({
              count: querySnapshot.size,
              lastDate: new Date(lastTradeDate).toLocaleDateString()
            });
          }
        } catch (e) { console.warn("Trade summary error:", e); }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      darkModeMediaQuery.removeEventListener('change', handler);
    };
  }, [theme.bg]);

  // --- [PRO 기능 활성화 요청 함수: 에러 핸들링 강화] ---
  const handleProRequest = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, "proRequests", user.uid), {
        email: user.email,
        uid: user.uid,
        status: "pending",
        requestedAt: serverTimestamp()
      });
      alert("활성화 요청이 접수되었습니다. 관리자 승인 후 PRO 기능이 자동 활성화됩니다.");
    } catch (e) {
      if (e.code === 'permission-denied') {
        alert("이미 PRO 등급이거나 현재 승인 절차가 진행 중입니다.");
      } else {
        console.error("Request Error:", e);
        alert("요청 처리 중 오류가 발생했습니다.");
      }
    }
  };

  // 🚀 수정: socialLogin 공통 함수 호출로 변경
  const handleLogin = async () => { await socialLogin(); };
  const handleLogout = () => { signOut(auth); window.location.href='/'; };

  const cardStyle = { backgroundColor: theme.card, borderRadius: '16px', padding: '25px', marginBottom: '20px', border: `1px solid ${theme.border}` };
  const labelStyle = { fontSize: '13px', color: theme.subText, marginBottom: '5px' };
  const valueStyle = { fontSize: '16px', fontWeight: 'bold', color: theme.text };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', backgroundColor: theme.bg, color: theme.text }}>⏳ 정보 로드 중...</div>;

  return (
    <div style={{ minHeight: '100vh', fontFamily: '-apple-system, sans-serif', backgroundColor: theme.bg, color: theme.text }}>
      <TopNav user={user} handleLogin={handleLogin} handleLogout={handleLogout} theme={theme} />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0' }}>마이페이지</h1>
          <p style={{ color: theme.subText, fontSize: '15px' }}>계정 및 등급 정보를 확인합니다.</p>
        </div>

        {user ? (
          <>
            {/* 1) 카드: 계정 정보 */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontSize: '17px', fontWeight: 'bold' }}>
                <User size={20} color={theme.primary} /> 계정 정보
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={labelStyle}>이메일</div>
                  <div style={valueStyle}>{user.email}</div>
                </div>
                <div>
                  <div style={labelStyle}>현재 등급</div>
                  <div style={{ ...valueStyle, color: (userTier === 'PRO' || userTier === 'ADMIN') ? theme.primary : theme.text }}>
                    {getTierName(userTier)}
                  </div>
                </div>
              </div>
            </div>

            {/* 2) PRO 기능 활성화 섹션 */}
            {userTier !== "PRO" && userTier !== "ADMIN" && (
              <div style={{ ...cardStyle, border: `1px solid ${proRequestStatus === 'pending' ? theme.border : theme.primary}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', fontSize: '17px', fontWeight: 'bold' }}>
                  <Zap size={20} color="#FFD60A" /> PRO 기능 활성화
                </div>
                
                {proRequestStatus === "pending" ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: theme.subText, fontSize: '15px', padding: '10px 0' }}>
                    <Clock size={18} /> 현재 관리자 승인을 기다리는 중입니다.
                  </div>
                ) : proRequestStatus === "approved" ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: "#34C759", fontSize: '15px', padding: '10px 0' }}>
                    <CheckCircle size={18} /> PRO 기능이 활성화되었습니다!
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: '14px', color: theme.subText, lineHeight: '1.6', marginBottom: '20px' }}>
                      관리자 승인 후 PRO 등급으로 전환되면 구간별 전략 확장 계산 기능을 이용할 수 있습니다.
                    </p>
                    <button 
                      onClick={handleProRequest}
                      style={{ 
                        width: '100%', padding: '16px', backgroundColor: theme.primary, color: 'white', 
                        border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(0, 122, 255, 0.2)'
                      }}
                    >
                      PRO 기능 활성화 요청
                    </button>
                  </>
                )}
              </div>
            )}

            {/* 3) 카드: 기록 요약 */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontSize: '17px', fontWeight: 'bold' }}>
                <ListChecks size={20} color={theme.primary} /> 기록 요약
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={labelStyle}>총 매수 기록</div>
                  <div style={valueStyle}>{tradeSummary.count} 건</div>
                </div>
                <div>
                  <div style={labelStyle}>최근 기록일</div>
                  <div style={valueStyle}>{tradeSummary.lastDate}</div>
                </div>
              </div>
            </div>

            {/* 4) 카드: 권한 안내 */}
            <div style={{ ...cardStyle, backgroundColor: theme.accentBg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', fontSize: '17px', fontWeight: 'bold' }}>
                <Shield size={20} color={theme.subText} /> 권한 안내
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: theme.subText }}>
                  <Info size={16} /> PRO 회원은 확장 기능/추가 정보가 제공됩니다.
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px' }}>
            <LogIn size={48} color={theme.border} style={{ marginBottom: '20px' }} />
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>로그인이 필요합니다</div>
            <p style={{ color: theme.subText, fontSize: '14px', marginBottom: '30px' }}>계정 정보를 확인하려면 로그인을 해주세요.</p>
            <button 
              onClick={handleLogin}
              style={{ padding: '14px 40px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              로그인하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}