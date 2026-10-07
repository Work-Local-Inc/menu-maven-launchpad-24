import { AlertTriangle, CheckCircle2, FileText, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { RestaurantData } from "@/pages/RestaurantOnboarding";
import { fitLabel } from "@/lib/imageFit";

interface ReviewStepProps {
  data: RestaurantData;
  onEdit: (step: number) => void;
  onRemovalsChange?: (removals: string[]) => void;
}

const fmt = (f: File) => `${f.name} • ${(f.size / 1024 / 1024).toFixed(2)} MB`;

export function getMissingItems(d: RestaurantData) {
  const m: { label: string; step: number }[] = [];
  if (!d.businessInfo.name) m.push({ label: "Restaurant name", step: 0 });
  if (!d.businessInfo.email) m.push({ label: "Contact email", step: 0 });
  if (!d.businessInfo.address) m.push({ label: "Address", step: 0 });
  if (!d.businessInfo.logo) m.push({ label: "Logo", step: 0 });
  if (!d.businessInfo.heroImage) m.push({ label: "Hero banner image", step: 0 });
  if (!d.about.story) m.push({ label: "Restaurant story", step: 1 });
  d.popularDishes.forEach((x, i) => { if (!x.image) m.push({ label: `Photo for dish "${x.name || i + 1}"`, step: 2 }); });
  d.deals.forEach((x, i) => { if (!x.image) m.push({ label: `Image for deal "${x.title || i + 1}"`, step: 3 }); });
  if (!d.menus.some((x) => x.file)) m.push({ label: "At least one menu file", step: 4 });
  d.menus.forEach((x, i) => { if (!x.file) m.push({ label: `File for menu "${x.name || i + 1}"`, step: 4 }); });
  if (!d.deliveryHours.hours) m.push({ label: "Opening hours", step: 5 });
  if (d.photos.length < 3) m.push({ label: `Gallery photos (${d.photos.length}/3 minimum)`, step: 6 });
  d.faqs.forEach((x, i) => { if (!x.question || !x.answer) m.push({ label: `FAQ #${i + 1} is incomplete`, step: 8 }); });
  return m;
}

function Section({ title, step, onEdit, children }: { title: string; step: number; onEdit: (s: number) => void; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(step)}>
          <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
        </Button>
      </div>
      <div className="text-sm space-y-1.5">{children}</div>
    </Card>
  );
}

const Row = ({ k, v }: { k: string; v?: string | null }) => (
  <div className="grid grid-cols-3 gap-2">
    <span className="text-muted-foreground">{k}</span>
    <span className="col-span-2 break-words">{v ? v : <span className="text-destructive">Not provided</span>}</span>
  </div>
);

const FileRow = ({ k, f, fit }: { k: string; f: File | null; fit?: string }) => (
  <div className="grid grid-cols-3 gap-2 items-center">
    <span className="text-muted-foreground">{k}</span>
    <span className="col-span-2 flex items-center gap-2">
      {f ? (
        <>
          {f.type.startsWith("image/") ? (
            <img src={URL.createObjectURL(f)} alt="" className="w-10 h-10 rounded object-cover" />
          ) : (
            <FileText className="w-5 h-5 text-primary" />
          )}
          <span className="truncate">{fmt(f)}</span>
          {fit && f.type.startsWith("image/") && (
            <span className="shrink-0 text-xs rounded-full border px-2 py-0.5 text-muted-foreground">{fitLabel(fit)}</span>
          )}
        </>
      ) : (
        <span className="text-destructive">No file</span>
      )}
    </span>
  </div>
);

export function ReviewStep({ data, onEdit, onRemovalsChange }: ReviewStepProps) {
  const fit = (k: string) => data.imageFits[k] || "cover";
  const b = data.businessInfo, a = data.about, dh = data.deliveryHours, so = data.social;
  const removable: { key: string; label: string; empty: boolean }[] = [
    { key: "phone", label: "Phone", empty: !b.phone },
    { key: "website", label: "Website", empty: !b.website },
    { key: "online_ordering_url", label: "Online ordering link", empty: !b.onlineOrderingUrl },
    { key: "logo_url", label: "Logo", empty: !b.logo },
    { key: "hero_image_url", label: "Hero banner", empty: !b.heroImage },
    { key: "founded_year", label: "Year founded", empty: !a.foundedYear },
    { key: "owner_quote", label: "Owner quote", empty: !a.ownerQuote },
    { key: "about_image_url", label: "About image", empty: !a.aboutImage },
    { key: "custom_sections", label: "Custom sections", empty: a.customSections.length === 0 },
    { key: "dishes", label: "All popular dishes", empty: data.popularDishes.length === 0 },
    { key: "deals", label: "All deals", empty: data.deals.length === 0 },
    { key: "menus", label: "All menus", empty: !data.menus.some((m) => m.file) },
    { key: "delivery_instructions", label: "Delivery instructions", empty: !dh.instructions },
    { key: "photos", label: "All gallery photos", empty: data.photos.length === 0 },
    { key: "faqs", label: "All FAQs", empty: data.faqs.length === 0 },
    { key: "instagram", label: "Instagram", empty: !so.instagram },
    { key: "facebook", label: "Facebook", empty: !so.facebook },
    { key: "twitter", label: "Twitter", empty: !so.twitter },
    { key: "comments", label: "Comments", empty: !so.comments },
  ].filter((r) => r.empty);
  const toggleRemoval = (key: string, on: boolean) =>
    onRemovalsChange?.(on ? [...data.removals, key] : data.removals.filter((k) => k !== key));
  const missing = getMissingItems(data);
  const fileCount =
    [data.businessInfo.logo, data.businessInfo.heroImage, data.about.aboutImage].filter(Boolean).length +
    data.about.customSections.filter((s) => s.image).length +
    data.popularDishes.filter((x) => x.image).length +
    data.deals.filter((x) => x.image).length +
    data.menus.filter((x) => x.file).length +
    data.photos.length;

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground">
        This is exactly what our website builder will receive — {fileCount} file{fileCount === 1 ? "" : "s"} in total.
      </p>

      {missing.length > 0 ? (
        <Card className="p-4 border-destructive/40 bg-destructive/5">
          <div className="flex items-center gap-2 font-medium mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" /> {missing.length} thing{missing.length === 1 ? "" : "s"} missing
          </div>
          <ul className="text-sm space-y-1">
            {missing.map((m, i) => (
              <li key={i}>
                <button type="button" className="underline underline-offset-2 hover:text-primary" onClick={() => onEdit(m.step)}>
                  {m.label}
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-2">You can still submit, but the builder may have to come back to you.</p>
        </Card>
      ) : (
        <Card className="p-4 border-primary/40 bg-primary/5 flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-primary" /> Everything looks complete.
        </Card>
      )}

      <Section title="Business Info" step={0} onEdit={onEdit}>
        <Row k="Name" v={data.businessInfo.name} />
        <Row k="Address" v={data.businessInfo.address} />
        <Row k="Email" v={data.businessInfo.email} />
        <Row k="Phone" v={data.businessInfo.phone} />
        <Row k="Website" v={data.businessInfo.website} />
        <Row k="Online ordering" v={data.businessInfo.onlineOrderingUrl} />
        <FileRow k="Logo" f={data.businessInfo.logo} fit={fit("logo")} />
        <FileRow k="Hero banner" f={data.businessInfo.heroImage} fit={fit("hero")} />
      </Section>

      <Section title="About Us" step={1} onEdit={onEdit}>
        <Row k="Founded" v={data.about.foundedYear} />
        <Row k="Story" v={data.about.story} />
        <Row k="Owner quote" v={data.about.ownerQuote} />
        <FileRow k="About image" f={data.about.aboutImage} fit={fit("about")} />
        {data.about.customSections.map((s) => (
          <FileRow key={s.id} k={`Section: ${s.title || "Untitled"} (pos. ${s.position})`} f={s.image} fit={fit(`section:${s.id}`)} />
        ))}
      </Section>

      <Section title={`Popular Dishes (${data.popularDishes.length})`} step={2} onEdit={onEdit}>
        {data.popularDishes.length === 0 && <p className="text-muted-foreground">None added</p>}
        {data.popularDishes.map((x, i) => <FileRow key={i} k={x.name || `Dish ${i + 1}`} f={x.image} fit={fit(`dish:${i}`)} />)}
      </Section>

      <Section title={`Deals (${data.deals.length})`} step={3} onEdit={onEdit}>
        {data.deals.length === 0 && <p className="text-muted-foreground">None added</p>}
        {data.deals.map((x, i) => <FileRow key={i} k={x.title || `Deal ${i + 1}`} f={x.image} fit={fit(`deal:${i}`)} />)}
      </Section>

      <Section title={`Menus (${data.menus.length})`} step={4} onEdit={onEdit}>
        {data.menus.map((x, i) => (
          <FileRow key={i} k={`${x.name || "Unnamed"} (${x.category === "custom" ? x.customCategoryName || "Custom" : x.category})`} f={x.file} />
        ))}
      </Section>

      <Section title="Delivery & Hours" step={5} onEdit={onEdit}>
        <Row k="Hours" v={data.deliveryHours.hours} />
        <Row k="Delivery areas" v={data.deliveryHours.deliveryAreas} />
        <Row k="Instructions" v={data.deliveryHours.instructions} />
      </Section>

      <Section title={`Gallery Photos (${data.photos.length})`} step={6} onEdit={onEdit}>
        {data.photos.length === 0 && <p className="text-muted-foreground">None added</p>}
        {data.photos.map((f, i) => <FileRow key={i} k={`Photo ${i + 1}`} f={f} fit={fit("photos")} />)}
      </Section>

      <Section title="Fonts" step={7} onEdit={onEdit}>
        <Row k="Title font" v={data.fonts.titleFont} />
        <Row k="Paragraph font" v={data.fonts.paragraphFont} />
      </Section>

      <Section title={`FAQs (${data.faqs.length})`} step={8} onEdit={onEdit}>
        {data.faqs.length === 0 && <p className="text-muted-foreground">None added</p>}
        {data.faqs.map((f, i) => (
          <div key={i}>
            <p className="font-medium">{f.question || <span className="text-destructive">Missing question</span>}</p>
            <p className="text-muted-foreground">{f.answer || <span className="text-destructive">Missing answer</span>}</p>
          </div>
        ))}
      </Section>

      <Section title="Social & Extras" step={9} onEdit={onEdit}>
        <Row k="Instagram" v={data.social.instagram} />
        <Row k="Facebook" v={data.social.facebook} />
        <Row k="Twitter" v={data.social.twitter} />
        <Row k="Comments" v={data.social.comments} />
      </Section>
      {onRemovalsChange && removable.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold">Updating a restaurant we already have?</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            Anything you left blank stays exactly as it was. Tick an item only if you want it <strong>removed</strong> from your existing details.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {removable.map((r) => (
              <label key={r.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={data.removals.includes(r.key)} onCheckedChange={(v) => toggleRemoval(r.key, !!v)} />
                Remove {r.label.toLowerCase()}
              </label>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
