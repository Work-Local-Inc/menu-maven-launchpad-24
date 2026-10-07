import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  currentFiles?: File[];
  className?: string;
  label?: string;
  /** CSS aspect ratio of the frame the image will be shown in, e.g. "4/3" */
  aspect?: string;
}

export function ImageUpload({ 
  onUpload, 
  maxFiles = 1, 
  currentFiles = [], 
  className,
  label = "Upload Images",
  aspect = "4/3",
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fit, setFit] = useState<"cover" | "contain">("cover");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      const newFiles = [...currentFiles, ...files].slice(0, maxFiles);
      onUpload(newFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      file => file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      const newFiles = [...currentFiles, ...files].slice(0, maxFiles);
      onUpload(newFiles);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = currentFiles.filter((_, i) => i !== index);
    onUpload(newFiles);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
          dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          currentFiles.length >= maxFiles && "opacity-50 pointer-events-none"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">{label}</p>
        <p className="text-muted-foreground mb-4">
          Drag & drop images here, or click to select
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={currentFiles.length >= maxFiles}
        >
          <Upload className="w-4 h-4 mr-2" />
          Select Files
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          {currentFiles.length}/{maxFiles} files selected • Images automatically optimized for web
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {currentFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Preview on your site:</span>
            <Button type="button" size="sm" variant={fit === "cover" ? "default" : "outline"} className="h-7 text-xs" onClick={() => setFit("cover")}>
              Cropping allowed
            </Button>
            <Button type="button" size="sm" variant={fit === "contain" ? "default" : "outline"} className="h-7 text-xs" onClick={() => setFit("contain")}>
              Show full image
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {fit === "cover"
              ? `Edges may be trimmed to fill ${aspect === "auto" ? "flexible" : aspect.replace("/", ":")} frame — keep the important part centred.`
              : `The whole photo is shown inside ${aspect === "auto" ? "flexible" : aspect.replace("/", ":")} frame — empty bars may appear.`}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {currentFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center" style={{ aspectRatio: aspect }}>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className={cn("w-full h-full", fit === "cover" ? "object-cover" : "object-contain")}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}