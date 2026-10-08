import { routeProgress } from '../lib/route';

interface Props {
  cameraX: number;
  toBanpo: boolean;
}

const dest = (toBanpo: boolean) => (toBanpo ? '반포' : '여의나루');

// 달린 거리 + 다음 지점. 넓은 화면: 상단 줄 가운데 한 줄 / 좁은 화면(900px 이하): 브랜드 자리에 두 줄
export function RouteInfo({ cameraX, toBanpo }: Props) {
  const { legKm, next } = routeProgress(cameraX, toBanpo);
  return (
    <div className="flex items-center gap-2 text-[13px] whitespace-nowrap text-white/85 tabular-nums [text-shadow:0_1px_6px_rgba(0,0,0,.6),0_0_2px_rgba(0,0,0,.35)] max-[900px]:flex-col max-[900px]:items-start max-[900px]:gap-0 max-[900px]:text-[11.5px] max-[900px]:leading-[1.35] [&_b]:text-white">
      <span>
        <b className="max-[900px]:text-sm">{legKm.toFixed(2)}</b> / 6.80km
      </span>
      <span aria-hidden className="opacity-50 max-[900px]:hidden">
        ·
      </span>
      <span>
        {next ? (
          <>
            다음 <b>{next.name}</b> {next.km.toFixed(2)}km
          </>
        ) : (
          <>
            <b>{dest(toBanpo)}</b> 도착
          </>
        )}
      </span>
    </div>
  );
}
