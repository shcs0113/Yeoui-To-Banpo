import type { ReactNode } from 'react';
import { Flower2, Leaf, Snowflake, Sun, Wind } from 'lucide-react';
import { useElementHeight } from '../hooks/useElementHeight';
import { useWindowHeight } from '../hooks/useWindowHeight';
import { cx } from '../lib/cx';
import { seasonDockTop } from '../scene/layout';
import { useTimer } from '../state/TimerContext';
import type { Theme } from '../state/types';

const ICON = { size: 18, strokeWidth: 1.9 };
const MIN_TOP = 104; // 위쪽 메뉴 아이콘과 이만큼은 떨어뜨린다 (px)

const SEASONS: readonly { value: Theme; label: string; icon: ReactNode }[] = [
  { value: 'spring', label: '봄', icon: <Flower2 {...ICON} /> },
  { value: 'summer', label: '여름', icon: <Sun {...ICON} /> },
  { value: 'autumn', label: '가을', icon: <Leaf {...ICON} /> },
  { value: 'winter', label: '겨울', icon: <Snowflake {...ICON} /> },
];

// 오른쪽 세로 줄: 계절 4개 + 흩날림 켜기/끄기. 넓은 화면(데스크톱)에서만 보인다
// 하늘(맨 위 ~ 수평선) 가운데에 두되, 화면이 낮으면 위쪽 메뉴 바로 아래(MIN_TOP)에 멈춘다
export function SeasonDock() {
  const { theme, setTheme, effects, setEffects } = useTimer();
  const screenH = useWindowHeight();
  const [ref, dockH] = useElementHeight<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="absolute right-4 flex w-[42px] flex-col items-center gap-1 max-[900px]:hidden"
      style={{ top: seasonDockTop(screenH, dockH, MIN_TOP) }}
    >
      {SEASONS.map((s) => (
        <RoundButton
          key={s.value}
          label={s.label}
          on={theme === s.value}
          onClick={() => setTheme(s.value)}
        >
          {s.icon}
        </RoundButton>
      ))}
      <span className="my-0.5 h-px w-5 bg-white/50 shadow-[0_0_4px_rgba(0,0,0,.5)]" />
      <RoundButton
        label={effects ? '흩날림 끄기' : '흩날림 켜기'}
        on={effects}
        onClick={() => setEffects(!effects)}
      >
        <Wind {...ICON} />
      </RoundButton>
    </div>
  );
}

interface RoundButtonProps {
  label: string; // 화면 낭독기와 마우스 툴팁에 쓰는 이름
  on: boolean; // 켜져 있으면 흰 동그라미로 채운다
  onClick: () => void;
  children: ReactNode; // 아이콘
}

// 작은 동그란 아이콘 버튼. 배경이 없으니 그림자로 하늘 위에서도 보이게
function RoundButton({ label, on, onClick, children }: RoundButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      title={label}
      onClick={onClick}
      className={cx(
        'grid size-8 cursor-pointer place-items-center rounded-full drop-shadow-[0_1px_6px_rgba(0,0,0,.6)] transition',
        on ? 'bg-white text-ink' : 'text-white hover:bg-white/15',
      )}
    >
      {children}
    </button>
  );
}
