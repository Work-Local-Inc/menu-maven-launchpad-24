import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import { Trash2, Plus } from "lucide-react";

interface Dish {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  display_order: number;
}

interface EditableDishesProps {
  data: Dish[];
  onChange: (dishes: Dish[]) => void;
}

export function EditableDishes({ data, onChange }: EditableDishesProps) {
  const [imageFiles, setImageFiles] = useState<{ [key: string]: File[] }>({});

  const addDish = () => {
    const newDish: Dish = {
      id: `temp_${Date.now()}`,
      name: '',
      description: '',
      display_order: data.length + 1
    };
    onChange([...data, newDish]);
  };

  const removeDish = (id: string) => {
    const updatedDishes = data.filter(dish => dish.id !== id);
    onChange(updatedDishes);
    
    // Clean up image files
    const newImageFiles = { ...imageFiles };
    delete newImageFiles[id];
    setImageFiles(newImageFiles);
  };

  const updateDish = (id: string, field: keyof Dish, value: string) => {
    const updatedDishes = data.map(dish =>
      dish.id === id ? { ...dish, [field]: value } : dish
    );
    onChange(updatedDishes);
  };

  const handleImageUpload = (dishId: string, files: File[]) => {
    setImageFiles(prev => ({
      ...prev,
      [dishId]: files
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Popular Dishes ({data.length})</h3>
        <Button onClick={addDish} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Dish
        </Button>
      </div>

      {data.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-muted-foreground">No dishes added yet. Click "Add Dish" to get started.</p>
        </div>
      )}

      <div className="space-y-4">
        {data.map((dish, index) => (
          <Card key={dish.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">Dish {index + 1}</CardTitle>
              {data.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeDish(dish.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`dish_name_${dish.id}`}>Dish Name *</Label>
                  <Input
                    id={`dish_name_${dish.id}`}
                    value={dish.name}
                    onChange={(e) => updateDish(dish.id, 'name', e.target.value)}
                    placeholder="e.g., Signature Burger"
                  />
                </div>
                <div>
                  <Label htmlFor={`dish_desc_${dish.id}`}>Description *</Label>
                  <Textarea
                    id={`dish_desc_${dish.id}`}
                    value={dish.description}
                    onChange={(e) => updateDish(dish.id, 'description', e.target.value)}
                    placeholder="Describe this delicious dish..."
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <Label>Dish Image</Label>
                <div className="mt-2">
                  {dish.image_url && !imageFiles[dish.id]?.length && (
                    <div className="mb-4">
                      <img 
                        src={dish.image_url} 
                        alt={dish.name}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <p className="text-sm text-muted-foreground mt-1">Current image</p>
                    </div>
                  )}
                  <ImageUpload
                    onUpload={(files) => handleImageUpload(dish.id, files)}
                    currentFiles={imageFiles[dish.id] || []}
                    maxFiles={1}
                    label="Upload dish image"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}