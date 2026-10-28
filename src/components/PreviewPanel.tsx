import { useId } from 'react';
import { ArrowLeftRight, Pause, Play, X } from 'lucide-react';
import { ROUTE_END_X } from '../constants/course';
import { formatClock } from '../lib/format';
import { previewKm, simAt, simOf, simSpan, skyWord, type PreviewState } from '../lib/preview';
import { useTimer } from '../state/TimerContext';
import { Digits } from './ui/Digits';
import { PillButton } from './ui/PillButton';
import { SeasonButtons } from './SeasonButtons';
import { SimTimeline } from './SimTimeline';

interface Props {
  preview: PreviewState;
  auto: boolean; // 자동 주행 중
  onChange: (next: PreviewState) => void;
  onToggleAuto: () => void;
  onClose: () => void;
}

// 코스 미리보기: 카드 없이 화면 아래 그라데이션 위에 한 줄 조작 + 타임라인 + 위치, 시간대
export function PreviewPanel({ preview, auto, onChange, onToggleAuto, onClose }: Props) {
  const { settings } = useTimer().state;
  const { focusMs, totalMs } = simSpan(settings);
  const sim = simOf(preview, settings);
  const ms = sim * totalMs; // 타임라인 위치를 가상 시간으로
  const { toBanpo } = preview;

  return (
    // 아래로 갈수록 진해지는 그라데이션. 글자, 버튼은 그림자로 밝은 하늘 위에서도 읽히게
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(5,10,25,.7)] via-[rgba(5,10,25,.35)] to-transparent px-4 pt-16 pb-[max(16px,env(safe-area-inset-bottom))] [text-shadow:0_1px_6px_rgba(0,0,0,.7)]">
      <div className="mx-auto max-w-[760px]">
        {/* 윗줄: 재생, 시간, 거리 / 방향, 계절, 닫기 (좁은 화면에선 오른쪽 묶음이 둘째 줄로) */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            type="button"
            aria-label={auto ? '자동 주행 멈춤' : '자동 주행'}
            onClick={onToggleAuto}
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-white text-ink drop-shadow-[0_1px_6px_rgba(0,0,0,.45)]"
          >
            {auto ? <Pause size={18} strokeWidth={2.4} /> : <Play size={18} strokeWidth={2.4} />}
          </button>
          <b className="text-[15px] whitespace-nowrap tabular-nums">
            <Digits
              value={
                ms <= focusMs
                  ? `${formatClock(ms)} / ${formatClock(focusMs)}`
                  : `휴식 ${formatClock(totalMs - ms)} 남음`
              }
            />
          </b>
          <span className="text-[12.5px] whitespace-nowrap text-white/65">
            <Digits value={previewKm(preview).toFixed(2)} />
            km · {skyWord(preview.skyT)}
            {preview.sim === null && ' (자유 조작)'}
          </span>
          <div className="ml-auto flex items-center gap-2 max-[560px]:w-full max-[560px]:justify-between">
            <PillButton size="sm" onClick={() => onChange(simAt(0, !toBanpo, settings))}>
              <ArrowLeftRight size={14} strokeWidth={2.2} />
              {toBanpo ? '반포 방향' : '여의나루 방향'}
            </PillButton>
            <div className="flex gap-1">
              <SeasonButtons />
            </div>
            <button
              type="button"
              aria-label="미리보기 닫기"
              onClick={onClose}
              className="grid size-[34px] cursor-pointer place-items-center rounded-full drop-shadow-[0_1px_6px_rgba(0,0,0,.45)] hover:bg-white/16"
            >
              <X size={20} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <SimTimeline
          sim={sim}
          toBanpo={toBanpo}
          settings={settings}
          onChange={(s) => onChange(simAt(s, toBanpo, settings))}
        />

        {/* 자유 조작 (타임라인과 따로 움직인다) */}
        <div className="mt-1 space-y-1">
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
        </div>
      </div>
    </div>
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
    <div className="flex items-center gap-2.5 text-[13px]">
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
