export const CLEAR_JOURNAL_KEY = 'mathPractice.clearTransaction';
export const APPLICATION_DATA_KEYS = [
  'mathPractice.settings',
  'mathPractice.history',
  'mathPractice.mistakePatterns',
  'mathPractice.statistics',
  'mathPractice.version',
  'mathPractice.sessions',
  'mathPractice.attempts',
] as const;
export type BrowserStorage = Pick<Storage, 'getItem' | 'setItem'> &
  Partial<Pick<Storage, 'removeItem'>>;
type Backup = [string, string | null][];

function restore(storage: BrowserStorage, backup: Backup) {
  if (!storage.removeItem) throw new Error('Storage removal unavailable');
  for (const [key, value] of backup) {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  }
  storage.removeItem(CLEAR_JOURNAL_KEY);
}

/** An interrupted clear rolls back before normal reads or writes are allowed. */
export function recoverInterruptedClear(storage: BrowserStorage) {
  const raw = storage.getItem(CLEAR_JOURNAL_KEY);
  if (raw === null) return;
  const parsed: unknown = JSON.parse(raw);
  if (
    !Array.isArray(parsed) ||
    parsed.length !== APPLICATION_DATA_KEYS.length ||
    !parsed.every(
      (entry, index) =>
        Array.isArray(entry) &&
        entry.length === 2 &&
        entry[0] === APPLICATION_DATA_KEYS[index] &&
        (entry[1] === null || typeof entry[1] === 'string'),
    )
  )
    throw new Error('Invalid recovery record');
  restore(storage, parsed as Backup);
}

export function clearApplicationStorage(
  storage: BrowserStorage,
  resetAt: string,
  version: number,
): boolean {
  if (!storage.removeItem) return false;
  // Save the rollback journal before deleting anything. It also handles page interruption.
  const backup: Backup = APPLICATION_DATA_KEYS.map((key) => [
    key,
    storage.getItem(key),
  ]);
  storage.setItem(CLEAR_JOURNAL_KEY, JSON.stringify(backup));
  try {
    for (const key of APPLICATION_DATA_KEYS) storage.removeItem(key);
    storage.setItem(
      'mathPractice.history',
      JSON.stringify({
        version,
        data: { sessions: [], attempts: [], resetAt },
      }),
    );
    storage.removeItem(CLEAR_JOURNAL_KEY);
    return true;
  } catch {
    try {
      restore(storage, backup);
    } catch {
      /* The journal remains for startup recovery. */
    }
    return false;
  }
}
