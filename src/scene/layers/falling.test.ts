import { describe, it, expect } from 'vitest';
import { lightAt } from '../lighting';
import { makeView } from '../projection';
import { drawFallingLeaves } from './leaves';
import { drawSnowfall } from './snow';

const view = makeView(1280, 800, 1000); // 데스크탑 화면, 코스 1km 지점
const light = lightAt(0.12);

// 그린 위치(x)만 모으는 가짜 ctx: 눈은 arc, 낙엽은 translate 자리
function recordX() {
  const xs: number[] = [];
  const ctx = new Proxy(
    {},
    {
      get: (_, key) => {
        if (key === 'arc' || key === 'translate') return (x: number) => xs.push(x);
        return () => {};
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D;
  return { ctx, onScreen: () => xs.filter((x) => x >= 0 && x <= view.width).length };
}

// 버그: 바람을 time에 곱해서, 켜 둔 지 오래되면 전부 화면 오른쪽 밖으로 밀려나 사라졌다
describe('떨어지는 눈, 낙엽', () => {
  it.each([
    [
      '눈',
      (ctx: CanvasRenderingContext2D, t: number) => drawSnowfall(ctx, view, light, t, 0, Infinity),
    ],
    [
      '낙엽',
      (ctx: CanvasRenderingContext2D, t: number) =>
        drawFallingLeaves(ctx, view, light, t, 0, Infinity),
    ],
  ])('%s: 1시간이 지나도 화면 안에 처음만큼 보인다', (_, draw) => {
    const start = recordX();
    draw(start.ctx, 5);
    const later = recordX();
    draw(later.ctx, 3600);
    expect(start.onScreen()).toBeGreaterThan(5);
    expect(later.onScreen()).toBeGreaterThan(start.onScreen() * 0.7);
  });
});
