import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { useEditorStore } from '../store/use-editor-store';

export function Canvas() {
  const originalImage = useEditorStore((s) => s.originalImage);
  const processedImageUrl = useEditorStore((s) => s.processedImageUrl);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  // Create a temporary object URL for the raw File so <img> can display it.
  // Revoke it when the file changes or the component unmounts.
  useEffect(() => {
    if (!originalImage) {
      setOriginalUrl(null);
      return;
    }
    const url = URL.createObjectURL(originalImage);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [originalImage]);

  const displayUrl = processedImageUrl ?? originalUrl;

  if (!displayUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/20">
        <ImageIcon className="w-12 h-12" />
        <p className="text-sm">No image loaded</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 overflow-hidden min-h-0">
      <img
        src={displayUrl}
        alt="Processed output"
        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
      />
    </div>
  );
}
