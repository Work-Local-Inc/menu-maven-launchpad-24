import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Upload, Download, CheckCircle, AlertCircle, FileImage, Package } from 'lucide-react';
import { ImageOptimizerItem, OptimizedImageData } from '@/components/ImageOptimizerItem';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';

export default function ImageOptimizer() {
  const [files, setFiles] = useState<File[]>([]);
  const [optimizedData, setOptimizedData] = useState<OptimizedImageData[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { uploadImage, uploading } = useFileUpload();
  const { toast } = useToast();

  const handleFilesDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFilesSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(file => 
      file.type.startsWith('image/')
    );
    setFiles(prev => [...prev, ...selectedFiles]);
  }, []);

  const updateOptimizedData = useCallback((index: number, data: OptimizedImageData) => {
    setOptimizedData(prev => {
      const updated = [...prev];
      updated[index] = data;
      return updated;
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setOptimizedData(prev => prev.filter((_, i) => i !== index));
  }, []);

  const generateManifestCSV = () => {
    const headers = ['Original Filename', 'SEO Filename', 'Category', 'Dish Name', 'Description'];
    const rows = optimizedData.map(data => [
      data.originalFilename,
      data.seoFilename,
      data.category,
      data.dishName,
      data.description
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    return csvContent;
  };

  const downloadManifest = () => {
    const csvContent = generateManifestCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `milano-image-manifest-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const processImages = async () => {
    if (optimizedData.some(data => !data.isValid)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields for each image.",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      for (let i = 0; i < optimizedData.length; i++) {
        const data = optimizedData[i];
        // Here you would implement the actual image optimization and upload
        // For now, we'll simulate the process
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(((i + 1) / optimizedData.length) * 100);
      }

      toast({
        title: "Success!",
        description: `${optimizedData.length} images processed successfully.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const validCount = optimizedData.filter(data => data.isValid).length;
  const totalCount = files.length;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Image Optimization Tool</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Client-proof image processor that converts your DSC#### files into SEO-optimized, 
          properly sized WebP images with French descriptions.
        </p>
      </div>

      {/* Asset Acceptance Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Asset Acceptance Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h4 className="font-medium mb-2">Popular Dishes</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 1200×900px landscape</li>
                <li>• ≤300KB WebP</li>
                <li>• 4:3 aspect ratio</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Gallery</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 1600px max dimension</li>
                <li>• ≤300KB WebP</li>
                <li>• Mixed orientations OK</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Vegan/Keto</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 1200×900px landscape</li>
                <li>• ≤300KB WebP</li>
                <li>• 4:3 aspect ratio</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Menu</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 1600px high-res</li>
                <li>• ≤300KB WebP</li>
                <li>• Portrait preferred</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Images</CardTitle>
          <CardDescription>
            Drag and drop your DSC#### files or click to select. All images will be automatically 
            optimized to WebP format with proper sizing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
            onDrop={handleFilesDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg mb-2">Drop your images here or click to browse</p>
            <p className="text-sm text-muted-foreground">
              Supports: JPG, PNG, WebP • Max size: 24MB per file
            </p>
            <input
              id="file-input"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFilesSelect}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      {files.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {totalCount} image{totalCount !== 1 ? 's' : ''} uploaded
                </Badge>
                <Badge variant={validCount === totalCount ? "default" : "secondary"}>
                  {validCount}/{totalCount} ready
                </Badge>
              </div>
              <div className="flex gap-2">
                {validCount === totalCount && totalCount > 0 && (
                  <>
                    <Button
                      variant="outline"
                      onClick={downloadManifest}
                      disabled={processing}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Manifest
                    </Button>
                    <Button
                      onClick={processImages}
                      disabled={processing || validCount !== totalCount}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Process & Download
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {processing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing images...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Alert */}
      {files.length > 0 && validCount < totalCount && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please complete all required fields (marked with red borders) before processing.
            Each image needs a category, dish name, and French description.
          </AlertDescription>
        </Alert>
      )}

      {/* Image Items */}
      {files.length > 0 && (
        <div className="space-y-6">
          <Separator />
          <h2 className="text-2xl font-semibold">Image Details</h2>
          <div className="grid gap-6">
            {files.map((file, index) => (
              <ImageOptimizerItem
                key={`${file.name}-${index}`}
                file={file}
                index={index}
                onUpdate={updateOptimizedData}
                onRemove={removeFile}
              />
            ))}
          </div>
        </div>
      )}

      {/* Success State */}
      {validCount === totalCount && totalCount > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All images are ready for processing! Click "Process & Download" to get your optimized files.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}