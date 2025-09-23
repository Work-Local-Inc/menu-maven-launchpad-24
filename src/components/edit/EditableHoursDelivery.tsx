import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface HoursDeliveryInfo {
  hours: string;
  delivery_areas: string;
  delivery_instructions?: string;
}

interface EditableHoursDeliveryProps {
  data: HoursDeliveryInfo;
  onChange: (field: keyof HoursDeliveryInfo, value: string) => void;
}

export function EditableHoursDelivery({ data, onChange }: EditableHoursDeliveryProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="hours">Hours of Operation *</Label>
        <Textarea
          id="hours"
          value={data.hours || ''}
          onChange={(e) => onChange('hours', e.target.value)}
          placeholder="Monday: 11:00 AM - 10:00 PM&#10;Tuesday: 11:00 AM - 10:00 PM&#10;..."
          rows={6}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Enter each day on a new line (e.g., "Monday: 11:00 AM - 10:00 PM")
        </p>
      </div>

      <div>
        <Label htmlFor="delivery_areas">Delivery Areas *</Label>
        <Textarea
          id="delivery_areas"
          value={data.delivery_areas || ''}
          onChange={(e) => onChange('delivery_areas', e.target.value)}
          placeholder="Downtown&#10;Uptown&#10;City Center&#10;..."
          rows={4}
        />
        <p className="text-sm text-muted-foreground mt-1">
          List areas you deliver to, one per line
        </p>
      </div>

      <div>
        <Label htmlFor="delivery_instructions">Delivery Instructions</Label>
        <Textarea
          id="delivery_instructions"
          value={data.delivery_instructions || ''}
          onChange={(e) => onChange('delivery_instructions', e.target.value)}
          placeholder="Special delivery instructions, minimum orders, fees, etc."
          rows={3}
        />
      </div>
    </div>
  );
}