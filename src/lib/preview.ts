import { ROUTE_END_X } from '../constants/course';
import { TIMELAPSE_MS } from '../state/derive';
import type { Settings } from '../state/types';

// 미리보기 화면이 보여줄 값
export interface PreviewState {
  toBanpo: boolean; // 미리보기 방향
  sim: number | null; // 타임라인 위치 0~1 (null = 위치, 시간대 슬라이더로 자유 조작 중)
  x: number; // 카메라 위치
  skyT: number; // 하늘
}

// 한 사이클(집중 + 휴식)을 0~1로 볼 때 각 구간의 길이 (가상 시간 ms)
export interface SimSpan {
  focusMs: number;
  totalMs: number;
  focusShare: number; // 집중이 차지하는 비율
  lapseShare: number; // 마지막 타임랩스가 차지하는 비율
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function simSpan({ focusMin, breakMin }: Settings): SimSpan {
  const focusMs = focusMin * 60_000;
  const totalMs = focusMs + breakMin * 60_000;
  return {
    focusMs,
    totalMs,
    focusShare: focusMs / totalMs,
    lapseShare: TIMELAPSE_MS / totalMs,
  };
}

// 진행률(0 출발 ~ 1 도착) <-> 카메라 위치. 여의나루행이면 반대로
const toX = (p: number, toBanpo: boolean) => (toBanpo ? p : 1 - p) * ROUTE_END_X;
const toProgress = (x: number, toBanpo: boolean) =>
  clamp01(toBanpo ? x / ROUTE_END_X : 1 - x / ROUTE_END_X);

// 타임라인 위치 -> 그 순간의 화면 (실제 주행의 derive와 같은 규칙)
export function simAt(sim: number, toBanpo: boolean, settings: Settings): PreviewState {
  const s = clamp01(sim);
  const { focusMs, totalMs } = simSpan(settings);
  const elapsed = s * totalMs;

  if (elapsed <= focusMs) {
    // 집중: 달리면서 낮 → 밤
    const progress = elapsed / focusMs;
    return { toBanpo, sim: s, x: toX(progress, toBanpo), skyT: progress * 0.5 };
  }
  // 휴식: 도착해서 밤, 마지막 1분 동안 아침으로
  const remaining = totalMs - elapsed;
  const skyT = 0.5 + 0.5 * clamp01(1 - remaining / TIMELAPSE_MS);
  return { toBanpo, sim: s, x: toX(1, toBanpo), skyT: Math.min(skyT, 0.9999) };
}

// 지금 화면이 타임라인의 어디쯤인지. 자유 조작 중이면 위치로 거꾸로 계산
export function simOf(p: PreviewState, settings: Settings): number {
  if (p.sim !== null) return p.sim;
  return toProgress(p.x, p.toBanpo) * simSpan(settings).focusShare;
}

// 다리 칩으로 이동할 때 다리 앞 몇 m에 설지 (바로 밑이면 상판이 하늘을 가린다)
export const JUMP_BEFORE_M = 150;

// 다리 칩: 그 다리가 앞에 보이는 순간으로. 출발·도착 지점은 그 자리 그대로
export function jumpTo(pointX: number, toBanpo: boolean, settings: Settings): PreviewState {
  const at = toProgress(pointX, toBanpo);
  const progress = at === 0 || at === 1 ? at : Math.max(0, at - JUMP_BEFORE_M / ROUTE_END_X);
  return simAt(progress * simSpan(settings).focusShare, toBanpo, settings);
}

// 이번 구간에서 달린 거리 (km)
export function previewKm(p: PreviewState): number {
  return (toProgress(p.x, p.toBanpo) * ROUTE_END_X) / 1000;
}

// 하늘 값 -> 이름
export function skyWord(t: number): string {
  if (t < 0.3) return '낮';
  if (t < 0.41) return '노을';
  if (t < 0.48) return '블루아워';
  if (t < 0.66) return '밤';
  if (t < 0.82) return '여명';
  if (t < 0.94) return '일출';
  return '낮';
}