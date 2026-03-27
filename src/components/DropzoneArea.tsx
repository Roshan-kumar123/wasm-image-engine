import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { useEditorStore } from '../store/use-editor-store';

interface DropzoneAreaProps {
  onImageData: (imageData: ImageData) => void;
}

function fileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not acquire 2D canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(imageData);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image failed to load'));
    };

    img.src = objectUrl;
  });
}

export function DropzoneArea({ onImageData }: DropzoneAreaProps) {
  const setOriginalImage = useEditorStore((s) => s.setOriginalImage);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setOriginalImage(file);
      const imageData = await fileToImageData(file);
      onImageData(imageData);
    },
    [setOriginalImage, onImageData],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={[
        'flex flex-col items-center justify-center gap-3',
        'h-48 rounded-2xl border-2 border-dashed cursor-pointer',
        'transition-colors duration-200 select-none',
        isDragActive
          ? 'border-accent bg-accent/10'
          : 'border-white/20 hover:border-accent/60 bg-white/5',
      ].join(' ')}
    >
      <input {...getInputProps()} />
      <UploadCloud
        className={[
          'w-9 h-9 transition-colors duration-200',
          isDragActive ? 'text-accent' : 'text-white/30',
        ].join(' ')}
      />
      <div className="text-center">
        <p className="text-sm font-medium text-white/70">
          {isDragActive ? 'Drop it here' : 'Drag & drop an image'}
        </p>
        <p className="text-xs text-white/35 mt-0.5">
          or click to browse — PNG, JPG, WebP
        </p>
      </div>
    </div>
  );
}
