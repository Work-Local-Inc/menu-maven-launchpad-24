import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface FontSelectionData {
  titleFont: string;
  paragraphFont: string;
}

interface FontSelectionFormProps {
  data: FontSelectionData;
  onChange: (data: FontSelectionData) => void;
}

const POPULAR_FONTS = [
  { name: "Inter", category: "Sans-serif", description: "Modern and clean" },
  { name: "Playfair Display", category: "Serif", description: "Elegant and sophisticated" },
  { name: "Montserrat", category: "Sans-serif", description: "Versatile and friendly" },
  { name: "Lora", category: "Serif", description: "Classic and readable" },
  { name: "Open Sans", category: "Sans-serif", description: "Professional and clear" },
  { name: "Poppins", category: "Sans-serif", description: "Rounded and approachable" },
  { name: "Merriweather", category: "Serif", description: "Traditional and trustworthy" },
  { name: "Roboto", category: "Sans-serif", description: "Simple and reliable" },
  { name: "Source Sans Pro", category: "Sans-serif", description: "Corporate and clean" },
  { name: "Crimson Text", category: "Serif", description: "Bookish and refined" }
];

export function FontSelectionForm({ data, onChange }: FontSelectionFormProps) {
  const updateField = (field: keyof FontSelectionData, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const getFontStyle = (fontName: string) => ({
    fontFamily: `"${fontName}", system-ui, -apple-system, sans-serif`
  });

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Choose Your Website Fonts</h3>
        <p className="text-muted-foreground">
          Select fonts that match your restaurant's personality. These will be used throughout your website.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Title Font</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Used for headings, restaurant name, and section titles
              </p>
              <Select
                value={data.titleFont}
                onValueChange={(value) => updateField('titleFont', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a title font" />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_FONTS.map((font) => (
                    <SelectItem key={font.name} value={font.name}>
                      <div className="flex flex-col">
                        <span style={getFontStyle(font.name)} className="text-base">
                          {font.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {font.category} • {font.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {data.titleFont && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <h2 style={getFontStyle(data.titleFont)} className="text-2xl font-bold">
                  Your Restaurant Name
                </h2>
                <h3 style={getFontStyle(data.titleFont)} className="text-lg font-semibold mt-2">
                  Popular Dishes
                </h3>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Paragraph Font</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Used for descriptions, stories, and body text
              </p>
              <Select
                value={data.paragraphFont}
                onValueChange={(value) => updateField('paragraphFont', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a paragraph font" />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_FONTS.map((font) => (
                    <SelectItem key={font.name} value={font.name}>
                      <div className="flex flex-col">
                        <span style={getFontStyle(font.name)} className="text-base">
                          {font.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {font.category} • {font.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {data.paragraphFont && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <p style={getFontStyle(data.paragraphFont)} className="text-base">
                  Welcome to our family restaurant! We've been serving authentic, homemade dishes 
                  for over 20 years. Our story began with traditional recipes passed down through 
                  generations, and today we continue to create memorable dining experiences.
                </p>
              </div>
            )}
          </div>
        </Card>

        {data.titleFont && data.paragraphFont && (
          <Card className="p-6 bg-accent/50">
            <h3 className="text-lg font-medium mb-4">Combined Preview</h3>
            <div className="space-y-3">
              <h1 style={getFontStyle(data.titleFont)} className="text-3xl font-bold">
                Bella Italia Restaurant
              </h1>
              <p style={getFontStyle(data.paragraphFont)} className="text-base">
                Experience authentic Italian cuisine in the heart of downtown. Our passion for 
                traditional recipes and fresh ingredients creates an unforgettable dining experience.
              </p>
              <h2 style={getFontStyle(data.titleFont)} className="text-xl font-semibold mt-4">
                Our Story
              </h2>
              <p style={getFontStyle(data.paragraphFont)} className="text-base">
                Founded in 1985 by the Rossi family, we bring you the true taste of Italy with 
                every dish carefully crafted using time-honored techniques and the finest ingredients.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}