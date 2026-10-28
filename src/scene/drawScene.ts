import { drawBike } from './layers/bike';
import { boatLayers } from './layers/boats';
import { drawBenches } from './layers/benches';
import { type LabelMode, drawBridges } from './layers/bridges';
import { drawCity } from './layers/city';
import { drawExpressway } from './layers/expressway';
import { drawMountains } from './layers/mountains';
import { drawPath } from './layers/path';
import { drawRiver } from './layers/river';
import { drawFallenLeaves, drawFallingLeaves } from './layers/leaves';
import { drawFallenPetals, drawFallingPetals } from './layers/petals';
import { drawSnowfall } from './layers/snow';
import { drawFireworks, drawFountain } from './layers/shows';
import { drawSky } from './layers/sky';
import { drawTrees } from './layers/trees';
import { ROUTE_END_X } from '../constants/course';
import { ramp } from './color';
import { lightAt, showLevel } from './lighting';
import type { View } from './projection';
import type { Theme } from '../state/types';

// 한 프레임에 필요한 값 (카메라·화면 정보는 View에 따로)
export interface Frame {
  skyT: number; // 하늘 0 낮 -> 0.5 밤 -> 1 아침
  time: number; // 경과 초 (반짝임·흔들림·지하철용)
  clock: number; // 실제 시각 (초). 새로고침해도 이어져야 하는 것용 (한강버스)
  bikeZ: number; // 자전거가 달리는 차선 깊이
  toBanpo: boolean; // 자전거 방향
  labels: LabelMode; // 다리 이름표를 어디까지 보여줄지
  theme: Theme; // 계절 테마
}

// 한 프레임 그리기. 뒤(먼 것)부터 앞(가까운 것) 순서로 덧칠한다
export function drawScene(ctx: CanvasRenderingContext2D, view: View, frame: Frame) {
  const { skyT, time } = frame;
  const light = lightAt(skyT);
  const autumn = frame.theme === 'autumn';
  const winter = frame.theme === 'winter';
  const spring = frame.theme === 'spring';
  ctx.clearRect(0, 0, view.width, view.height);
  drawSky(ctx, view, light, skyT, time);
  drawMountains(ctx, view, light);
  drawCity(ctx, view, light);

  // 도착 쇼: 밤에만, 도착지 근처에서만 (가까워질수록 서서히 보인다)
  const show = showLevel(skyT);
  const nearYeoui = ramp(600 - view.camX, 0, 300);
  const nearBanpo = ramp(view.camX - (ROUTE_END_X - 600), 0, 300);
  if (show > 0 && nearYeoui > 0) drawFireworks(ctx, view, time, show * nearYeoui); // 강 건너 하늘

  drawRiver(ctx, view, light, time, frame.theme);
  drawExpressway(ctx, view, light, frame.clock); // 강변북로: 건너편 둔치 위, 다리보다 먼저
  // 한강버스는 다리 교각 사이에 끼워 그린다 (다리 밑을 지날 때 앞뒤 교각 순서가 맞게)
  drawBridges(ctx, view, light, time, frame.labels, boatLayers(ctx, view, light, frame.clock));
  if (show > 0 && nearBanpo > 0) drawFountain(ctx, view, time, show * nearBanpo); // 다리 앞 강물
  // 가을: 낙엽은 깊이별로 나눠서 그 깊이의 물체 사이에 끼운다 (먼 것 -> 가까운 것)
  if (autumn) {
    drawFallenLeaves(ctx, view, light, 14.2, 19); // 나무 밑 둔치
    drawFallingLeaves(ctx, view, light, time, 15, Infinity); // 나무보다 뒤
  }
  if (spring) {
    drawFallenPetals(ctx, view, light, 14.2, 19, 4); // 나무 밑 둔치 (촘촘하게)
    drawFallingPetals(ctx, view, light, time, 15, Infinity); // 나무보다 뒤
  }
  if (winter) drawSnowfall(ctx, view, light, time, 15, Infinity); // 나무보다 뒤 (먼 하늘까지)
  drawTrees(ctx, view, light, frame.theme);
  if (autumn) drawFallingLeaves(ctx, view, light, time, 14, 15); // 나무 앞, 벤치 뒤
  if (spring) drawFallingPetals(ctx, view, light, time, 14, 15); // 나무 앞, 벤치 뒤
  drawBenches(ctx, view, light); // 휴식 지점 벤치 + 둥근 등 (나무 앞, 자전거길 뒤)
  if (autumn) drawFallenLeaves(ctx, view, light, 1.5, 7.9); // 자전거길 앞 잔디
  if (spring) drawFallenPetals(ctx, view, light, 1.5, 7.9, 2); // 자전거길 앞 잔디 (드문드문)
  if (winter) drawSnowfall(ctx, view, light, time, frame.bikeZ, 15); // 나무 앞, 자전거 뒤
  drawPath(ctx, view, light);
  if (autumn) drawFallingLeaves(ctx, view, light, time, frame.bikeZ, 14); // 자전거 뒤
  if (spring) drawFallingPetals(ctx, view, light, time, frame.bikeZ, 14); // 자전거 뒤
  drawBike(ctx, view, light, time, frame.bikeZ, frame.toBanpo);
  if (autumn) drawFallingLeaves(ctx, view, light, time, 0, frame.bikeZ); // 자전거 앞
  if (spring) drawFallingPetals(ctx, view, light, time, 0, frame.bikeZ); // 자전거 앞
  if (winter) drawSnowfall(ctx, view, light, time, 0, frame.bikeZ); // 자전거 앞
}
