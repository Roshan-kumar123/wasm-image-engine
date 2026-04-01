import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { useEditorStore } from '../store/use-editor-store';
import { fileToImageData } from '../utils/file-to-image-data';

interface DropzoneAreaProps {
  onImageData: (imageData: ImageData) => void;
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
        'h-44 rounded-2xl border-2 border-dashed cursor-pointer',
        'transition-all duration-200 select-none',
        isDragActive
          ? 'border-accent bg-accent/10 scale-[1.01]'
          : 'border-border-subtle hover:border-accent/60 bg-glass hover:bg-surface-raised',
      ].join(' ')}
    >
      <input {...getInputProps()} />
      <UploadCloud
        className={[
          'w-9 h-9 transition-colors duration-200',
          isDragActive ? 'text-accent' : 'text-text-faint',
        ].join(' ')}
      />
      <div className="text-center">
        <p className="text-sm font-medium text-text-secondary">
          {isDragActive ? 'Drop it here' : 'Drag & drop an image'}
        </p>
        <p className="text-xs text-text-faint mt-0.5">
          or click to browse — PNG, JPG, WebP
        </p>
      </div>
    </div>
  );
}
