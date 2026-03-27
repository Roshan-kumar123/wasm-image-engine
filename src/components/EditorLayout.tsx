import type { ReactNode } from 'react';

interface EditorLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

// Pure layout shell. Named slot props (`sidebar`, `main`) make the intent
// explicit and let TypeScript enforce that both areas are always provided.
export function EditorLayout({ sidebar, main }: EditorLayoutProps) {
  return (
    <div className="flex h-screen bg-canvas-bg text-white overflow-hidden">
      {sidebar}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {main}
      </main>
    </div>
  );
}
