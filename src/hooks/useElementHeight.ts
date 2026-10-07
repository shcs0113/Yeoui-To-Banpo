import { useCallback, useState } from 'react';

// 요소의 실제 높이를 잰다. 내용이 바뀌어 높이가 달라지면 다시 잰다
export function useElementHeight<T extends HTMLElement>() {
  const [height, setHeight] = useState(0);
  // ref 콜백: 요소가 화면에 붙을 때 불리고, 돌려준 함수는 떨어질 때 불린다 (React 19)
  const ref = useCallback((el: T | null) => {
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, height] as const;
}
