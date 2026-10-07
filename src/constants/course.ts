// 코스 정보: 타이머(state)와 배경(scene)이 같이 쓰는 값
// 좌표 x는 코스 방향 거리(m). 여의나루 = 0, 반포 = ROUTE_END_X

export const ROUTE_END_X = 6800; // 반포 도착 지점 (반포대교 바로 앞)

export type BridgeStyle = 'girder' | 'arch' | 'dongjak' | 'banpo';

export interface Bridge {
  name: string;
  x: number; // 다리 중심 위치
  w: number; // 다리 폭 (코스 방향 두께)
  yb: number; // 상판 아랫면 높이
  yt: number; // 상판 윗면 높이
  span: number; // 교각 간격 (강 건너는 방향)
  hue: number; // 색상 (HSL의 H)
  sat: number; // 채도 (HSL의 S)
  style: BridgeStyle; // 생김새
  deco?: boolean; // 코스 밖 장식용 (출발점 뒤 마포대교)
  island?: readonly [number, number]; // 다리 아래 섬이 있는 구간 (노들섬)
}

export const BRIDGES: readonly Bridge[] = [
  {
    name: '마포대교',
    x: -260,
    w: 24,
    yb: 12,
    yt: 15,
    span: 100,
    hue: 215,
    sat: 6,
    style: 'girder',
    deco: true,
  },
  {
    name: '원효대교',
    x: 1300,
    w: 22,
    yb: 12,
    yt: 16,
    span: 100,
    hue: 215,
    sat: 6,
    style: 'girder',
  },
  {
    name: '한강대교',
    x: 3200,
    w: 20,
    yb: 12,
    yt: 15,
    span: 120,
    hue: 200,
    sat: 12,
    style: 'arch',
    island: [380, 640],
  },
  {
    name: '동작대교',
    x: 5300,
    w: 26,
    yb: 12,
    yt: 15,
    span: 110,
    hue: 190,
    sat: 18,
    style: 'dongjak',
  },
  { name: '반포대교', x: 6900, w: 26, yb: 17, yt: 21, span: 90, hue: 220, sat: 8, style: 'banpo' },
];

export interface RoutePoint {
  name: string;
  x: number;
}

// 경로 바, 미리보기에 찍히는 지점: 출발 -> 코스 위 다리들 -> 도착
export const ROUTE: readonly RoutePoint[] = [
  { name: '여의나루', x: 0 },
  ...BRIDGES.filter((b) => !b.deco && b.x < ROUTE_END_X).map((b) => ({ name: b.name, x: b.x })),
  { name: '반포', x: ROUTE_END_X },
];
