import { useRef } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface MenuUploadFormProps {
  data: File | null;
  onChange: (data: File | null) => void;
}

export function MenuUploadForm({ data, onChange }: MenuUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/pdf' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      onChange(file);
    }
  };

  const removeFile = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          Upload your complete menu as a PDF. This will be available for download on your website.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <Label className="text-base font-medium">
          Menu File *
        </Label>
        
        {!data ? (
          <div className="mt-2 border-2 border-dashed border-border rounded-xl p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Your Menu</h3>
            <p className="text-muted-foreground mb-4">
              Select your menu file (PDF or JPG)
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Menu File
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              PDF or JPG files only. Max size: 10MB
            </p>
          </div>
        ) : (
          <div className="mt-2 border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">{data.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(data.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="bg-accent/50 border border-accent rounded-lg p-4 max-w-md mx-auto">
        <h4 className="font-medium mb-2">Menu Tips:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Make sure your PDF is high quality and readable</li>
          <li>• Include prices if you'd like them displayed</li>
          <li>• Keep file size under 10MB for fast loading</li>
          <li>• You can update your menu anytime after launch</li>
        </ul>
      </div>
    </div>
  );
}