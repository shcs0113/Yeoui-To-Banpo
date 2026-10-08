import { useEffect, useRef } from 'react';

interface Handlers {
  down: (e: KeyboardEvent) => void;
  up?: (e: KeyboardEvent) => void;
  blur?: () => void; // 창이 포커스를 잃었을 때 (눌린 키가 안 떼어진 채로 남지 않게)
}

// 창 전체 키보드 이벤트. 리스너는 한 번만 붙이고, 매 렌더의 최신 handlers를 ref로 부른다
export function useKeyboard(handlers: Handlers) {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => latest.current.down(e);
    const up = (e: KeyboardEvent) => latest.current.up?.(e);
    const blur = () => latest.current.blur?.();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);
}