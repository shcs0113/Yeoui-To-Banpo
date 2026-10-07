import { PillButton } from './ui/PillButton';

interface Props {
  onStart: () => void; // 출발하기 -> 설정 카드
  onPreview: () => void; // 코스 미리보기
}

// 첫 화면: 풍경 위 큰 타이틀 + 투명 버튼 두 개
export function TitleScreen({ onStart, onPreview }: Props) {
  return (
    <>
      <div className="pointer-events-none absolute top-[30%] left-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-4 text-center">
        <h1 className="text-[clamp(40px,8vw,84px)] leading-none font-extrabold tracking-[-.02em] [text-shadow:0_4px_30px_rgba(0,0,0,.35),0_1px_2px_rgba(0,0,0,.25)]">
          Yeoui <span className="mx-[.12em] text-[.55em] font-light italic opacity-85">to</span>{' '}
          Banpo
        </h1>
        <p className="mt-3.5 text-[clamp(13px,1.8vw,18px)] font-medium tracking-[.02em] text-white/90 [text-shadow:0_2px_14px_rgba(0,0,0,.45)]">
          한강을 달리는 집중 타이머 - 여의도에서 반포까지
        </p>
      </div>

      <div className="absolute inset-x-0 top-[54%] flex -translate-y-1/2 flex-wrap justify-center gap-3 px-4">
        <PillButton size="lg" onClick={onStart}>
          출발하기
        </PillButton>
        <PillButton size="lg" onClick={onPreview}>
          코스 미리보기
        </PillButton>
      </div>
    </>
  );
}
