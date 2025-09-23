import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SocialMediaInfo {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  comments?: string;
}

interface EditableSocialMediaProps {
  data: SocialMediaInfo;
  onChange: (field: keyof SocialMediaInfo, value: string) => void;
}

export function EditableSocialMedia({ data, onChange }: EditableSocialMediaProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="instagram">Instagram</Label>
          <Input
            id="instagram"
            value={data.instagram || ''}
            onChange={(e) => onChange('instagram', e.target.value)}
            placeholder="@restaurant_name or full URL"
          />
        </div>

        <div>
          <Label htmlFor="facebook">Facebook</Label>
          <Input
            id="facebook"
            value={data.facebook || ''}
            onChange={(e) => onChange('facebook', e.target.value)}
            placeholder="Facebook page URL or handle"
          />
        </div>

        <div>
          <Label htmlFor="twitter">Twitter</Label>
          <Input
            id="twitter"
            value={data.twitter || ''}
            onChange={(e) => onChange('twitter', e.target.value)}
            placeholder="@twitter_handle or full URL"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="comments">Additional Comments</Label>
        <Textarea
          id="comments"
          value={data.comments || ''}
          onChange={(e) => onChange('comments', e.target.value)}
          placeholder="Any additional information or special requests..."
          rows={4}
        />
      </div>
    </div>
  );
}