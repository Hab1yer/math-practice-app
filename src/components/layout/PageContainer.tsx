import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  eyebrow: string;
  children: ReactNode;
}

export default function PageContainer({
  title,
  eyebrow,
  children,
}: PageContainerProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = `${title} | Math Practice`;
    headingRef.current?.focus();
  }, [title]);

  return (
    <main
      id="main-content"
      className="page"
      aria-labelledby="page-title"
      tabIndex={-1}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h1 id="page-title" ref={headingRef} tabIndex={-1}>
        {title}
      </h1>
      {children}
    </main>
  );
}
