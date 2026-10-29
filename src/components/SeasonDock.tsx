import { useState } from 'react';
import { Flower2, Leaf, Snowflake, Sun, Wind, X } from 'lucide-react';
import { useElementHeight } from '../hooks/useElementHeight';
import { useWindowHeight } from '../hooks/useWindowHeight';
import { seasonDockTop } from '../scene/layout';
import { useTimer } from '../state/TimerContext';
import { DockToggle, RoundButton, SeasonButtons } from './SeasonButtons';
import { SkyMenu } from './SkyMenu';

const ICON = { size: 18, strokeWidth: 1.9 };
const MIN_TOP = 104; // 위쪽 메뉴 아이콘과 이만큼은 떨어뜨린다 (px)
const BUTTON = 32; // 버튼 크기 (size-8). 폰의 접힌 버튼도 데스크톱과 같게
const SEASON_ICONS = { spring: Flower2, summer: Sun, autumn: Leaf, winter: Snowflake } as const;

type Open = 'season' | 'sky' | null; // 지금 펼친 목록 (폰에선 한 번에 하나만)

// 계절 4개 + 흩날림 켜기/끄기, 그 왼쪽에 하늘. 하늘(맨 위 ~ 수평선) 가운데에 두되, 화면이 낮으면 MIN_TOP에 멈춘다
// 넓은 화면(900px 이상): 계절은 늘 펼친 세로 줄 / 좁은 화면(폰): 지금 계절 버튼 하나, 누르면 펼쳐진다
// 하늘은 두 화면 모두 시계 버튼 하나, 누르면 펼쳐진다
// 두 줄의 기준은 max-[900px](900 미만)과 min-[900px](900 이상)으로 딱 맞물리게
export function SeasonDock() {
  const [open, setOpen] = useState<Open>(null);
  const toggle = (which: 'season' | 'sky') => setOpen(open === which ? null : which); // 하나 펼치면 다른 건 접힌다

  return (
    <>
      <DesktopDock skyOpen={open === 'sky'} onSky={() => toggle('sky')} />
      <PhoneDock open={open} onSeason={() => toggle('season')} onSky={() => toggle('sky')} />
    </>
  );
}

function EffectsButton() {
  const { effects, setEffects } = useTimer();
  return (
    <RoundButton
      label={effects ? '흩날림 끄기' : '흩날림 켜기'}
      on={effects}
      onClick={() => setEffects(!effects)}
    >
      <Wind {...ICON} />
    </RoundButton>
  );
}

const Divider = () => (
  <span className="my-0.5 h-px w-5 bg-white/50 shadow-[0_0_4px_rgba(0,0,0,.5)]" />
);

function DesktopDock({ skyOpen, onSky }: { skyOpen: boolean; onSky: () => void }) {
  const screenH = useWindowHeight();
  const [ref, dockH] = useElementHeight<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="absolute right-4 flex w-[42px] flex-col items-center gap-1 max-[900px]:hidden"
      style={{ top: seasonDockTop(screenH, dockH, MIN_TOP) }}
    >
      <SeasonButtons />
      <Divider />
      <EffectsButton />
      <SkyMenu open={skyOpen} onToggle={onSky} />
    </div>
  );
}

interface PhoneDockProps {
  open: Open;
  onSeason: () => void;
  onSky: () => void;
}

function PhoneDock({ open, onSeason, onSky }: PhoneDockProps) {
  const { theme } = useTimer();
  const screenH = useWindowHeight();
  const seasonOpen = open === 'season';
  const Current = SEASON_ICONS[theme];

  return (
    <div
      className="absolute right-4 flex w-[42px] flex-col items-center gap-1 min-[900px]:hidden"
      style={{ top: seasonDockTop(screenH, BUTTON, MIN_TOP) }} // 접힌 버튼 기준으로 자리를 잡는다
    >
      {/* 접혔을 땐 지금 계절, 펼쳤을 땐 닫기 */}
      <DockToggle
        label={seasonOpen ? '계절 목록 닫기' : '계절 바꾸기'}
        open={seasonOpen}
        onClick={onSeason}
      >
        {seasonOpen ? <X {...ICON} /> : <Current {...ICON} />}
      </DockToggle>

      {/* 펼친 목록: 골라도 그대로, 위 X를 눌러야 접힌다 */}
      {seasonOpen && (
        <div className="flex flex-col items-center gap-1">
          <SeasonButtons />
          <Divider />
          <EffectsButton />
        </div>
      )}

      <SkyMenu open={open === 'sky'} onToggle={onSky} />
    </div>
  );
}
