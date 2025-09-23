import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import { Trash2, Plus } from "lucide-react";

interface Deal {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  display_order: number;
}

interface EditableDealsProps {
  data: Deal[];
  onChange: (deals: Deal[]) => void;
}

export function EditableDeals({ data, onChange }: EditableDealsProps) {
  const [imageFiles, setImageFiles] = useState<{ [key: string]: File[] }>({});

  const addDeal = () => {
    const newDeal: Deal = {
      id: `temp_${Date.now()}`,
      title: '',
      description: '',
      display_order: data.length + 1
    };
    onChange([...data, newDeal]);
  };

  const removeDeal = (id: string) => {
    const updatedDeals = data.filter(deal => deal.id !== id);
    onChange(updatedDeals);
    
    // Clean up image files
    const newImageFiles = { ...imageFiles };
    delete newImageFiles[id];
    setImageFiles(newImageFiles);
  };

  const updateDeal = (id: string, field: keyof Deal, value: string) => {
    const updatedDeals = data.map(deal =>
      deal.id === id ? { ...deal, [field]: value } : deal
    );
    onChange(updatedDeals);
  };

  const handleImageUpload = (dealId: string, files: File[]) => {
    setImageFiles(prev => ({
      ...prev,
      [dealId]: files
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Special Deals & Offers ({data.length})</h3>
        <Button onClick={addDeal} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Deal
        </Button>
      </div>

      {data.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-muted-foreground">No deals added yet. Click "Add Deal" to get started.</p>
        </div>
      )}

      <div className="space-y-4">
        {data.map((deal, index) => (
          <Card key={deal.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">Deal {index + 1}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeDeal(deal.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`deal_title_${deal.id}`}>Deal Title *</Label>
                  <Input
                    id={`deal_title_${deal.id}`}
                    value={deal.title}
                    onChange={(e) => updateDeal(deal.id, 'title', e.target.value)}
                    placeholder="e.g., Happy Hour Special"
                  />
                </div>
                <div>
                  <Label htmlFor={`deal_desc_${deal.id}`}>Description *</Label>
                  <Textarea
                    id={`deal_desc_${deal.id}`}
                    value={deal.description}
                    onChange={(e) => updateDeal(deal.id, 'description', e.target.value)}
                    placeholder="Describe this amazing deal..."
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <Label>Deal Image</Label>
                <div className="mt-2">
                  {deal.image_url && !imageFiles[deal.id]?.length && (
                    <div className="mb-4">
                      <img 
                        src={deal.image_url} 
                        alt={deal.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <p className="text-sm text-muted-foreground mt-1">Current image</p>
                    </div>
                  )}
                  <ImageUpload
                    onUpload={(files) => handleImageUpload(deal.id, files)}
                    currentFiles={imageFiles[deal.id] || []}
                    maxFiles={1}
                    label="Upload deal image"
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