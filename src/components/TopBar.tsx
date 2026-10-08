import type { ReactNode } from 'react';
import { ClipboardList, EyeIcon, EyeOff, MapIcon, SlidersHorizontal } from 'lucide-react';
import { cx } from '../lib/cx';
import { IconButton } from './ui/IconButton';

// 아이콘 공통 크기, 굵기 (프로토타입: 24px, 선 1.8)
const ICON = { size: 24, strokeWidth: 1.8 };

interface Props {
  showBrand: boolean; // 첫 화면에선 가운데 큰 타이틀이 대신하니 숨긴다
  tag?: string; // 브랜드 옆 작은 태그 (예: CYCLE 2 / 4)
  info?: ReactNode; // 거리 정보 (RouteInfo). 넓은 화면은 가운데, 좁은 화면은 브랜드 대신 왼쪽
  previewOn: boolean;
  previewDisabled: boolean; // 달리는 중엔 미리보기를 못 연다
  historyOn: boolean;
  settingsOn: boolean;
  uiHidden: boolean;
  onPreview: () => void;
  onHistory: () => void;
  onToggleUi: () => void;
  onSettings: () => void;
}

// 왼쪽 위 브랜드 + 오른쪽 위 아이콘 4개
export function TopBar(props: Props) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(14px,env(safe-area-inset-top))]">
      <div
        className={cx(
          'text-[17px] font-extrabold whitespace-nowrap transition-opacity duration-300 [text-shadow:0_2px_12px_rgba(0,0,0,.45)] max-[420px]:text-sm',
          (!props.showBrand || props.uiHidden) && 'invisible opacity-0',
          props.info != null && 'max-[900px]:hidden', // 좁은 화면에선 거리 정보에 자리를 내준다
        )}
      >
        여의도에서 반포까지
        {props.tag && (
          <span className="ml-2 rounded-full bg-black/35 px-2.5 py-1 align-middle text-xs font-bold max-[420px]:hidden">
            {props.tag}
          </span>
        )}
      </div>

      {props.info != null && (
        <div className="absolute bottom-0 left-1/2 flex h-[42px] -translate-x-1/2 items-center max-[900px]:static max-[900px]:translate-x-0">
          {props.info}
        </div>
      )}

      <nav className="pointer-events-auto flex gap-0.5">
        <IconButton
          label="코스 미리보기"
          active={props.previewOn}
          disabled={props.previewDisabled}
          onClick={props.onPreview}
        >
          <MapIcon {...ICON} />
        </IconButton>
        <IconButton label="기록" active={props.historyOn} onClick={props.onHistory}>
          <ClipboardList {...ICON} />
        </IconButton>
        <IconButton
          label={props.uiHidden ? 'UI 보이기' : 'UI 숨기기'}
          active={props.uiHidden}
          onClick={props.onToggleUi}
        >
          {props.uiHidden ? <EyeOff {...ICON} /> : <EyeIcon {...ICON} />}
        </IconButton>
        <IconButton label="설정" active={props.settingsOn} onClick={props.onSettings}>
          <SlidersHorizontal {...ICON} />
        </IconButton>
      </nav>
    </header>
  );
}
