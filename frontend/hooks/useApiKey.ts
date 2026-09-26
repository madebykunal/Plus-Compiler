import { useCallback, useEffect, useState } from "react";
import { clearApiKey, loadApiKey, saveApiKey } from "@/lib/keyStore";

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    loadApiKey().then((stored) => setApiKey((current) => current ?? stored));
  }, []);

  const saveKey = useCallback((key: string) => {
    setApiKey(key);
    saveApiKey(key).catch(() => {});
  }, []);

  const removeKey = useCallback(() => {
    setApiKey(null);
    clearApiKey().catch(() => {});
  }, []);

  return { apiKey, saveKey, removeKey };
}
