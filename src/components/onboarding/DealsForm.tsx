import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

interface Deal {
  title: string;
  description: string;
  image: File | null;
}

interface DealsFormProps {
  data: Deal[];
  onChange: (data: Deal[]) => void;
}

export function DealsForm({ data, onChange }: DealsFormProps) {
  const addDeal = () => {
    if (data.length < 5) {
      onChange([...data, { title: "", description: "", image: null }]);
    }
  };

  const removeDeal = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateDeal = (index: number, field: keyof Deal, value: string | File | null) => {
    const updatedDeals = data.map((deal, i) => 
      i === index ? { ...deal, [field]: value } : deal
    );
    onChange(updatedDeals);
  };

  const handleImageUpload = (index: number, files: File[]) => {
    if (files.length > 0) {
      updateDeal(index, 'image', files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          Share your special offers and deals with customers. Add 2-5 deals to showcase what makes your restaurant special.
        </p>
      </div>

      {data.map((deal, index) => (
        <Card key={index} className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Deal #{index + 1}</CardTitle>
            {data.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeDeal(index)}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor={`deal-title-${index}`} className="text-base font-medium">
                Deal Title *
              </Label>
              <Input
                id={`deal-title-${index}`}
                placeholder="e.g., Buy One Get One Free Pizza"
                value={deal.title}
                onChange={(e) => updateDeal(index, 'title', e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor={`deal-description-${index}`} className="text-base font-medium">
                Description *
              </Label>
              <Textarea
                id={`deal-description-${index}`}
                placeholder="Describe the deal details, terms, and what makes it special..."
                value={deal.description}
                onChange={(e) => updateDeal(index, 'description', e.target.value)}
                className="mt-2 min-h-[100px]"
              />
            </div>

            <div>
              <Label className="text-base font-medium">Deal Image</Label>
              <p className="text-sm text-muted-foreground mb-2">4:3 aspect ratio recommended • 800×600px or larger • JPG/PNG</p>
              <div className="mt-2">
                <ImageUpload
                  onUpload={(files) => handleImageUpload(index, files)}
                  maxFiles={1}
                  currentFiles={deal.image ? [deal.image] : []}
                  label="Upload an image for this deal"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={addDeal}
          disabled={data.length >= 5}
          className="w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Deal ({data.length}/5)
        </Button>
      </div>

      {data.length < 2 && (
        <div className="text-center text-sm text-muted-foreground">
          Add at least 2 deals to continue
        </div>
      )}
    </div>
  );
}