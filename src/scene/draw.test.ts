import { describe, it, expect, vi } from 'vitest';
import { strokeLine } from './draw';
import { makeView } from './projection';

// 진짜 캔버스 대신 호출만 기록하는 가짜 ctx
function fakeCtx() {
  return {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
  } as unknown as CanvasRenderingContext2D & { stroke: ReturnType<typeof vi.fn> };
}

const view = makeView(1000, 800, 0);

describe('strokeLine', () => {
  it('카메라 뒤에만 있는 선은 그리지 않는다', () => {
    const ctx = fakeCtx();
    strokeLine(ctx, view, [0, 0, -5], [0, 5, -1], '#fff', 1);
    expect(ctx.stroke).not.toHaveBeenCalled();
  });

  it('같은 굵기라도 멀리 있으면 얇게 그린다', () => {
    const near = fakeCtx();
    const far = fakeCtx();
    strokeLine(near, view, [0, 0, 20], [0, 5, 20], '#fff', 1);
    strokeLine(far, view, [0, 0, 200], [0, 5, 200], '#fff', 1);
    expect(far.lineWidth).toBeLessThan(near.lineWidth);
  });
});
