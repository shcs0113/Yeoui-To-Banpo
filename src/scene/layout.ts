import { PATH_NEAR_Z } from './layers/path';
import { CAM_Y, makeView } from './projection';

// 자전거길 앞 가장자리(= 잔디 띠가 시작하는 곳)의 화면 y. 하단 독을 이 아래 잔디에 놓는다
export function grassTopY(screenHeight: number): number {
  const view = makeView(1, screenHeight, 0); // 너비는 y 계산에 상관없다
  return view.horizon + (view.focal * CAM_Y) / PATH_NEAR_Z;
}

// 하단 독의 가운데 y: 잔디 띠 한가운데, 단 바닥에서 최소 16px 띄운다
export function dockCenterY(screenHeight: number, dockHeight: number): number {
  const grassMid = (grassTopY(screenHeight) + screenHeight) / 2;
  return Math.min(grassMid, screenHeight - 16 - dockHeight / 2);
}

// 휴식 시계의 가운데 y: 아랫부분이 수평선 바로 위(14px)에 오게.
// 단 위쪽의 경로 바(topLimit)와는 최소 12px 띄운다
export function restCenterY(screenHeight: number, clockHeight: number, topLimit: number): number {
  const horizon = makeView(1, screenHeight, 0).horizon;
  return Math.max(horizon - clockHeight / 2 - 14, topLimit + 12 + clockHeight / 2);
}

// 계절 버튼 줄의 위쪽 y: 하늘(화면 맨 위 ~ 수평선) 가운데에 오게.
// 단 화면이 낮으면 위쪽 메뉴와 붙지 않게 minTop보다 위로는 올라가지 않는다
export function seasonDockTop(screenHeight: number, dockHeight: number, minTop: number): number {
  const horizon = makeView(1, screenHeight, 0).horizon;
  return Math.max(minTop, horizon / 2 - dockHeight / 2);
}
