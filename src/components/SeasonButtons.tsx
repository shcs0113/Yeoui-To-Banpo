import type { ReactNode } from 'react';
import { Flower2, Leaf, Snowflake, Sun } from 'lucide-react';
import { cx } from '../lib/cx';
import { useTimer } from '../state/TimerContext';
import type { Theme } from '../state/types';

const ICON = { size: 18, strokeWidth: 1.9 };

const SEASONS: readonly { value: Theme; label: string; icon: ReactNode }[] = [
  { value: 'spring', label: '봄', icon: <Flower2 {...ICON} /> },
  { value: 'summer', label: '여름', icon: <Sun {...ICON} /> },
  { value: 'autumn', label: '가을', icon: <Leaf {...ICON} /> },
  { value: 'winter', label: '겨울', icon: <Snowflake {...ICON} /> },
];

// 계절 버튼 4개. 줄 모양(가로, 세로)은 감싸는 쪽이 정한다 (계절 버튼 줄, 미리보기가 같이 쓴다)
export function SeasonButtons() {
  const { theme, setTheme } = useTimer();
  return SEASONS.map((s) => (
    <RoundButton
      key={s.value}
      label={s.label}
      on={theme === s.value}
      onClick={() => setTheme(s.value)}
    >
      {s.icon}
    </RoundButton>
  ));
}

interface RoundButtonProps {
  label: string; // 화면 낭독기와 마우스 툴팁에 쓰는 이름
  on: boolean; // 켜져 있으면 흰 동그라미로 채운다
  onClick: () => void;
  children: ReactNode; // 아이콘
}

// 작은 동그란 아이콘 버튼. 배경이 없으니 그림자로 하늘 위에서도 보이게
// 사파리: 버튼 전체에 filter(drop-shadow)를 걸고 transition으로 바꾸면 네모난 잔상이 남는다
// -> 그림자는 아이콘(svg)에만, 흰 동그라미는 box-shadow로, 바뀌는 건 색만(transition-colors)
export function RoundButton({ label, on, onClick, children }: RoundButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      title={label}
      onClick={onClick}
      className={cx(
        'grid size-8 cursor-pointer place-items-center rounded-full transition-colors',
        on
          ? 'bg-white text-ink shadow-[0_1px_6px_rgba(0,0,0,.45)]'
          : 'text-white hover:bg-white/15 [&_svg]:drop-shadow-[0_1px_4px_rgba(0,0,0,.6)]',
      )}
    >
      {children}
    </button>
  );
}
