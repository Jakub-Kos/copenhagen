// localStorage wrapper that never throws (private mode, quota, disabled storage).

const PREFIX = 'cph:'

export function load<T>(key: string, parse: (x: unknown) => T | null): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? null : parse(JSON.parse(raw))
  } catch {
    return null
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable: the app keeps working for this session.
  }
}
