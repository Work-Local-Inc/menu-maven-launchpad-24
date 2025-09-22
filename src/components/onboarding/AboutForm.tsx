import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";

interface AboutData {
  foundedYear: string;
  story: string;
  ownerQuote: string;
  aboutImage: File | null;
}

interface AboutFormProps {
  data: AboutData;
  onChange: (data: AboutData) => void;
}

export function AboutForm({ data, onChange }: AboutFormProps) {
  const updateField = (field: keyof AboutData, value: string | File | null) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const handleImageUpload = (files: File[]) => {
    updateField('aboutImage', files[0] || null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="foundedYear" className="text-base font-medium">
            Year Founded *
          </Label>
          <Input
            id="foundedYear"
            placeholder="e.g., 1985"
            value={data.foundedYear}
            onChange={(e) => updateField('foundedYear', e.target.value)}
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="story" className="text-base font-medium">
          Restaurant Story *
        </Label>
        <Textarea
          id="story"
          placeholder="Tell us about your restaurant's history, what makes it special, your cuisine style, family traditions, etc. This will be featured prominently on your website."
          value={data.story}
          onChange={(e) => updateField('story', e.target.value)}
          className="mt-2 min-h-32"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Share what makes your restaurant unique - your story, traditions, or culinary philosophy
        </p>
      </div>

      <div>
        <Label htmlFor="ownerQuote" className="text-base font-medium">
          Owner/Chef Quote
        </Label>
        <Textarea
          id="ownerQuote"
          placeholder="A personal message from the owner or chef (optional but recommended)"
          value={data.ownerQuote}
          onChange={(e) => updateField('ownerQuote', e.target.value)}
          className="mt-2"
        />
        <p className="text-sm text-muted-foreground mt-1">
          A personal touch from the owner or head chef adds authenticity
        </p>
      </div>

      <div>
        <Label className="text-base font-medium">
          About Section Image *
        </Label>
        <p className="text-sm text-muted-foreground mb-2">Portrait or landscape • 800×1200px (portrait) or 1200×800px (landscape) • JPG/PNG</p>
        <div className="mt-2">
          <ImageUpload
            onUpload={handleImageUpload}
            currentFiles={data.aboutImage ? [data.aboutImage] : []}
            maxFiles={1}
            label="Upload an image for your About section"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          A photo of the restaurant, owner, or signature dish that represents your story
        </p>
      </div>
    </div>
  );
}