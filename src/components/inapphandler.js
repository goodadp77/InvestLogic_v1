"use client";
import { useEffect } from "react";

export default function InAppHandler() {
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isKakao = userAgent.includes("kakaotalk");
    const isLine = userAgent.includes("line");

    if (isKakao || isLine) {
      const targetUrl = window.location.href;
      if (isKakao) {
        window.location.href = `kakaotalk://web/openExternalApp?url=${encodeURIComponent(targetUrl)}`;
      } else {
        window.location.href = `line://msg/text/${encodeURIComponent(targetUrl)}`;
      }
    }
  }, []);

  return null; // 화면에 아무것도 그리지 않는 순수 로직 부품
}