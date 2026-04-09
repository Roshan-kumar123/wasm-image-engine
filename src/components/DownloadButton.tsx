import { Download } from 'lucide-react';
import { useEditorStore, selectActiveImage } from '../store/use-editor-store';

export function DownloadButton() {
  const activeImage = useEditorStore(selectActiveImage);
  const urlToDownload = activeImage?.processedUrl;

  if (!urlToDownload) return null;

  const handleDownload = () => {
    const anchor = document.createElement('a');
    anchor.href = urlToDownload;
    anchor.download = activeImage?.file.name ? `edited-${activeImage.file.name}` : 'edited-image.jpg';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors duration-150 shadow-lg"
    >
      <Download className="w-4 h-4" />
      Download
    </button>
  );
}
