import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ImageUpload";
import { Plus, X } from "lucide-react";

interface CustomSection {
  id: string;
  title: string;
  description: string;
  image: File | null;
  position: number;
}

interface AboutData {
  foundedYear: string;
  story: string;
  ownerQuote: string;
  aboutImage: File | null;
  customSections: CustomSection[];
}

interface AboutFormProps {
  data: AboutData;
  onChange: (data: AboutData) => void;
}

export function AboutForm({ data, onChange }: AboutFormProps) {
  const updateField = (field: keyof AboutData, value: string | File | null | CustomSection[]) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const handleImageUpload = (files: File[]) => {
    updateField('aboutImage', files[0] || null);
  };

  const addCustomSection = () => {
    const newSection: CustomSection = {
      id: `section-${Date.now()}`,
      title: "",
      description: "",
      image: null,
      position: data.customSections.length + 1
    };
    updateField('customSections', [...data.customSections, newSection]);
  };

  const removeCustomSection = (id: string) => {
    const updatedSections = data.customSections.filter(section => section.id !== id);
    updateField('customSections', updatedSections);
  };

  const updateCustomSection = (id: string, field: keyof CustomSection, value: any) => {
    const updatedSections = data.customSections.map(section =>
      section.id === id ? { ...section, [field]: value } : section
    );
    updateField('customSections', updatedSections);
  };

  const handleCustomSectionImageUpload = (id: string, files: File[]) => {
    updateCustomSection(id, 'image', files[0] || null);
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

      {/* Custom Sections */}
      <div className="pt-6 border-t">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Label className="text-base font-medium">Custom Sections</Label>
            <p className="text-sm text-muted-foreground">Add additional content sections to your About page</p>
          </div>
          <Button
            type="button"
            onClick={addCustomSection}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </Button>
        </div>

        {data.customSections.map((section, index) => (
          <Card key={section.id} className="p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Custom Section {index + 1}</h4>
              <Button
                type="button"
                onClick={() => removeCustomSection(section.id)}
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`section-title-${section.id}`} className="text-sm font-medium">
                    Section Title *
                  </Label>
                  <Input
                    id={`section-title-${section.id}`}
                    placeholder="e.g., Our Awards, Special Events"
                    value={section.title}
                    onChange={(e) => updateCustomSection(section.id, 'title', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`section-position-${section.id}`} className="text-sm font-medium">
                    Position on Page
                  </Label>
                  <Select
                    value={section.position.toString()}
                    onValueChange={(value) => updateCustomSection(section.id, 'position', parseInt(value))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose position" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((pos) => (
                        <SelectItem key={pos} value={pos.toString()}>
                          Position {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor={`section-description-${section.id}`} className="text-sm font-medium">
                  Description *
                </Label>
                <Textarea
                  id={`section-description-${section.id}`}
                  placeholder="Describe this section content..."
                  value={section.description}
                  onChange={(e) => updateCustomSection(section.id, 'description', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Section Image</Label>
                <p className="text-sm text-muted-foreground mb-2">JPG/PNG • Recommended 800×600px</p>
                <ImageUpload
                  onUpload={(files) => handleCustomSectionImageUpload(section.id, files)}
                  currentFiles={section.image ? [section.image] : []}
                  maxFiles={1}
                  label="Upload image for this section"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}