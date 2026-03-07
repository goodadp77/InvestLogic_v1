"use client";
import { useEffect } from "react";

const TradingViewChart = ({ theme }) => {
  const chartContainerId = "tradingview_widget_container";
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          "width": "100%", "height": 350, "symbol": "NASDAQ:QQQ", "interval": "D",
          "timezone": "Asia/Seoul", "theme": "dark", "style": "3", "locale": "kr",
          "toolbar_bg": "#000000", "enable_publishing": false, "hide_top_toolbar": true,
          "hide_side_toolbar": true, "hide_legend": false, "save_image": false,
          "container_id": chartContainerId, "backgroundColor": "#000000",
          "gridLineColor": "rgba(42, 46, 57, 0.3)", "scalePosition": "right", "scaleMode": "Normal",
        });
      }
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div style={{ borderTop: `1px solid ${theme.border}`, position: 'relative', backgroundColor: '#000000', borderRadius: 16, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
      <div id={chartContainerId} style={{ height: "350px" }} />
    </div>
  );
};

export default TradingViewChart;