import { useCallback, useEffect, useState } from 'react';
import { ROUTE } from '../constants/course';
import { AUTO_TOTAL_MS, autoSim, jumpTo, simAt, simOf, type PreviewState } from '../lib/preview';
import type { Settings } from '../state/types';
import { useNow } from './useNow';

// 코스 미리보기 상태: 손으로 옮긴 화면(base) + 자동 주행 시작 시각(autoFrom)
export function usePreview(settings: Settings) {
  const [base, setBase] = useState<PreviewState | null>(null); // null = 미리보기 아님
  const [autoFrom, setAutoFrom] = useState<number | null>(null); // null = 자동 주행 아님
  const auto = autoFrom !== null;
  // <--> 누르고 있는 동안: 방향(-1 뒤로 / 1 앞으로)과 Shift(빠르게)
  const [scrubbing, setScrubbing] = useState<{ dir: -1 | 1; fast: boolean } | null>(null);

  // 어느 시각의 미리보기 화면. 자동 주행 중이면 시작 후 지난 시간으로 계산한다
  const at = useCallback(
    (now: number): PreviewState | null => {
      if (base === null || autoFrom === null) return base;
      return simAt(autoSim(now - autoFrom, settings), base.toBanpo, settings);
    },
    [base, autoFrom, settings],
  );

  // 패널 숫자, 타임라인 손잡이: 자동 주행 중에만 0.05초마다 다시 그린다 (캔버스는 매 프레임 at을 부른다)
  const now = useNow(50, auto);

  // 34초가 지나면 마지막 화면(아침)에서 자동 주행을 끝낸다
  useEffect(() => {
    if (base === null || autoFrom === null) return;
    const id = setTimeout(
      () => {
        setBase(simAt(1, base.toBanpo, settings));
        setAutoFrom(null);
      },
      AUTO_TOTAL_MS - (Date.now() - autoFrom),
    );
    return () => clearTimeout(id);
  }, [base, autoFrom, settings]);

  // 키를 누르고 있는 동안 매 프레임 타임라인을 민다 (한 사이클을 12초에, Shift는 4배)
  useEffect(() => {
    if (scrubbing === null) return;
    const speed = (scrubbing.fast ? 4 : 1) / 12; // 초당 타임라인 이동량
    let last = performance.now();
    let id = 0;
    const step = (ms: number) => {
      const dt = Math.min(0.1, (ms - last) / 1000);
      last = ms;
      setBase(
        (b) => b && simAt(simOf(b, settings) + scrubbing.dir * speed * dt, b.toBanpo, settings),
      );
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [scrubbing, settings]);

  return {
    preview: at(now),
    at,
    auto,
    // 열기: 출발선에서
    open: (toBanpo: boolean) => {
      setBase(simAt(0, toBanpo, settings));
      setAutoFrom(null);
    },
    close: () => {
      setBase(null);
      setAutoFrom(null);
      setScrubbing(null);
    },
    // 손으로 만지면 자동 주행은 멈춘다
    change: (next: PreviewState) => {
      setBase(next);
      setAutoFrom(null);
    },
    // 키보드 1~5: 그 지점으로 (다리 칩과 같다)
    jump: (index: number) => {
      const point = ROUTE[index];
      if (base === null || point === undefined) return;
      setBase(jumpTo(point.x, base.toBanpo, settings));
      setAutoFrom(null);
    },
    // 키보드 <-->: dir 0이면 멈춤
    scrub: (dir: -1 | 0 | 1, fast: boolean) => {
      if (dir === 0) return setScrubbing(null);
      if (autoFrom !== null) {
        setBase(at(Date.now())); // 자동 주행 중이었으면 지금 화면에서 이어서
        setAutoFrom(null);
      }
      setScrubbing({ dir, fast });
    },
    // ▶ 자동 주행: 출발선부터 다시 / ⏸ 멈춤: 지금 화면에서 멈춤
    toggleAuto: () => {
      if (base === null) return;
      const t = Date.now();
      if (autoFrom !== null) {
        setBase(at(t));
        setAutoFrom(null);
      } else {
        setBase(simAt(0, base.toBanpo, settings));
        setAutoFrom(t);
      }
    },
  };
}