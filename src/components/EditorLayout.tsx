import type { ReactNode } from 'react';

interface EditorLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  hasImage: boolean;
}

// Pure layout shell. The sidebar is hidden on the landing page (no image loaded)
// so recruiters see the full-width hero without a confusing empty filter panel.
export function EditorLayout({ sidebar, main, hasImage }: EditorLayoutProps) {
  return (
    <div className="flex h-screen bg-canvas-bg text-white overflow-hidden">
      {hasImage && sidebar}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {main}
      </main>
    </div>
  );
}
