import { useEffect } from 'react';
import { X } from 'lucide-react';
import { PHOTOS } from '../constants/photos';

interface Props {
  name: string; // 다리 이름
  onClose: () => void;
}

// 답사 사진 창: 사진을 세로로 쭉 이어 붙이고 스크롤. 제목줄(X 버튼)은 위에 붙어 있다
export function PhotoModal({ name, onClose }: Props) {
  const photos = PHOTOS[name] ?? [];

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
      className="absolute inset-0 z-50 grid place-items-center bg-black/45 px-4"
      onClick={onClose} // 바깥(배경)을 누르면 닫힘
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${name} 사진`}
        className="flex max-h-[86%] w-full max-w-[720px] flex-col overflow-hidden rounded-[22px] border-[1.5px] border-white/35 bg-[rgba(10,16,34,.72)] shadow-[0_20px_60px_rgba(0,0,0,.45)] backdrop-blur-[16px]"
        onClick={(e) => e.stopPropagation()} // 창 안을 누른 건 배경까지 안 올라가게
      >
        <header className="flex shrink-0 items-center justify-between px-5 py-3.5">
          <h3 className="text-[17px] font-bold">
            {name}
            <span className="ml-2 text-sm font-medium text-white/60">{photos.length}장</span>
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
        <div className="flex flex-col gap-3 overflow-y-auto px-5 pb-5">
          {photos.map((p) => (
            <img
              key={p}
              src={`${import.meta.env.BASE_URL}photos/${p}.webp`} // 배포 경로(base)가 바뀌어도 맞게
              alt=""
              loading="lazy"
              className="w-full rounded-xl"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
