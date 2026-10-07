import { drawBike } from './layers/bike';
import { type LabelMode, drawBridges } from './layers/bridges';
import { drawCity } from './layers/city';
import { drawMountains } from './layers/mountains';
import { drawPath } from './layers/path';
import { drawRiver } from './layers/river';
import { drawFireworks, drawFountain } from './layers/shows';
import { drawSky } from './layers/sky';
import { drawTrees } from './layers/trees';
import { ROUTE_END_X } from '../constants/course';
import { ramp } from './color';
import { lightAt, showLevel } from './lighting';
import type { View } from './projection';

// 한 프레임에 필요한 값 (카메라·화면 정보는 View에 따로)
export interface Frame {
  skyT: number; // 하늘 0 낮 → 0.5 밤 → 1 아침
  time: number; // 경과 초 (반짝임·흔들림·지하철용)
  bikeZ: number; // 자전거가 달리는 차선 깊이
  toBanpo: boolean; // 자전거 방향
  labels: LabelMode; // 다리 이름표를 어디까지 보여줄지
}

// 한 프레임 그리기. 뒤(먼 것)부터 앞(가까운 것) 순서로 덧칠한다
export function drawScene(ctx: CanvasRenderingContext2D, view: View, frame: Frame) {
  const { skyT, time } = frame;
  const light = lightAt(skyT);
  ctx.clearRect(0, 0, view.width, view.height);
  drawSky(ctx, view, light, skyT, time);
  drawMountains(ctx, view, light);
  drawCity(ctx, view, light);

  // 도착 쇼: 밤에만, 도착지 근처에서만 (가까워질수록 서서히 보인다)
  const show = showLevel(skyT);
  const nearYeoui = ramp(600 - view.camX, 0, 300);
  const nearBanpo = ramp(view.camX - (ROUTE_END_X - 600), 0, 300);
  if (show > 0 && nearYeoui > 0) drawFireworks(ctx, view, time, show * nearYeoui); // 강 건너 하늘

  drawRiver(ctx, view, light, time);
  drawBridges(ctx, view, light, time, frame.labels);
  if (show > 0 && nearBanpo > 0) drawFountain(ctx, view, time, show * nearBanpo); // 다리 앞 강물
  drawTrees(ctx, view, light);
  drawPath(ctx, view, light);
  drawBike(ctx, view, frame.bikeZ, frame.toBanpo);
}
