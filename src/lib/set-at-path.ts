/** Returns a copy of `obj` with the value at `path` (e.g. ['faq', 'items', '0', 'answer']) replaced. */
export function setAtPath<T>(obj: T, path: string[], value: unknown): T {
  if (path.length === 0) return value as T;
  const [key, ...rest] = path;
  const current = (obj ?? {}) as Record<string, unknown>;
  const child = setAtPath(current[key], rest, value);
  if (Array.isArray(obj)) {
    const copy = [...obj];
    copy[Number(key)] = child;
    return copy as T;
  }
  return { ...current, [key]: child } as T;
}
