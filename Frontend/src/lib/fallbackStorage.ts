const FALLBACK_STORAGE_PREFIX = "kyxun:";

export const isMissingTableError = (error: unknown): boolean => {
  const message = typeof error === "object" && error !== null && "message" in error
    ? String((error as { message?: unknown }).message ?? "")
    : "";
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";

  return (
    code === "PGRST205" ||
    /could not find the table/i.test(message) ||
    /schema cache/i.test(message) ||
    /does not exist/i.test(message)
  );
};

export const createFallbackId = (): string => {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getFallbackStorageKey = (tableName: string): string => `${FALLBACK_STORAGE_PREFIX}${tableName}`;

export const readFallbackTable = <T>(tableName: string): T[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(getFallbackStorageKey(tableName));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeFallbackTable = <T>(tableName: string, records: T[]): void => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getFallbackStorageKey(tableName), JSON.stringify(records));
  } catch {
    // Ignore storage write failures in non-persistent environments.
  }
};
