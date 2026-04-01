import type { ReactNode } from 'react';

interface EditorLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  hasImage: boolean;
}

export function EditorLayout({ sidebar, main, hasImage }: EditorLayoutProps) {
  return (
    <div className="flex h-screen bg-canvas-bg text-text-primary overflow-hidden">
      {hasImage && sidebar}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {main}
      </main>
    </div>
  );
}
