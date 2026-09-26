import { useEffect, useState } from "react";

export function isApplePlatform(): boolean {
  return /Mac|iPhone|iPad/.test(navigator.platform);
}

export function useModKeyLabel(): string {
  const [label, setLabel] = useState("Ctrl");
  useEffect(() => {
    if (isApplePlatform()) setLabel("⌘");
  }, []);
  return label;
}
