import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { readSetting, writeSetting } from "@/lib/storage";

export function useWelcome() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!readSetting(STORAGE_KEYS.welcomeSeen)) setOpen(true);
  }, []);

  const show = useCallback(() => setOpen(true), []);

  const dismiss = useCallback(() => {
    setOpen(false);
    writeSetting(STORAGE_KEYS.welcomeSeen, "1");
  }, []);

  return { open, show, dismiss };
}
