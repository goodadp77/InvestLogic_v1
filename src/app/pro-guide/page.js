"use client";
import { useState, useEffect } from "react";
import { auth, db, provider } from "../../firebase"; 
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ShieldCheck, Zap, CheckCircle2 } from "lucide-react";

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
                <div onClick={() => window.location.href='/pro-guide'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.primary, fontWeight: 'bold' }}>💎 PRO 등급 안내</div>
                <div onClick={() => window.location.href='/mypage'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.text }}>⚙️ 마이페이지</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProGuide() {
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 🔥 크롬 확장프로그램 대응 테마 반전 (라이트일 때 어두운 테마)
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
    document.body.style.backgroundColor = theme.bg;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => { unsubscribe(); darkModeMediaQuery.removeEventListener('change', handler); };
  }, [theme.bg]);

  const handleLogin = async () => { try { await signInWithPopup(auth, provider); } catch (e) {} };
  const handleLogout = () => { signOut(auth); };

  const sectionStyle = { backgroundColor: theme.card, borderRadius: '16px', padding: '30px', marginBottom: '20px', border: `1px solid ${theme.border}` };
  const titleStyle = { fontSize: '19px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: theme.text };

  return (
    <div style={{ minHeight: '100vh', fontFamily: '-apple-system, sans-serif', backgroundColor: theme.bg, color: theme.text }}>
      <TopNav user={user} handleLogin={handleLogin} handleLogout={handleLogout} theme={theme} />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        {/* ① 타이틀 & ② 서브 */}
        <div style={{ textAlign: 'center', marginBottom: '45px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px', color: theme.text }}>
            PRO 등급 안내
          </h1>
          <p style={{ fontSize: '18px', color: theme.subText }}>
            시장 구간에 따른 계산 기능이 확장됩니다.
          </p>
        </div>

        {/* ③ PRO에서 제공되는 것 (3항목 유지) */}
        <div style={sectionStyle}>
          <div style={titleStyle}><Zap size={22} color={theme.primary} /> PRO에서 제공되는 것</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              "하락구간 누적 평단가를 낮추도록 설계된 시스템",
              "상승 구간별 비중 계산이 시장상황에 맞게 설계된 시스템",
              "전략적 분할계산기"
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: theme.text, fontWeight: '500' }}>
                <CheckCircle2 size={20} color="#34C759" /> {item}
              </div>
            ))}
          </div>
        </div>

        {/* ④ 이용 방법 */}
        <div style={sectionStyle}>
          <div style={titleStyle}><ShieldCheck size={22} color={theme.primary} /> 이용 방법</div>
          <div style={{ fontSize: '16px', lineHeight: '2.5', color: theme.text, fontWeight: '500' }}>
            1. PRO 회원 신청<br />
            2. 관리자 확인 및 승인<br />
            3. 승인 완료 후 즉시 PRO 기능 이용 가능
          </div>
        </div>

        {/* ⑤ 하단 버튼 */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button 
            onClick={() => window.location.href = '/pro-apply'}
            style={{ width: '100%', padding: '20px', backgroundColor: theme.primary, color: '#FFFFFF', border: 'none', borderRadius: '14px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 122, 255, 0.25)' }}
          >
            PRO 회원 신청하기
          </button>
        </div>
      </div>
    </div>
  );
}