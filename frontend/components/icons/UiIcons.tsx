import { stroke, type IconProps } from "./base";

export function ChevronDownIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" {...stroke} strokeWidth="1.6">
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

export function CheckIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" {...stroke} strokeWidth="1.8">
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}

export function CloseIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" {...stroke} strokeWidth="1.6">
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  );
}

export function InfoIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" {...stroke} strokeWidth="1.4">
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 7.25v4" />
      <circle cx="8" cy="4.9" r=".8" fill="currentColor" stroke="none" />
    </svg>
  );
}
