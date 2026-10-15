import { ImageUpload } from "@/components/ImageUpload";
import { Label } from "@/components/ui/label";

interface PhotosFormProps {
  data: File[];
  onChange: (data: File[]) => void;
}

export function PhotosForm({ data, onChange }: PhotosFormProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          Optionally upload up to 10 photos of your restaurant, food, and atmosphere.
          These will be displayed throughout your website.
        </p>
      </div>

      <div>
        <Label className="text-base font-medium">
          Restaurant Photos (up to 10 images)
        </Label>
        <p className="text-sm text-muted-foreground mb-2">4:3 aspect ratio • 800×600px or larger • JPG/PNG</p>
        <div className="mt-2">
          <ImageUpload
            onUpload={onChange}
            currentFiles={data}
            maxFiles={10}
            label="Upload restaurant photos"
            fitKey="photos"
          />
        </div>
      </div>

      {data.length < 3 && (
        <div className="bg-accent/50 border border-accent rounded-lg p-4">
          <p className="text-sm text-center">
            No photos handy? You can skip this step.
          </p>
        </div>
      )}

      <div className="bg-accent/50 border border-accent rounded-lg p-4">
        <h4 className="font-medium mb-2">Photo Tips:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Include a mix of food photos, interior shots, and exterior views</li>
          <li>• Use good lighting - natural light works best for food photography</li>
          <li>• Show your restaurant's personality and atmosphere</li>
          <li>• Recommended: 4:3 aspect ratio at 800×600px for consistent gallery display</li>
          <li>• Avoid blurry or poorly lit photos</li>
        </ul>
      </div>
    </div>
  );
}
