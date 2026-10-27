import { clamp01, lerp } from '../color';
import { fillPoly } from '../draw';
import { type Light, shade } from '../lighting';
import { type View, project } from '../projection';
import { hash01 } from '../random';

// 강변북로: 강 건너 북쪽 둔치를 따라가는 고가 도로. 한강철교 부근에서 내려와 땅에 붙는다
const ROAD_Z = 1012; // 건너편 물가 바로 뒤
const HIGH_Y = 7; // 고가 구간 상판 아랫면 높이
const LOW_Y = 0.2; // 땅에 붙은 구간
const DOWN_FROM = 2500; // 여기서부터 내려가기 시작 (코스 x)
const DOWN_TO = 2700; // 여기서 땅에 닿는다 (한강철교 2650 근처)
const THICK = 1.8; // 상판 두께
const PIER_GAP = 35; // 교각 간격
const SEG = 20; // 높이가 바뀌니 20m 조각으로 나눠 그린다
const SPAN = 1300; // 카메라 좌우로 이만큼 (1km 밖이라 이 정도면 화면을 덮는다)
const LAMP_GAP = 40; // 도로 가로등 간격
const CAR_GAP = 45; // 차 간격 (자리마다 35%는 비워 둔다)
const CAR_SPEED = 22; // m/s (약 80km/h)

const smoothstep = (k: number) => k * k * (3 - 2 * k);

// x 위치의 상판 아랫면 높이: 고가 -> (부드럽게) -> 땅
function deckY(x: number) {
  const k = clamp01((x - DOWN_FROM) / (DOWN_TO - DOWN_FROM));
  return lerp(HIGH_Y, LOW_Y, smoothstep(k));
}

// 교각 -> 상판 옆면, 난간 -> 가로등 -> 차
export function drawExpressway(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  clock: number,
) {
  const left = Math.floor((view.camX - SPAN) / SEG) * SEG;
  const right = view.camX + SPAN;
  const pier = shade(light, 215, 6, 38, ROAD_Z);
  const deck = shade(light, 215, 6, 52, ROAD_Z);
  const rail = shade(light, 215, 6, 66, ROAD_Z);

  // 교각: 땅에 붙은 구간엔 없다
  for (let x = Math.floor(left / PIER_GAP) * PIER_GAP; x < right; x += PIER_GAP) {
    const y = deckY(x);
    if (y < 1.2) continue;
    fillPoly(
      ctx,
      view,
      [
        [x - 0.8, 0, ROAD_Z + 2],
        [x + 0.8, 0, ROAD_Z + 2],
        [x + 0.8, y, ROAD_Z + 2],
        [x - 0.8, y, ROAD_Z + 2],
      ],
      pier,
    );
  }

  // 상판 옆면 + 난간: 조각마다 양 끝 높이가 달라서 사다리꼴로 이어 붙인다
  for (let x = left; x < right; x += SEG) {
    const a = deckY(x);
    const b = deckY(x + SEG);
    fillPoly(
      ctx,
      view,
      [
        [x, a, ROAD_Z],
        [x + SEG, b, ROAD_Z],
        [x + SEG, b + THICK, ROAD_Z],
        [x, a + THICK, ROAD_Z],
      ],
      deck,
    );
    fillPoly(
      ctx,
      view,
      [
        [x, a + THICK, ROAD_Z],
        [x + SEG, b + THICK, ROAD_Z],
        [x + SEG, b + THICK + 0.5, ROAD_Z],
        [x, a + THICK + 0.5, ROAD_Z],
      ],
      rail,
    );
  }

  const night = light.night;

  // 밤: 도로 가로등 (노란 점)
  if (night > 0.05) {
    ctx.fillStyle = `rgba(255,214,150,${0.8 * night})`;
    for (let x = Math.floor(left / LAMP_GAP) * LAMP_GAP; x < right; x += LAMP_GAP) {
      const [sx, sy] = project(view, [x, deckY(x) + THICK + 2.5, ROAD_Z]);
      if (sx < -2 || sx > view.width + 2) continue;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
  }

  // 차: 우측통행이라 앞 차선은 오른쪽(동쪽), 뒤 차선은 왼쪽(서쪽)으로
  // 실제 시각(clock)으로 위치를 정해서 새로고침해도 흐름이 이어진다
  for (const dir of [1, -1] as const) {
    const shift = clock * CAR_SPEED * dir;
    for (let i = Math.floor((left - shift) / CAR_GAP); i * CAR_GAP + shift < right; i++) {
      if (hash01(i * 3.1 + dir) < 0.35) continue; // 빈자리
      const x = i * CAR_GAP + shift + hash01(i + dir * 7) * 20; // 간격이 일정하지 않게
      const z = ROAD_Z + (dir === 1 ? 0 : 4);
      const [sx, sy] = project(view, [x, deckY(x) + THICK + 0.6, z]);
      if (sx < -3 || sx > view.width + 3) continue;
      if (night > 0.05) {
        // 밤: 동쪽으로 가는 차는 흰 불빛, 서쪽으로 가는 차는 빨간 불빛
        ctx.fillStyle =
          dir === 1 ? `rgba(255,245,220,${0.9 * night})` : `rgba(255,70,60,${0.85 * night})`;
        ctx.fillRect(sx - 1, sy - 1, 2.2, 1.6);
      } else {
        // 낮: 색이 조금씩 다른 작은 점
        ctx.fillStyle = shade(
          light,
          hash01(i * 9 + dir) * 360,
          20,
          35 + hash01(i * 5) * 40,
          ROAD_Z,
        );
        ctx.fillRect(sx - 1.2, sy - 1, 2.6, 1.6);
      }
    }
  }
}
