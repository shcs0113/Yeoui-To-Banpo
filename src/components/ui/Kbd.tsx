import type { ReactNode } from 'react';
import { TRIM } from '../../lib/trim';

// 키보드 키 모양 (단축키 안내용). 높이를 고정하고 글자만 TRIM해서 테두리 가운데에
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 items-center rounded-md border-[1.5px] border-white/55 px-[5px] font-sans text-[11px]">
      <span className={TRIM}>{children}</span>
    </kbd>
  );
}
