import { useState, useRef, DragEvent } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onClear?: () => void;
  selectedFile?: File | null;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export function FileUpload({
  onFileSelect,
  onClear,
  selectedFile,
  accept = 'image/*,.pdf,.doc,.docx,.txt',
  maxSize = 10,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    onFileSelect(file);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  if (selectedFile) {
    return (
      <div className={cn("flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30", className)}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
            {getFileIcon(selectedFile)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        {onClear && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-8 w-8 shrink-0"
            data-testid="button-clear-file"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg transition-all duration-200",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-muted/20",
        className
      )}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        data-testid="input-file-hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full p-6 sm:p-8 flex flex-col items-center justify-center gap-3 text-center group"
        data-testid="button-file-upload"
      >
        <div className={cn(
          "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200",
          isDragging 
            ? "bg-primary text-primary-foreground scale-110" 
            : "bg-muted group-hover:bg-primary/10 group-hover:scale-105"
        )}>
          <Upload className={cn(
            "h-5 w-5 sm:h-6 sm:w-6 transition-colors",
            isDragging ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
          )} />
        </div>

        <div className="space-y-1">
          <p className={cn(
            "text-sm font-medium transition-colors",
            isDragging ? "text-primary" : "text-foreground"
          )}>
            {isDragging ? "Drop file here" : "Click or drag file to upload"}
          </p>
          <p className="text-xs text-muted-foreground">
            Images, PDFs, or documents up to {maxSize}MB
          </p>
        </div>
      </button>
    </div>
  );
}
