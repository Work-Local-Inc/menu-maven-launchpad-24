import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BusinessInfoData {
  name: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  onlineOrderingUrl: string;
}

interface BusinessInfoFormProps {
  data: BusinessInfoData;
  onChange: (data: BusinessInfoData) => void;
}

export function BusinessInfoForm({ data, onChange }: BusinessInfoFormProps) {
  const updateField = (field: keyof BusinessInfoData, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name" className="text-base font-medium">
            Restaurant Name *
          </Label>
          <Input
            id="name"
            placeholder="e.g., Tony's Pizza Palace"
            value={data.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="address" className="text-base font-medium">
            Full Address *
          </Label>
          <Input
            id="address"
            placeholder="123 Main St, City, State 12345"
            value={data.address}
            onChange={(e) => updateField('address', e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-base font-medium">
            Contact Email *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="contact@yourrestaurant.com"
            value={data.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-base font-medium">
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={data.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="website" className="text-base font-medium">
            Current Website
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="https://yourrestaurant.com"
            value={data.website}
            onChange={(e) => updateField('website', e.target.value)}
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Your restaurant's main website
          </p>
        </div>

        <div>
          <Label htmlFor="onlineOrderingUrl" className="text-base font-medium">
            Online Ordering Platform URL *
          </Label>
          <Input
            id="onlineOrderingUrl"
            type="url"
            placeholder="https://your-ordering-platform.com/restaurant"
            value={data.onlineOrderingUrl}
            onChange={(e) => updateField('onlineOrderingUrl', e.target.value)}
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            This URL will be used for all "Order Now" and "View Menu" buttons on your site
          </p>
        </div>
      </div>
    </div>
  );
}