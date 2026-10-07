import { drawBike } from './layers/bike';
import { drawBridges } from './layers/bridges';
import { drawCity } from './layers/city';
import { drawMountains } from './layers/mountains';
import { drawPath } from './layers/path';
import { drawRiver } from './layers/river';
import { drawSky } from './layers/sky';
import { drawTrees } from './layers/trees';
import { lightAt } from './lighting';
import type { View } from './projection';

// 한 프레임에 필요한 값 (카메라·화면 정보는 View에 따로)
export interface Frame {
  skyT: number; // 하늘 0 낮 -> 0.5 밤 -> 1 아침
  time: number; // 경과 초 (반짝임·흔들림·지하철용)
  bikeZ: number; // 자전거가 달리는 차선 깊이
  toBanpo: boolean; // 자전거 방향
}

// 한 프레임 그리기. 뒤(먼 것)부터 앞(가까운 것) 순서로 덧칠한다
export function drawScene(ctx: CanvasRenderingContext2D, view: View, frame: Frame) {
  const { skyT, time } = frame;
  const light = lightAt(skyT);
  ctx.clearRect(0, 0, view.width, view.height);
  drawSky(ctx, view, light, skyT, time);
  drawMountains(ctx, view, light);
  drawCity(ctx, view, light);
  drawRiver(ctx, view, light, time);
  drawBridges(ctx, view, light, time);
  drawTrees(ctx, view, light);
  drawPath(ctx, view, light);
  drawBike(ctx, view, frame.bikeZ, frame.toBanpo);
}
