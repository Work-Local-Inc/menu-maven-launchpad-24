import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AboutInfo {
  founded_year?: string;
  story: string;
  owner_quote?: string;
}

interface EditableAboutSectionProps {
  data: AboutInfo;
  onChange: (field: keyof AboutInfo, value: string) => void;
}

export function EditableAboutSection({ data, onChange }: EditableAboutSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="founded_year">Founded Year</Label>
        <Input
          id="founded_year"
          value={data.founded_year || ''}
          onChange={(e) => onChange('founded_year', e.target.value)}
          placeholder="e.g., 2010"
        />
      </div>

      <div>
        <Label htmlFor="story">Restaurant Story *</Label>
        <Textarea
          id="story"
          value={data.story || ''}
          onChange={(e) => onChange('story', e.target.value)}
          placeholder="Tell the story of your restaurant..."
          rows={6}
        />
      </div>

      <div>
        <Label htmlFor="owner_quote">Owner Quote</Label>
        <Textarea
          id="owner_quote"
          value={data.owner_quote || ''}
          onChange={(e) => onChange('owner_quote', e.target.value)}
          placeholder="A memorable quote from the owner..."
          rows={3}
        />
      </div>
    </div>
  );
}