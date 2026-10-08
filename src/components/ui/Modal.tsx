import { useEffect, useId, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

interface Props {
  title: string;
  icon: ReactNode; // 제목 앞 아이콘
  onClose: () => void;
  children: ReactNode;
}

// 팝업 창: 어두운 배경 + 가운데 유리 패널. 배경 클릭, Esc, X 버튼으로 닫힌다
export function Modal({ title, icon, onClose, children }: Props) {
  const titleId = useId(); // 창 이름을 제목과 연결 (화면 낭독기용)

  // Esc로 닫기: 창이 열려 있는 동안만 키보드를 듣는다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-50 grid place-items-center bg-black/25 px-4"
      onClick={onClose} // 바깥(배경)을 누르면 닫힘
    >
      <GlassPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[78%] w-full max-w-[440px] overflow-auto p-[22px]"
        onClick={(e) => e.stopPropagation()} // 패널 안을 누른 건 배경까지 안 올라가게
      >
        <header className="mb-4 flex items-center justify-between">
          <h3 id={titleId} className="flex items-center gap-2.5 text-[17px] font-bold">
            {icon}
            {title}
          </h3>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="grid size-9 cursor-pointer place-items-center rounded-full hover:bg-white/16"
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </header>
        {children}
      </GlassPanel>
    </div>
  );
}