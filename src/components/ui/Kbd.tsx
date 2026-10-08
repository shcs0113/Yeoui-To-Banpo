import type { ReactNode } from 'react';

// 키보드 키 모양 (단축키 안내용)
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border-[1.5px] border-white/55 px-[5px] font-sans text-[11px]">
      {children}
    </kbd>
  );
}