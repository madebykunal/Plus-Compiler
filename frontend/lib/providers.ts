export type Provider = { name: string; prefixes: string[] };

const PROVIDERS: Provider[] = [
  { name: "Anthropic", prefixes: ["sk-ant-"] },
  { name: "OpenRouter", prefixes: ["sk-or-"] },
  { name: "OpenAI", prefixes: ["sk-"] },
  { name: "Gemini", prefixes: ["AQ.", "AIza"] },
];

const matchingPrefix = (value: string, provider: Provider) => provider.prefixes.find((p) => value.startsWith(p));

export function detectProvider(value: string): Provider | null {
  return PROVIDERS.find((p) => matchingPrefix(value, p)) ?? null;
}

export function validateApiKey(value: string): string | null {
  if (value.length < 20) return "That key looks too short. Paste the whole key.";
  if (value.length > 256) return "That key looks too long.";
  if (!/^[\x21-\x7e]+$/.test(value)) return "Keys can't contain spaces or special characters.";
  if (!detectProvider(value)) return "That key isn't from a supported provider.";
  return null;
}

export function maskApiKey(value: string): string {
  const provider = detectProvider(value);
  return `${provider ? matchingPrefix(value, provider) : ""}••••${value.slice(-4)}`;
}
