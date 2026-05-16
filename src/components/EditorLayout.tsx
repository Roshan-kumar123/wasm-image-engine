import type { ReactNode } from 'react';

interface EditorLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  hasImage: boolean;
}

export function EditorLayout({ sidebar, main, hasImage }: EditorLayoutProps) {
  return (
    <div className="flex flex-col md:flex-row-reverse flex-1 min-h-0 bg-canvas-bg text-text-primary overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {main}
      </main>
      {hasImage && sidebar}
    </div>
  );
}
