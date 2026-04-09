import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

interface DropzoneAreaProps {
  onFiles: (files: File[]) => void;
}

export function DropzoneArea({ onFiles }: DropzoneAreaProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) onFiles(acceptedFiles);
    },
    [onFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: true,
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
          {isDragActive ? 'Drop images here' : 'Drag & drop images'}
        </p>
        <p className="text-xs text-text-faint mt-0.5">
          or click to browse — PNG, JPG, WebP · multiple files supported
        </p>
      </div>
    </div>
  );
}
