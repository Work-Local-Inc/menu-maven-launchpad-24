import { useRef, useState } from "react";
import { Upload, FileText, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MenuItem {
  category: 'breakfast' | 'lunch' | 'dinner' | 'custom';
  customCategoryName?: string;
  name: string;
  file: File | null;
}

interface MenuUploadFormProps {
  data: MenuItem[];
  onChange: (data: MenuItem[]) => void;
}

export function MenuUploadForm({ data, onChange }: MenuUploadFormProps) {
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set([0]));

  const addNewMenu = () => {
    const newMenu: MenuItem = {
      category: 'lunch',
      name: '',
      file: null
    };
    const newData = [...data, newMenu];
    onChange(newData);
    setExpandedMenus(prev => new Set([...prev, newData.length - 1]));
  };

  const removeMenu = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const updateMenu = (index: number, updates: Partial<MenuItem>) => {
    const newData = [...data];
    newData[index] = { ...newData[index], ...updates };
    onChange(newData);
  };

  const handleFileSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/pdf' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      updateMenu(index, { file });
    }
  };

  const removeFile = (index: number) => {
    updateMenu(index, { file: null });
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  const getCategoryDisplayName = (menu: MenuItem) => {
    return menu.category === 'custom' ? menu.customCategoryName || 'Custom' : 
           menu.category.charAt(0).toUpperCase() + menu.category.slice(1);
  };

  // Initialize with one menu if data is empty
  if (data.length === 0) {
    onChange([{
      category: 'lunch',
      name: 'Main Menu',
      file: null
    }]);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          Upload your restaurant menus by category. You can add breakfast, lunch, dinner, or custom menus.
        </p>
      </div>

      <div className="space-y-4">
        {data.map((menu, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Menu {index + 1}: {getCategoryDisplayName(menu)}
                </CardTitle>
                {data.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMenu(index)}
                    className="text-destructive hover:text-destructive h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Category *</Label>
                  <Select 
                    value={menu.category} 
                    onValueChange={(value: 'breakfast' | 'lunch' | 'dinner' | 'custom') => 
                      updateMenu(index, { category: value, customCategoryName: value === 'custom' ? '' : undefined })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Menu Name *</Label>
                  <Input
                    value={menu.name}
                    onChange={(e) => updateMenu(index, { name: e.target.value })}
                    placeholder={menu.category === 'custom' ? 'e.g., Happy Hour Menu' : `${getCategoryDisplayName(menu)} Menu`}
                    className="mt-1"
                  />
                </div>
              </div>

              {menu.category === 'custom' && (
                <div>
                  <Label className="text-sm font-medium">Custom Category Name *</Label>
                  <Input
                    value={menu.customCategoryName || ''}
                    onChange={(e) => updateMenu(index, { customCategoryName: e.target.value })}
                    placeholder="e.g., Happy Hour, Desserts, Kids Menu"
                    className="mt-1"
                  />
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium">Menu File *</Label>
                
                {!menu.file ? (
                  <div className="mt-2 border-2 border-dashed border-border rounded-xl p-6 text-center">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <h4 className="text-base font-medium mb-2">Upload Menu File</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Select your menu file (PDF or JPG)
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRefs.current[index]?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      PDF or JPG files only. Max size: 10MB
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-6 h-6 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{menu.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(menu.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <input
                  ref={(el) => fileInputRefs.current[index] = el}
                  type="file"
                  accept=".pdf,.jpg,.jpeg"
                  onChange={(e) => handleFileSelect(index, e)}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button
          type="button"
          variant="outline"
          onClick={addNewMenu}
          className="border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Menu
        </Button>
      </div>

      <div className="bg-accent/50 border border-accent rounded-lg p-4 max-w-md mx-auto">
        <h4 className="font-medium mb-2">Menu Tips:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Make sure your PDFs are high quality and readable</li>
          <li>• Include prices if you'd like them displayed</li>
          <li>• Keep file sizes under 10MB for fast loading</li>
          <li>• You can update your menus anytime after launch</li>
          <li>• Consider separate menus for different meal times</li>
        </ul>
      </div>
    </div>
  );
}