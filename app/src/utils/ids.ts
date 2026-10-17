let fallbackSequence = 0;

export function createId(): string {
  try {
    return globalThis.crypto.randomUUID();
  } catch {
    // The sequence keeps IDs distinct within this runtime if crypto is unavailable.
    fallbackSequence++;
    return `local-${Date.now().toString(36)}-${fallbackSequence.toString(36)}`;
  }
}
