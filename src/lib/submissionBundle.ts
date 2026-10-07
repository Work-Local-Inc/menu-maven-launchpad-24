import { supabase } from "@/integrations/supabase/client";

export interface Faq { question: string; answer: string; source?: "faq_table" | "legacy_comments" }

/** Older submissions stored FAQs as "...comments\n\nFAQs:\n[json]" inside the comments field. */
export function splitLegacyFaqs(comments?: string | null): { comments: string; faqs: Faq[] } {
  if (!comments) return { comments: "", faqs: [] };
  const idx = comments.search(/(^|\n)FAQs:\s*\n?\s*\[/);
  if (idx === -1) return { comments, faqs: [] };
  const jsonStart = comments.indexOf("[", idx);
  try {
    const parsed = JSON.parse(comments.slice(jsonStart));
    if (!Array.isArray(parsed)) throw new Error();
    return {
      comments: comments.slice(0, idx).trim(),
      faqs: parsed
        .filter((f: any) => f && (f.question || f.answer))
        .map((f: any) => ({ question: String(f.question || ""), answer: String(f.answer || ""), source: "legacy_comments" as const })),
    };
  } catch {
    return { comments, faqs: [] };
  }
}

export interface SubmissionBundle {
  submission: any;
  dishes: any[];
  deals: any[];
  photos: any[];
  menus: any[];
  faqs: Faq[];
  /** comments with any legacy FAQ block removed */
  cleanComments: string;
}

export async function fetchSubmissionBundle(id: string): Promise<SubmissionBundle> {
  const { data, error } = await (supabase as any).rpc("restaurant_submission_bundle", { p_id: id });
  if (error) throw error;
  if (!data?.submission) throw new Error("Submission not found");
  const legacy = splitLegacyFaqs(data.submission.comments);
  const tableFaqs: Faq[] = (data.faqs || []).map((f: any) => ({ question: f.question, answer: f.answer, source: "faq_table" }));
  const seen = new Set(tableFaqs.map((f) => f.question.trim().toLowerCase()));
  const faqs = [...tableFaqs, ...legacy.faqs.filter((f) => !seen.has(f.question.trim().toLowerCase()))];
  return {
    submission: data.submission,
    dishes: data.dishes || [],
    deals: data.deals || [],
    photos: data.photos || [],
    menus: data.menus || [],
    faqs,
    cleanComments: legacy.comments,
  };
}

export function buildExport(b: SubmissionBundle) {
  const s = b.submission;
  const display = s.image_display || {};
  const fit = (k: string) => display[k] || "cover";
  return {
    restaurant: {
      id: s.id,
      name: s.restaurant_name,
      logo_url: s.logo_url,
      logo_fit: fit("logo"),
      hero_image_url: s.hero_image_url,
      hero_image_fit: fit("hero"),
      address: s.address,
      email: s.email,
      phone: s.phone,
      website: s.website,
      online_ordering_url: s.online_ordering_url,
      founded_year: s.founded_year,
      story: s.story,
      owner_quote: s.owner_quote,
      about_image_url: s.about_image_url,
      about_image_fit: fit("about"),
      menu_pdf_url: s.menu_pdf_url,
      status: s.status,
      created_at: s.created_at,
      updated_at: s.updated_at,
    },
    custom_sections: (s.custom_sections || []).map((c: any) => ({ ...c, image_fit: c.image_fit || "cover" })),
    operations: { hours: s.hours, delivery_areas: s.delivery_areas, delivery_instructions: s.delivery_instructions },
    social_media: { instagram: s.instagram, facebook: s.facebook, twitter: s.twitter },
    menus: b.menus.map((m) => ({
      name: m.menu_name,
      category: m.category === "custom" ? m.custom_category_name || "custom" : m.category,
      url: m.menu_url,
      file_type: /\.pdf($|\?)/i.test(m.menu_url) ? "pdf" : "image",
      display_order: m.display_order,
    })),
    popular_dishes: b.dishes.map((d) => ({ name: d.name, description: d.description, image_url: d.image_url, image_fit: d.image_fit || "cover", display_order: d.display_order })),
    deals: b.deals.map((d) => ({ title: d.title, description: d.description, image_url: d.image_url, image_fit: d.image_fit || "cover", display_order: d.display_order })),
    photos: b.photos.map((p) => ({ image_url: p.image_url, image_fit: p.image_fit || "cover", display_order: p.display_order })),
    faqs: b.faqs.map(({ question, answer }) => ({ question, answer })),
    additional_comments: b.cleanComments,
    integration_instructions: {
      branding: "Use restaurant.logo_url for brand logo placement throughout the site",
      hero_image: "Use restaurant.hero_image_url as the homepage banner (16:9)",
      ordering_platform: "Use restaurant.online_ordering_url for all 'Order Now' and 'View Menu' buttons",
      menu_display: "List every entry in menus[]; link each by name. menu_pdf_url is a legacy copy of the first menu",
      image_fit: "Every image has an *_fit / image_fit value. 'cover' = the client accepts cropping to fill the frame (object-fit: cover). 'contain' = show the whole image, never crop (object-fit: contain). Respect it.",
      faqs: "Render faqs[] as an FAQ section (accordion) and as FAQPage structured data",
      deals_promotion: "Feature deals prominently on homepage",
    },
    export_metadata: { exported_at: new Date().toISOString(), export_version: "1.2" },
  };
}
