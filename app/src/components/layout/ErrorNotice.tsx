import type { ReactNode } from 'react';

export default function ErrorNotice({
  children,
  label = 'Error',
  notice = false,
}: {
  children: ReactNode;
  label?: string;
  notice?: boolean;
}) {
  return (
    <p
      className="storage-notice"
      role={notice ? 'status' : 'alert'}
      aria-label={label}
    >
      {children}
    </p>
  );
}
