// 🚀 page.js의 스타일 노이즈를 제거하고 성능을 최적화한 전용 파일

export const homeCss = `
  /* 기본 레이아웃 구성 */
  .responsive-layout { 
    display: grid; 
    grid-template-columns: 1fr; 
    gap: 20px; 
    max-width: 1200px; 
    margin: 0 auto; 
    padding: 20px; 
    grid-template-areas: "controls" "main" "chart"; 
  }
  
  .grid-controls { grid-area: controls; }
  .grid-main { grid-area: main; min-width: 0; }
  .grid-chart { grid-area: chart; }

  /* 태블릿 및 데스크탑 레이아웃 반응형 설정 */
  @media (min-width: 768px) { 
    .responsive-layout { 
      grid-template-columns: 400px 1fr; 
      grid-template-rows: max-content 1fr; 
      align-items: start; 
      column-gap: 20px; 
      row-gap: 5px; 
      grid-template-areas: "controls main" "chart main"; 
    } 
  }

  /* 다크모드 대응 고정 스타일 */
  @media (prefers-color-scheme: dark) { 
    .login-guide-box { background-color: #0F172A !important; border: 1px solid #1E293B !important; } 
    .login-guide-box span { color: #94A3B8 !important; } 
    .login-guide-box span span { color: #FFFFFF !important; } 
  }

  /* 텍스트 줄임 처리 (PRO 시장 해석용) */
  .line-clamp-2 { 
    display: -webkit-box; 
    -webkit-line-clamp: 2; 
    -webkit-box-orient: vertical; 
    overflow: hidden; 
  }

  /* 🥊 탭 가로 스크롤바 숨기기 및 스크롤 성능 최적화 */
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { 
    -ms-overflow-style: none; 
    scrollbar-width: none; 
    display: flex;
    gap: 8px;
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
  }
`;

export const getStyles = (theme) => ({
  loading: { display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', backgroundColor: theme.bg, color: theme.text },
  
  /* 시장 게이지 및 대시보드 섹션 */
  gaugeSection: { marginBottom: 20, padding: 15, paddingBottom: 0, overflow:'hidden', backgroundColor: theme.card, borderRadius: 15, border: `1px solid ${theme.border}` },
  capitalBox: { marginBottom: 20, backgroundColor: theme.card, padding:15, borderRadius:12, border:`1px solid ${theme.border}`, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  capitalInput: { background:'transparent', border:'none', color: theme.text, fontSize:24, fontWeight:'bold', width:'100%', outline:'none' },
  section: { marginBottom: 20, backgroundColor: theme.card, padding:15, borderRadius:15, border:`1px solid ${theme.border}`, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  sectionHeader: { marginBottom:15, borderBottom:`1px solid ${theme.border}`, paddingBottom:10 },

  /* 🥊 종목 선택 탭 시스템 (가로 스크롤 UX 반영) */
  tabContainer: { 
    display:'flex', 
    gap:8, 
    marginBottom: 15, 
    overflowX: 'auto', 
    flexWrap: 'nowrap', 
    paddingBottom: 5, 
    WebkitOverflowScrolling: 'touch'
  },

  tab: { 
    minWidth: '80px', 
    padding: '10px 15px', 
    backgroundColor: theme.bg, 
    border:`1px solid ${theme.border}`, 
    color: theme.subText, 
    borderRadius: 8, 
    cursor:'pointer',
    flexShrink: 0, 
    textAlign: 'center',
    transition: 'all 0.2s ease',
    fontSize: '13px'
  },

  activeTab: { 
    minWidth: '80px', 
    padding: '10px 15px', 
    backgroundColor:'#0a84ff', 
    border:'none', 
    color:'white', 
    borderRadius: 8, 
    fontWeight:'bold',
    flexShrink: 0, 
    textAlign: 'center',
    boxShadow: '0 4px 10px rgba(10, 132, 255, 0.3)',
    fontSize: '13px'
  },

  /* 입력 필드 및 제어판 */
  controlGrid: { display:'flex', gap:10, marginBottom:10 },
  controlItem: { flex:1, backgroundColor: theme.bg, padding:10, borderRadius:8, border:`1px solid ${theme.border}` },
  smallInput: { width:'80px', padding:8, borderRadius:4, border:`1px solid ${theme.border}`, textAlign:'center', fontWeight:'bold', fontSize:16, backgroundColor: theme.card, color: theme.text },
  fullInput: { width:'100%', padding:12, borderRadius:8, border:`1px solid ${theme.border}`, backgroundColor: theme.card, color: theme.text, fontSize:16, fontWeight:'bold', marginTop:5 },

  /* 매수 플랜 테이블 디자인 (여백 제거 및 정렬 최적화) */
  tableScroll: { width: '100%', overflowX: 'auto' },
  tableHeader: { display:'flex', fontSize:11, color: theme.subText, paddingBottom:8, borderBottom:`1px solid ${theme.border}`, minWidth: 0, textAlign: 'center' },
  row: { display:'flex', alignItems:'center', padding:'12px 0', borderBottom:`1px solid ${theme.border}`, fontSize:13, minWidth: 0, textAlign: 'center' },
  rowExecuted: { display:'flex', alignItems:'center', padding:'12px 0', borderBottom:`1px solid ${theme.border}`, fontSize:13, opacity: 0.4, minWidth: 0, textAlign: 'center', backgroundColor: '#34c75908' },
  
  /* 실제 매수 기록 및 버튼 디자인 */
  totalBar: { display:'flex', justifyContent:'space-between', marginTop:15, paddingTop:15, borderTop:`1px solid ${theme.border}`, fontWeight:'bold' },
  historyItem: { backgroundColor: theme.bg, padding:12, borderRadius:8, marginBottom:8, border:`1px solid ${theme.border}` },
  
  /* 🥊 버튼 스타일: 파란색 수정 버튼 및 빨간색 삭제 버튼 일관성 확보 */
  editBtn: { padding:'6px 12px', backgroundColor:'#0a84ff', color:'white', border:'none', borderRadius:6, fontSize:12, cursor:'pointer', fontWeight: 'bold' },
  delBtn: { padding:'6px 12px', backgroundColor:'#ff453a', color:'white', border:'none', borderRadius:6, fontSize:12, cursor:'pointer', fontWeight: 'bold' },
  saveBtn: { padding:'6px 12px', backgroundColor:'#30d158', color:'black', border:'none', borderRadius:6, fontSize:12, cursor:'pointer', fontWeight:'bold' }
});