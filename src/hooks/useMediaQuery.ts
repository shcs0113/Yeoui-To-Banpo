import { useCallback, useSyncExternalStore } from 'react';

// CSS 미디어 쿼리가 맞는지를 React 상태처럼 쓴다 (창 크기가 바뀌어 결과가 달라지면 다시 렌더)
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}
