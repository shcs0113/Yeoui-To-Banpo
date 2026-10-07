import { drawSky } from './layers/sky';
import { lightAt } from './lighting';
import type { View } from './projection';

// 한 프레임 그리기. 뒤(먼 것)부터 앞(가까운 것) 순서로 덧칠한다
export function drawScene(ctx: CanvasRenderingContext2D, view: View, skyT: number, time: number) {
  const light = lightAt(skyT);
  ctx.clearRect(0, 0, view.width, view.height);
  drawSky(ctx, view, light, skyT, time);
  // 다음 커밋부터: 산, 도시 -> 강 -> 다리 -> 나무, 길, 자전거
}
