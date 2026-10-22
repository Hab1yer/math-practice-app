import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  focusHeading?: boolean;
}

export default function PageContainer({
  title,
  eyebrow,
  children,
  focusHeading = true,
}: PageContainerProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = `${title} | Math Practice`;
    if (focusHeading) headingRef.current?.focus();
  }, [title, focusHeading]);

  return (
    <main
      id="main-content"
      className="page"
      aria-labelledby="page-title"
      tabIndex={-1}
    >
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 id="page-title" ref={headingRef} tabIndex={-1}>
        {title}
      </h1>
      {children}
    </main>
  );
}
