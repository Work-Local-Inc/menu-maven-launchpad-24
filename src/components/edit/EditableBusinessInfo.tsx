import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Mail, Phone, Globe } from "lucide-react";

interface BusinessInfo {
  restaurant_name: string;
  address: string;
  email: string;
  phone?: string;
  website?: string;
  online_ordering_url?: string;
}

interface EditableBusinessInfoProps {
  data: BusinessInfo;
  onChange: (field: keyof BusinessInfo, value: string) => void;
}

export function EditableBusinessInfo({ data, onChange }: EditableBusinessInfoProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="restaurant_name">Restaurant Name *</Label>
        <Input
          id="restaurant_name"
          value={data.restaurant_name || ''}
          onChange={(e) => onChange('restaurant_name', e.target.value)}
          placeholder="Enter restaurant name"
        />
      </div>

      <div>
        <Label htmlFor="address">
          <MapPin className="w-4 h-4 inline mr-2" />
          Address *
        </Label>
        <Input
          id="address"
          value={data.address || ''}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="Enter full address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">
            <Mail className="w-4 h-4 inline mr-2" />
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            value={data.email || ''}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="restaurant@example.com"
          />
        </div>

        <div>
          <Label htmlFor="phone">
            <Phone className="w-4 h-4 inline mr-2" />
            Phone
          </Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone || ''}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="website">
            <Globe className="w-4 h-4 inline mr-2" />
            Website
          </Label>
          <Input
            id="website"
            type="url"
            value={data.website || ''}
            onChange={(e) => onChange('website', e.target.value)}
            placeholder="https://restaurant.com"
          />
        </div>

        <div>
          <Label htmlFor="online_ordering_url">Online Ordering URL</Label>
          <Input
            id="online_ordering_url"
            type="url"
            value={data.online_ordering_url || ''}
            onChange={(e) => onChange('online_ordering_url', e.target.value)}
            placeholder="https://order.restaurant.com"
          />
        </div>
      </div>
    </div>
  );
}