import { LANGUAGES, type LanguageId } from "./languages";

export type PerLanguage<T> = Record<LanguageId, T>;

export const perLanguage = <T,>(make: (id: LanguageId) => T) =>
  Object.fromEntries(LANGUAGES.map((l) => [l.id, make(l.id)])) as PerLanguage<T>;
