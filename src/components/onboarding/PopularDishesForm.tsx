import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PopularDish {
  name: string;
  description: string;
  image: File | null;
}

interface PopularDishesFormProps {
  data: PopularDish[];
  onChange: (data: PopularDish[]) => void;
}

export function PopularDishesForm({ data, onChange }: PopularDishesFormProps) {
  const addDish = () => {
    if (data.length < 6) {
      onChange([
        ...data,
        { name: "", description: "", image: null }
      ]);
    }
  };

  const removeDish = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateDish = (index: number, field: keyof PopularDish, value: string | File | null) => {
    const updated = data.map((dish, i) => 
      i === index ? { ...dish, [field]: value } : dish
    );
    onChange(updated);
  };

  const handleImageUpload = (index: number, files: File[]) => {
    updateDish(index, 'image', files[0] || null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          Add 3-6 of your most popular dishes. These will be showcased prominently on your website.
        </p>
      </div>

      <div className="grid gap-6">
        {data.map((dish, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Dish #{index + 1}</CardTitle>
              {data.length > 3 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDish(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-medium">
                    Dish Name *
                  </Label>
                  <Input
                    placeholder="e.g., Margherita Pizza"
                    value={dish.name}
                    onChange={(e) => updateDish(index, 'name', e.target.value)}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label className="text-base font-medium">
                    Dish Image *
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">Square format preferred • 800×800px or larger • JPG/PNG</p>
                  <div className="mt-2">
                    <ImageUpload
                      onUpload={(files) => handleImageUpload(index, files)}
                      currentFiles={dish.image ? [dish.image] : []}
                      maxFiles={1}
                      label="Upload dish photo"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Recommended size: Landscape 4:3 ratio (min. 1200×900px)
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">
                  Description *
                </Label>
                <Textarea
                  placeholder="Describe the dish, ingredients, what makes it special..."
                  value={dish.description}
                  onChange={(e) => updateDish(index, 'description', e.target.value)}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.length < 6 && (
        <div className="text-center">
          <Button
            type="button"
            variant="outline"
            onClick={addDish}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Dish ({data.length}/6)
          </Button>
        </div>
      )}

      {data.length < 3 && (
        <div className="bg-accent/50 border border-accent rounded-lg p-4">
          <p className="text-sm text-center">
            Please add at least 3 popular dishes to showcase on your website.
          </p>
        </div>
      )}
    </div>
  );
}