import { useId } from 'react';
import { Pause, Play, X } from 'lucide-react';
import { ROUTE, ROUTE_END_X } from '../constants/course';
import { formatClock } from '../lib/format';
import {
  jumpTo,
  previewKm,
  simAt,
  simOf,
  simSpan,
  skyWord,
  type PreviewState,
} from '../lib/preview';
import { useTimer } from '../state/TimerContext';
import { GlassPanel } from './ui/GlassPanel';
import { Kbd } from './ui/Kbd';
import { PillButton } from './ui/PillButton';
import { SimTimeline } from './SimTimeline';

const ICON = { size: 16, strokeWidth: 2.2 };

interface Props {
  preview: PreviewState;
  auto: boolean; // 자동 주행 중
  onChange: (next: PreviewState) => void;
  onToggleAuto: () => void;
  onClose: () => void;
}

// 코스 미리보기: 하단에서 타임라인, 위치, 시간대를 직접 움직여 본다
export function PreviewPanel({ preview, auto, onChange, onToggleAuto, onClose }: Props) {
  const { settings } = useTimer().state;
  const { focusMs, totalMs } = simSpan(settings);
  const sim = simOf(preview, settings);
  const ms = sim * totalMs; // 타임라인 위치를 가상 시간으로
  const { toBanpo } = preview;

  return (
    <GlassPanel className="absolute inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] mx-auto max-w-[720px] px-[18px] pt-4 pb-3.5">
      <button
        type="button"
        aria-label="미리보기 닫기"
        onClick={onClose}
        className="absolute top-2.5 right-2.5 grid size-[34px] cursor-pointer place-items-center rounded-full hover:bg-white/16"
      >
        <X size={20} strokeWidth={1.8} />
      </button>

      {/* 위: 타임라인 */}
      <div className="mb-1.5 border-b border-white/15 pb-2.5">
        <div className="flex items-baseline justify-between gap-2.5 pr-10 text-[13px]">
          <b className="text-lg tabular-nums">
            {ms <= focusMs
              ? `${formatClock(ms)} / ${formatClock(focusMs)}`
              : `휴식 ${formatClock(totalMs - ms)} 남음`}
          </b>
          <span className="text-white/65">
            {previewKm(preview).toFixed(2)}km · {skyWord(preview.skyT)}
            {preview.sim === null && ' (자유 조작)'}
          </span>
        </div>
        <SimTimeline
          sim={sim}
          toBanpo={toBanpo}
          settings={settings}
          onChange={(s) => onChange(simAt(s, toBanpo, settings))}
        />
      </div>

      {/* 아래: 자유 조작 (타임라인과 따로 움직인다) */}
      <SliderRow
        label="위치"
        min={-300}
        max={ROUTE_END_X + 150}
        step={1}
        value={preview.x}
        onChange={(x) => onChange({ ...preview, x, sim: null })}
      />
      <SliderRow
        label="시간대"
        min={0}
        max={1}
        step={0.001}
        value={preview.skyT}
        onChange={(skyT) => onChange({ ...preview, skyT, sim: null })}
      />

      <div className="my-1 flex items-center gap-2.5 text-[13px]">
        <span className="w-11 shrink-0 text-white/65">이동</span>
        <div className="flex flex-wrap gap-[5px]">
          {ROUTE.map((p, i) => (
            <PillButton
              key={p.name}
              size="sm"
              onClick={() => onChange(jumpTo(p.x, toBanpo, settings))}
            >
              {i + 1} {p.name}
            </PillButton>
          ))}
        </div>
      </div>

      <div className="mt-2.5 flex gap-2">
        <PillButton onClick={onToggleAuto}>
          {auto ? <Pause {...ICON} /> : <Play {...ICON} />}
          {auto ? '멈춤' : '자동 주행'}
        </PillButton>
        <PillButton onClick={() => onChange(simAt(0, !toBanpo, settings))}>
          {toBanpo ? '→ 반포 방향' : '← 여의나루 방향'}
        </PillButton>
      </div>
      {/* 단축키 안내: 키보드가 없는 좁은 화면(폰)에선 숨긴다 */}
      <p className="mt-2.5 text-[11.5px] leading-[1.9] text-white/60 max-[560px]:hidden">
        <Kbd>←</Kbd> <Kbd>→</Kbd> 타임라인 이동 · <Kbd>Shift</Kbd> 빠르게 · <Kbd>1</Kbd>~
        <Kbd>{ROUTE.length}</Kbd> 지점 이동 · <Kbd>Space</Kbd> 자동 주행 · <Kbd>Esc</Kbd> 닫기
      </p>
    </GlassPanel>
  );
}

interface SliderRowProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

// 이름 + 한 줄 슬라이더
function SliderRow({ label, min, max, step, value, onChange }: SliderRowProps) {
  const id = useId();
  return (
    <div className="my-1 flex items-center gap-2.5 text-[13px]">
      <label htmlFor={id} className="w-11 shrink-0 text-white/65">
        {label}
      </label>
      <input
        id={id}
        type="range"
        className="range flex-1"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}