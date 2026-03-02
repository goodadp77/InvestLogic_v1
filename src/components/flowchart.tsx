"use client";
import React, { useEffect } from 'react';

interface FlowChartProps {
  theme: {
    border: string;
    subText: string;
  };
}

/**
 * 🚀 [플로우차트 컴포넌트] 
 * TradingView 실시간 차트 로직을 분리하여 관리합니다.
 */
const FlowChart: React.FC<FlowChartProps> = ({ theme }) => {
  const chartContainerId = "tradingview_widget_container";

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadScript = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    loadScript("https://s3.tradingview.com/tv.js").then(() => {
      // @ts-ignore: TradingView is global
      if (window.TradingView) {
        // @ts-ignore
        new window.TradingView.widget({
          "width": "100%",
          "height": 350,
          "symbol": "NASDAQ:QQQ",
          "interval": "D",
          "timezone": "Asia/Seoul",
          "theme": "dark",
          "style": "3",
          "locale": "kr",
          "toolbar_bg": "#000000",
          "enable_publishing": false,
          "hide_top_toolbar": true,
          "hide_side_toolbar": true,
          "hide_legend": false,
          "save_image": false,
          "container_id": chartContainerId,
          "backgroundColor": "#000000",
          "gridLineColor": "rgba(42, 46, 57, 0.3)",
          "scalePosition": "right",
          "scaleMode": "Normal",
        });
      }
    });
  }, []);

  return (
    <div style={{ 
      borderTop: `1px solid ${theme.border}`, 
      marginTop: '20px',
      position: 'relative', 
      backgroundColor: '#000000', 
      borderRadius: '16px', 
      border: `1px solid ${theme.border}`, 
      overflow: 'hidden' 
    }}>
      <div id={chartContainerId} style={{ height: "350px" }} />
      <div style={{ textAlign: 'center', fontSize: '11px', color: theme.subText, padding: '8px' }}>
        ※ 본 차트는 Invesco QQQ ETF의 실시간 데이터입니다.
      </div>
    </div>
  );
};

export default FlowChart;