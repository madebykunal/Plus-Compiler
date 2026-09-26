export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" shapeRendering="crispEdges">
      <rect width="32" height="32" fill="currentColor" />
      <g fill="var(--bg)">
        <rect x="14" y="6" width="4" height="20" />
        <rect x="6" y="13" width="8" height="3" />
        <rect x="18" y="16" width="8" height="3" />
      </g>
    </svg>
  );
}
