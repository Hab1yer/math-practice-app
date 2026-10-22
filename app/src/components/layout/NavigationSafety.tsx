import { useCallback, useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  UNSAFE_DataRouterContext,
  useBeforeUnload,
  useBlocker,
  useLocation,
} from 'react-router-dom';
import { usePracticeSession } from '../../hooks/usePracticeSession';
import ConfirmationDialog from './ConfirmationDialog';

function Guard({ children }: { children: ReactNode }) {
  const { state, endSession, isSessionActive } = usePracticeSession();
  const location = useLocation();
  const restoreFocus = useRef<HTMLElement | null>(null);
  const active = state?.isActive === true;
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    const leaving =
      (isSessionActive?.() ?? active) &&
      currentLocation.pathname === '/practice/session' &&
      nextLocation.pathname !== currentLocation.pathname;
    if (leaving)
      restoreFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    return leaving;
  });
  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (active && location.pathname === '/practice/session') {
          event.preventDefault();
          event.returnValue = '';
        }
      },
      [active, location.pathname],
    ),
  );
  const blocked = blocker.state === 'blocked';
  const wasBlocked = useRef(false);
  useEffect(() => {
    if (wasBlocked.current && !blocked) restoreFocus.current?.focus();
    wasBlocked.current = blocked;
  }, [blocked]);
  return (
    <>
      <div inert={blocked}>{children}</div>
      {blocked && (
        <ConfirmationDialog
          idPrefix="leave-practice"
          title="Leave this session?"
          description="You can keep practicing, or end this session and leave. Answers you have marked are saved; the unfinished card will not count."
          cancelLabel="Keep practicing"
          confirmLabel="End and leave"
          onCancel={() => {
            blocker.reset();
          }}
          onConfirm={() => {
            endSession();
            blocker.proceed();
          }}
        />
      )}
    </>
  );
}

export default function NavigationSafety({
  children,
}: {
  children: ReactNode;
}) {
  // Legacy isolated MemoryRouter component tests do not provide the data-router blocker API.
  const router = useContext(UNSAFE_DataRouterContext);
  return router ? <Guard>{children}</Guard> : children;
}
