import { BAR_ICON_SIZE, duo, stroke, type IconProps } from "./base";

export function PlayIcon({ size = BAR_ICON_SIZE }: IconProps) {
  const triangle = "M9 5.2v13.6a.8.8 0 0 0 1.2.7l10.4-6.8a.8.8 0 0 0 0-1.4L10.2 4.5a.8.8 0 0 0-1.2.7Z";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth="1.5">
      <path {...duo} opacity={0.3} d={triangle} />
      <path d={triangle} />
      <path d="M2.5 9.5h3M1.75 12h3.5M2.5 14.5h3" />
    </svg>
  );
}

export function CodeIcon({ size = BAR_ICON_SIZE }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth="1.5">
      <rect {...duo} x="2" y="7" width="20" height="10" rx="5" />
      <path d="m8 8.5-3.5 3.5L8 15.5M16 8.5l3.5 3.5-3.5 3.5M13.4 6l-2.8 12" />
    </svg>
  );
}

function FontSizeIcon({ size = BAR_ICON_SIZE, grow }: IconProps & { grow: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth="1.5">
      {grow ? (
        <>
          <path {...duo} d="M5.06 14.5 9 4l3.94 10.5Z" />
          <path d="M3 20 9 4l6 16M5.06 14.5h7.88" />
          <path d="M19.5 12.5v-8M17 7l2.5-2.5L22 7" />
        </>
      ) : (
        <>
          <path {...duo} d="M5.67 16.5 9 9.5l3.33 7Z" />
          <path d="M4 20 9 9.5 14 20M5.67 16.5h6.66" />
          <path d="M19.5 4.5v8M17 10l2.5 2.5L22 10" />
        </>
      )}
    </svg>
  );
}

export const FontLargerIcon = (props: IconProps) => <FontSizeIcon {...props} grow />;
export const FontSmallerIcon = (props: IconProps) => <FontSizeIcon {...props} grow={false} />;

export function KeyIcon({ size = BAR_ICON_SIZE }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth="1.5">
      <circle {...duo} cx="15.5" cy="8.5" r="5.5" />
      <circle cx="15.5" cy="8.5" r="5.5" />
      <circle cx="17" cy="7" r="1.25" fill="currentColor" stroke="none" />
      <path d="M11.6 12.4 4 20M6.3 17.7l1.9 1.9M8.6 15.4l1.5 1.5" />
    </svg>
  );
}

export function TerminalIcon({ size = BAR_ICON_SIZE }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth="1.5">
      <path {...duo} d="M5.75 4h12.5a3 3 0 0 1 3 3v1.5H2.75V7a3 3 0 0 1 3-3Z" />
      <rect x="2.75" y="4" width="18.5" height="16" rx="3" />
      <path d="M2.75 8.5h18.5M7 12l2.75 2.25L7 16.5M12 16.5h5" />
      <g fill="currentColor" stroke="none">
        <circle cx="5.5" cy="6.25" r=".7" />
        <circle cx="7.75" cy="6.25" r=".7" />
        <circle cx="10" cy="6.25" r=".7" />
      </g>
    </svg>
  );
}

export function HelpIcon({ size = BAR_ICON_SIZE }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth="1.5">
      <circle {...duo} cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.6a2.45 2.45 0 1 1 3.35 2.28c-.56.22-.95.76-.95 1.36v.36" />
      <circle cx="12" cy="16.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
