import { useState } from 'react';
import { Flower2, Leaf, Snowflake, Sun, Wind, X } from 'lucide-react';
import { useElementHeight } from '../hooks/useElementHeight';
import { useWindowHeight } from '../hooks/useWindowHeight';
import { cx } from '../lib/cx';
import { seasonDockTop } from '../scene/layout';
import { useTimer } from '../state/TimerContext';
import { RoundButton, SeasonButtons } from './SeasonButtons';

const ICON = { size: 18, strokeWidth: 1.9 };
const MIN_TOP = 104; // 위쪽 메뉴 아이콘과 이만큼은 떨어뜨린다 (px)
const PHONE_BUTTON = 40; // 폰의 접힌 버튼 크기 (손가락으로 누르기 편하게)
const SEASON_ICONS = { spring: Flower2, summer: Sun, autumn: Leaf, winter: Snowflake } as const;

// 계절 4개 + 흩날림 켜기/끄기. 하늘(맨 위 ~ 수평선) 가운데에 두되, 화면이 낮으면 MIN_TOP에 멈춘다
// 넓은 화면: 늘 펼친 세로 줄 / 좁은 화면(폰): 지금 계절 버튼 하나, 누르면 펼쳐진다
export function SeasonDock() {
  return (
    <>
      <DesktopDock />
      <PhoneDock />
    </>
  );
}

function DesktopDock() {
  const { effects, setEffects } = useTimer();
  const screenH = useWindowHeight();
  const [ref, dockH] = useElementHeight<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="absolute right-4 flex w-[42px] flex-col items-center gap-1 max-[900px]:hidden"
      style={{ top: seasonDockTop(screenH, dockH, MIN_TOP) }}
    >
      <SeasonButtons />
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

function PhoneDock() {
  const { theme, effects, setEffects } = useTimer();
  const screenH = useWindowHeight();
  const [open, setOpen] = useState(false);
  const Current = SEASON_ICONS[theme];

  return (
    <div
      className="absolute right-3 flex flex-col items-center gap-1.5 min-[901px]:hidden"
      style={{ top: seasonDockTop(screenH, PHONE_BUTTON, MIN_TOP) }} // 접힌 버튼 기준으로 자리를 잡는다
    >
      {/* 접혔을 땐 지금 계절, 펼쳤을 땐 닫기 */}
      <button
        type="button"
        aria-label={open ? '계절 목록 닫기' : '계절 바꾸기'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cx(
          'grid size-10 cursor-pointer place-items-center rounded-full drop-shadow-[0_1px_6px_rgba(0,0,0,.6)] transition',
          open ? 'bg-white text-ink' : 'bg-white/20 text-white backdrop-blur-sm',
        )}
      >
        {open ? <X size={20} strokeWidth={2} /> : <Current size={20} strokeWidth={1.9} />}
      </button>

      {/* 펼친 목록: 골라도 그대로, 위 X를 눌러야 접힌다. [&_button]:size-10 으로 버튼을 키운다 */}
      {open && (
        <div className="flex flex-col items-center gap-1.5 [&_button]:size-10">
          <SeasonButtons />
          <span className="my-0.5 h-px w-6 bg-white/50 shadow-[0_0_4px_rgba(0,0,0,.5)]" />
          <RoundButton
            label={effects ? '흩날림 끄기' : '흩날림 켜기'}
            on={effects}
            onClick={() => setEffects(!effects)}
          >
            <Wind size={20} strokeWidth={1.9} />
          </RoundButton>
        </div>
      )}
    </div>
  );
}
