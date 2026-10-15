import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DeliveryHoursData {
  deliveryAreas: string;
  instructions: string;
  hours: string;
}

interface DeliveryHoursFormProps {
  data: DeliveryHoursData;
  onChange: (data: DeliveryHoursData) => void;
}

export function DeliveryHoursForm({ data, onChange }: DeliveryHoursFormProps) {
  const updateField = (field: keyof DeliveryHoursData, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="deliveryAreas" className="text-base font-medium">
          Delivery Areas
        </Label>
        <Textarea
          id="deliveryAreas"
          placeholder="List postal codes, neighborhoods, or areas you deliver to. Example: 10001, 10002, 10003 or Downtown, Midtown, Upper East Side"
          value={data.deliveryAreas}
          onChange={(e) => updateField('deliveryAreas', e.target.value)}
          className="mt-2"
        />
        <p className="text-sm text-muted-foreground mt-1">
          List all areas you serve for delivery and pickup
        </p>
      </div>

      <div>
        <Label htmlFor="instructions" className="text-base font-medium">
          Pickup & Delivery Instructions
        </Label>
        <Textarea
          id="instructions"
          placeholder="Any special instructions for pickup or delivery? Parking info, entrance details, delivery fees, minimum orders, etc."
          value={data.instructions}
          onChange={(e) => updateField('instructions', e.target.value)}
          className="mt-2"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Help customers know what to expect when ordering
        </p>
      </div>

      <div>
        <Label htmlFor="hours" className="text-base font-medium">
          Hours of Operation
        </Label>
        <Textarea
          id="hours"
          placeholder="Monday: 11AM - 10PM&#10;Tuesday: 11AM - 10PM&#10;Wednesday: 11AM - 10PM&#10;Thursday: 11AM - 11PM&#10;Friday: 11AM - 11PM&#10;Saturday: 12PM - 11PM&#10;Sunday: 12PM - 9PM"
          value={data.hours}
          onChange={(e) => updateField('hours', e.target.value)}
          className="mt-2 min-h-32"
        />
        <p className="text-sm text-muted-foreground mt-1">
          List your hours for each day of the week
        </p>
      </div>

      <div className="bg-accent/50 border border-accent rounded-lg p-4">
        <h4 className="font-medium mb-2">Pro Tips:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Be specific about delivery areas to set clear expectations</li>
          <li>• Include any delivery fees or minimum order amounts</li>
          <li>• Mention if hours differ for pickup vs delivery</li>
          <li>• Note any special holiday hours or seasonal changes</li>
        </ul>
      </div>
    </div>
  );
}