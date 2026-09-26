"use client";

import { useEffect, useState } from "react";

export function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  return <>{Math.floor((now - since) / 1000)}s</>;
}
