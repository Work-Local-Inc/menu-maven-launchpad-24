import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sanitizeFilename, generateSEOFilename, getCategorySuggestions, getImageDimensions } from '@/utils/filenameUtils';

interface ImageOptimizerItemProps {
  file: File;
  index: number;
  language: 'en' | 'fr';
  onUpdate: (index: number, data: OptimizedImageData) => void;
  onRemove: (index: number) => void;
}

export interface OptimizedImageData {
  file: File;
  category: string;
  dishName: string;
  description: string;
  seoFilename: string;
  originalFilename: string;
  isValid: boolean;
  dimensions?: { width: number; height: number };
}

const categories = [
  { value: 'popular-dishes', label: 'Popular Dishes', sizing: '1200×900px landscape' },
  { value: 'gallery', label: 'Gallery', sizing: '1600px max, mixed orientations' },
  { value: 'deals', label: 'Deals', sizing: '1200×900px landscape' },
  { value: 'menu', label: 'Menu', sizing: '1600px high-res' },
];

export function ImageOptimizerItem({ file, index, language, onUpdate, onRemove }: ImageOptimizerItemProps) {
  const [category, setCategory] = useState('');
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [seoFilename, setSeoFilename] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>();

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    getImageDimensions(file).then(setDimensions).catch(console.error);
    
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (category && dishName) {
      const filename = generateSEOFilename(dishName, category);
      setSeoFilename(filename);
    }
  }, [category, dishName]);

  useEffect(() => {
    const isValid = !!(category && dishName.trim() && description.trim() && seoFilename);
    
    onUpdate(index, {
      file,
      category,
      dishName: dishName.trim(),
      description: description.trim(),
      seoFilename,
      originalFilename: file.name,
      isValid,
      dimensions
    });
  }, [category, dishName, description, seoFilename, file, index, onUpdate, dimensions]);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    
    // Auto-suggest dish name based on category
    const suggestions = getCategorySuggestions(value);
    if (suggestions.length > 0 && !dishName) {
      setDishName(suggestions[0].replace(/-/g, ' '));
    }
  };

  const getDescriptionTemplate = (cat: string) => {
    const templates = {
      en: {
        'popular-dishes': 'Enjoy our [dish] : [detailed description with ingredients]. Perfect for [context], available for dine-in, takeout, or delivery in Gatineau.',
        'gallery': 'Photo of [description] at Milano Pizza Gatineau.',
        'deals': 'Special deal at Milano Pizza Gatineau: [description]. Limited time offer for [context], available for dine-in, takeout, or delivery.',
        'menu': 'Complete Milano Pizza Gatineau menu [year].'
      },
      fr: {
        'popular-dishes': 'Savourez notre [plat] : [description détaillée avec ingrédients]. Parfait pour [contexte], disponible en salle, à emporter ou en livraison à Gatineau.',
        'gallery': 'Photo de [description] chez Milano Pizza Gatineau.',
        'deals': 'Offre spéciale chez Milano Pizza Gatineau : [description]. Promotion à durée limitée pour [contexte], disponible en salle, à emporter ou en livraison.',
        'menu': 'Menu complet Milano Pizza Gatineau [année].'
      }
    };
    return templates[language][cat as keyof typeof templates.en] || '';
  };

  const selectedCategory = categories.find(c => c.value === category);
  const isValid = !!(category && dishName.trim() && description.trim());

  return (
    <Card className={`relative ${isValid ? 'border-green-500' : 'border-red-500'}`}>
      <Button
        variant="outline"
        size="sm"
        className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full p-0"
        onClick={() => onRemove(index)}
      >
        <X className="h-3 w-3" />
      </Button>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preview */}
          <div className="space-y-2">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><strong>Original:</strong> {file.name}</p>
              <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              {dimensions && (
                <p><strong>Dimensions:</strong> {dimensions.width}×{dimensions.height}px</p>
              )}
              {seoFilename && (
                <p><strong>SEO Filename:</strong> {seoFilename}</p>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor={`category-${index}`}>Category *</Label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div>
                        <div>{cat.label}</div>
                        <div className="text-xs text-muted-foreground">{cat.sizing}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && (
                <Badge variant="outline" className="mt-1 text-xs">
                  Target: {selectedCategory.sizing}
                </Badge>
              )}
            </div>

            <div>
              <Label htmlFor={`dish-name-${index}`}>Dish/Item Name *</Label>
              <Input
                id={`dish-name-${index}`}
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="e.g., Poutine Poulet Buffalo"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use descriptive name, will be converted to SEO format
              </p>
            </div>

            <div>
              <Label htmlFor={`description-${index}`}>Description *</Label>
              <Textarea
                id={`description-${index}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={category ? getDescriptionTemplate(category) : `Enter ${language === 'fr' ? 'French' : 'English'} description...`}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Include ingredients, context, and location details
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}