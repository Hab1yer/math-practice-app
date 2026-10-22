import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';
function subscribe(notify: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {};
  const media = window.matchMedia(query);
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', notify);
    return () => media.removeEventListener('change', notify);
  }
  media.addListener?.(notify);
  return () => media.removeListener?.(notify);
}
function snapshot() {
  return (
    typeof window.matchMedia === 'function' && window.matchMedia(query).matches
  );
}
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
