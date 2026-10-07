import { useEffect, useState } from 'react';

// intervalMs마다 현재 시각을 새로 받아 리렌더한다 (화면의 남은 시간 숫자용)
// enabled가 false면 멈춘다 (일시정지 중엔 숫자가 안 바뀌니 다시 그릴 필요가 없다)
export function useNow(intervalMs: number, enabled = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0); // 다시 켜지자마자 한 번: 멈춰 있던 동안의 낡은 시각을 바로 갱신
    const id = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [intervalMs, enabled]);
  return now;
}
