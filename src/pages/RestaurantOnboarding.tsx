import { useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { BusinessInfoForm } from "@/components/onboarding/BusinessInfoForm";
import { AboutForm } from "@/components/onboarding/AboutForm";
import { PopularDishesForm } from "@/components/onboarding/PopularDishesForm";
import { DealsForm } from "@/components/onboarding/DealsForm";
import { MenuUploadForm } from "@/components/onboarding/MenuUploadForm";
import { DeliveryHoursForm } from "@/components/onboarding/DeliveryHoursForm";
import { PhotosForm } from "@/components/onboarding/PhotosForm";
import { SocialForm } from "@/components/onboarding/SocialForm";
import { FontSelectionForm } from "@/components/onboarding/FontSelectionForm";
import { FaqForm } from "@/components/onboarding/FaqForm";
import { ReviewStep } from "@/components/onboarding/ReviewStep";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Printer, Pencil } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import heroImage from "@/assets/hero-bg.jpg";
const menuLogo = "https://i.imgur.com/AYyrnpP.png";
import { supabase } from "@/integrations/supabase/client";
import { useFileUpload } from "@/hooks/useFileUpload";
import { ImageFitContext, type ImageFit } from "@/lib/imageFit";

export interface RestaurantData {
  businessInfo: {
    name: string;
    address: string;
    email: string;
    phone: string;
    website: string;
    onlineOrderingUrl: string;
    logo: File | null;
    heroImage: File | null;
  };
  about: {
    foundedYear: string;
    story: string;
    ownerQuote: string;
    aboutImage: File | null;
    customSections: Array<{
      id: string;
      title: string;
      description: string;
      image: File | null;
      position: number;
    }>;
  };
  popularDishes: Array<{
    name: string;
    description: string;
    image: File | null;
  }>;
  deals: Array<{
    title: string;
    description: string;
    image: File | null;
  }>;
  menus: Array<{
    category: 'breakfast' | 'lunch' | 'dinner' | 'custom';
    customCategoryName?: string;
    name: string;
    file: File | null;
  }>;
  deliveryHours: {
    deliveryAreas: string;
    instructions: string;
    hours: string;
  };
  photos: File[];
  social: {
    instagram: string;
    facebook: string;
    twitter: string;
    comments: string;
  };
  fonts: {
    titleFont: string;
    paragraphFont: string;
  };
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  /** Crop preference per image slot: logo, hero, about, section:<id>, dish:<i>, deal:<i>, photos */
  imageFits: Record<string, ImageFit>;
  /** Things to clear on the existing record when updating (instead of leaving unchanged) */
  removals: string[];
}

const initialData: RestaurantData = {
  businessInfo: {
    name: "",
    address: "",
    email: "",
    phone: "",
    website: "",
    onlineOrderingUrl: "",
    logo: null,
    heroImage: null,
  },
  about: {
    foundedYear: "",
    story: "",
    ownerQuote: "",
    aboutImage: null,
    customSections: [],
  },
  popularDishes: [],
  deals: [],
  menus: [],
  deliveryHours: {
    deliveryAreas: "",
    instructions: "",
    hours: "",
  },
  photos: [],
  social: {
    instagram: "",
    facebook: "",
    twitter: "",
    comments: "",
  },
  fonts: {
    titleFont: "",
    paragraphFont: "",
  },
  faqs: [],
  imageFits: {},
  removals: [],
};

const steps = [
  "Business Info",
  "About Us", 
  "Popular Dishes",
  "Deals & Offers",
  "Menu Upload",
  "Delivery & Hours",
  "Photos",
  "Fonts & Style",
  "FAQs",
  "Social & Extras",
  "Review & Submit"
];

export default function RestaurantOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<RestaurantData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicate, setDuplicate] = useState<{ id: string; restaurant_name: string; created_at: string } | null>(null);
  const [receipt, setReceipt] = useState<{
    id: string; name: string; email: string; updated: boolean; at: Date;
    counts: { label: string; n: number }[]; files: number;
  } | null>(null);
  const { toast } = useToast();
  const { uploadImage, uploadLogo, uploadPDF, uploadMenuFile, uploading } = useFileUpload();

  const updateFormData = (section: keyof RestaurantData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  const markStepCompleted = (step: number) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const isStepValid = (step: number): boolean => {
    // All steps are now optional - users can proceed without filling anything
    return true;
  };

  const handleNext = () => {
    // Always allow progression since nothing is mandatory
    markStepCompleted(currentStep);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      checkDuplicateAndSubmit();
    }
  };

  const checkDuplicateAndSubmit = async () => {
    const name = formData.businessInfo.name.trim();
    if (name) {
      const { data } = await supabase
        .from('restaurant_submissions')
        .select('id, restaurant_name, created_at')
        .ilike('restaurant_name', name)
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setDuplicate(data[0]);
        return;
      }
    }
    handleSubmit();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (existingId?: string) => {
    setDuplicate(null);
    setIsSubmitting(true);
    try {
      // Upload files first
      let logoUrl = null;
      let heroImageUrl = null;
      let aboutImageUrl = null;
      let menuPdfUrl = null; // Legacy compatibility
      const photoUrls: string[] = [];
      const fits = formData.imageFits;
      const dishImageUrls: { [key: number]: string } = {};
      const dealImageUrls: { [key: number]: string } = {};

      // Upload logo if exists
      if (formData.businessInfo.logo) {
        logoUrl = await uploadLogo(formData.businessInfo.logo, `logos/${Date.now()}-logo`);
      }

      // Upload hero image if exists
      if (formData.businessInfo.heroImage) {
        heroImageUrl = await uploadImage(formData.businessInfo.heroImage, `hero/${Date.now()}-hero`);
      }

      // Upload about image and custom section images if they exist
      const customSectionImageUrls: { [key: string]: string } = {};
      if (formData.about.aboutImage) {
        aboutImageUrl = await uploadImage(formData.about.aboutImage, `about/${Date.now()}-about`);
      }
      
      // Upload custom section images
      for (let i = 0; i < formData.about.customSections.length; i++) {
        const section = formData.about.customSections[i];
        if (section.image) {
          const url = await uploadImage(section.image, `custom-sections/${Date.now()}-section-${i}`);
          customSectionImageUrls[section.id] = url;
        }
      }

      // Upload menu files if they exist
      const menuUrls: { category: string; customCategoryName?: string; name: string; url: string }[] = [];
      for (let i = 0; i < formData.menus.length; i++) {
        const menu = formData.menus[i];
        if (menu.file) {
          const categoryName = menu.category === 'custom' ? menu.customCategoryName : menu.category;
          const url = await uploadMenuFile(menu.file, `menus/${Date.now()}-${categoryName}-${i}`);
          menuUrls.push({
            category: menu.category,
            customCategoryName: menu.customCategoryName,
            name: menu.name,
            url
          });
        }
      }

      // Upload restaurant photos
      for (let i = 0; i < formData.photos.length; i++) {
        const url = await uploadImage(formData.photos[i], `photos/${Date.now()}-photo-${i}`);
        photoUrls.push(url);
      }

      // Upload dish images
      for (let i = 0; i < formData.popularDishes.length; i++) {
        if (formData.popularDishes[i].image) {
          const url = await uploadImage(formData.popularDishes[i].image!, `dishes/${Date.now()}-dish-${i}`);
          dishImageUrls[i] = url;
        }
      }

      // Upload deal images
      for (let i = 0; i < formData.deals.length; i++) {
        if (formData.deals[i].image) {
          const url = await uploadImage(formData.deals[i].image!, `deals/${Date.now()}-deal-${i}`);
          dealImageUrls[i] = url;
        }
      }

      const payload: Record<string, any> = {
          restaurant_name: formData.businessInfo.name,
          address: formData.businessInfo.address,
          email: formData.businessInfo.email,
          phone: formData.businessInfo.phone,
          website: formData.businessInfo.website,
          online_ordering_url: formData.businessInfo.onlineOrderingUrl,
          logo_url: logoUrl,
          hero_image_url: heroImageUrl,
          founded_year: formData.about.foundedYear,
          story: formData.about.story,
          owner_quote: formData.about.ownerQuote,
          about_image_url: aboutImageUrl,
          custom_sections: formData.about.customSections.map(section => ({
            id: section.id,
            title: section.title,
            description: section.description,
            image_url: customSectionImageUrls[section.id] || null,
            image_fit: fits[`section:${section.id}`] || 'cover',
            position: section.position
          })),
          menu_pdf_url: menuUrls.length > 0 ? menuUrls[0].url : null,
          delivery_areas: formData.deliveryHours.deliveryAreas,
          delivery_instructions: formData.deliveryHours.instructions,
          hours: formData.deliveryHours.hours,
          instagram: formData.social.instagram,
          facebook: formData.social.facebook,
          twitter: formData.social.twitter,
          comments: formData.social.comments,
      };

      const lists: Record<string, any[]> = {
        dishes: formData.popularDishes.map((dish, i) => ({
          name: dish.name, description: dish.description,
          image_url: dishImageUrls[i] || null, image_fit: fits[`dish:${i}`] || 'cover',
        })),
        deals: formData.deals.map((deal, i) => ({
          title: deal.title, description: deal.description,
          image_url: dealImageUrls[i] || null, image_fit: fits[`deal:${i}`] || 'cover',
        })),
        photos: photoUrls.map((url) => ({ image_url: url, image_fit: fits.photos || 'cover' })),
        menus: menuUrls.map((m) => ({
          category: m.category, custom_category_name: m.customCategoryName || null, menu_name: m.name, menu_url: m.url,
        })),
        faqs: formData.faqs.filter(f => f.question || f.answer).map(f => ({ question: f.question, answer: f.answer })),
      };

      const imageDisplay: Record<string, string> = {};
      if (logoUrl) imageDisplay.logo = fits.logo || 'cover';
      if (heroImageUrl) imageDisplay.hero = fits.hero || 'cover';
      if (aboutImageUrl) imageDisplay.about = fits.about || 'cover';

      let fields: Record<string, any>;
      let listsToSave: Record<string, any[]>;
      const removals = new Set(formData.removals);
      if (existingId) {
        // Blank = leave unchanged. Ticked "remove" = clear it. Filled in = replace it.
        fields = {};
        Object.entries(payload).forEach(([k, v]) => {
          if (k === 'custom_sections' ? (v as any[]).length > 0 : v !== null && v !== '') fields[k] = v;
          else if (removals.has(k)) fields[k] = null;
        });
        const { data: existing } = await supabase.from('restaurant_submissions').select('*').eq('id', existingId).single();
        const display = { ...((existing as any)?.image_display || {}), ...imageDisplay };
        if (removals.has('logo_url')) delete display.logo;
        if (removals.has('hero_image_url')) delete display.hero;
        if (removals.has('about_image_url')) delete display.about;
        fields.image_display = display;
        listsToSave = {};
        Object.entries(lists).forEach(([k, v]) => {
          if (v.length > 0) listsToSave[k] = v;
          else if (removals.has(k)) listsToSave[k] = [];
        });
        if (removals.has('menus') && !listsToSave.menus) fields.menu_pdf_url = null;
      } else {
        fields = { ...payload, image_display: imageDisplay };
        listsToSave = lists;
      }

      // One database transaction: either everything is saved (with a revision snapshot) or nothing changes
      const { data: savedId, error: saveError } = await (supabase as any).rpc('save_restaurant_submission', {
        p_id: existingId || null, p_fields: fields, p_lists: listsToSave, p_source: 'onboarding',
      });
      if (saveError) throw saveError;
      const submission = { id: savedId as string };

      // Send email notification in the background (don't block success)
      try {
        await supabase.functions.invoke('send-submission-notification', {
          body: { submissionId: submission.id }
        });
        console.log('Email notification sent successfully');
      } catch (emailError) {
        console.error('Email notification failed (non-blocking):', emailError);
        // Don't throw - we don't want email failures to block submission success
      }
      
      const counts = [
        { label: "Popular dishes", n: formData.popularDishes.length },
        { label: "Deals", n: formData.deals.length },
        { label: "Menus", n: menuUrls.length },
        { label: "Gallery photos", n: photoUrls.length },
        { label: "FAQs", n: lists.faqs.length },
        { label: "Custom sections", n: formData.about.customSections.length },
      ];
      const files = [logoUrl, heroImageUrl, aboutImageUrl].filter(Boolean).length
        + Object.keys(customSectionImageUrls).length + menuUrls.length + photoUrls.length
        + Object.keys(dishImageUrls).length + Object.keys(dealImageUrls).length;
      setReceipt({
        id: submission.id, name: formData.businessInfo.name || "Your restaurant",
        email: formData.businessInfo.email, updated: !!existingId, at: new Date(), counts, files,
      });
      window.scrollTo(0, 0);

      // Reset form
      setFormData(initialData);
      setCurrentStep(0);
      setCompletedSteps(new Set());
      
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentForm = () => {
    switch (currentStep) {
      case 0:
        return (
          <BusinessInfoForm
            data={formData.businessInfo}
            onChange={(data) => updateFormData('businessInfo', data)}
          />
        );
      case 1:
        return (
          <AboutForm
            data={formData.about}
            onChange={(data) => updateFormData('about', data)}
          />
        );
      case 2:
        return (
          <PopularDishesForm
            data={formData.popularDishes}
            onChange={(data) => updateFormData('popularDishes', data)}
          />
        );
      case 3:
        return (
          <DealsForm
            data={formData.deals}
            onChange={(data) => updateFormData('deals', data)}
          />
        );
      case 4:
        return (
          <MenuUploadForm
            data={formData.menus}
            onChange={(data) => updateFormData('menus', data)}
          />
        );
      case 5:
        return (
          <DeliveryHoursForm
            data={formData.deliveryHours}
            onChange={(data) => updateFormData('deliveryHours', data)}
          />
        );
      case 6:
        return (
          <PhotosForm
            data={formData.photos}
            onChange={(data) => updateFormData('photos', data)}
          />
        );
      case 7:
        return (
          <FontSelectionForm
            data={formData.fonts}
            onChange={(data) => updateFormData('fonts', data)}
          />
        );
      case 8:
        return (
          <FaqForm
            data={formData.faqs}
            onChange={(data) => updateFormData('faqs', data)}
          />
        );
      case 9:
        return (
          <SocialForm
            data={formData.social}
            onChange={(data) => updateFormData('social', data)}
          />
        );
      case 10:
        return <ReviewStep data={formData} onEdit={setCurrentStep} onRemovalsChange={(r) => updateFormData('removals', r)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div 
        className="relative h-64 bg-cover bg-center gradient-hero"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-4">
          <img src={menuLogo} alt="Menu.ca" className="w-48 h-auto mb-4 p-4 bg-white rounded-lg" />
          <p className="text-lg opacity-90">
            Tell us about your restaurant and share your story
          </p>
        </div>
      </div>

      {/* Main Content */}
      {receipt ? (
        <div className="max-w-2xl mx-auto px-4 py-10">
          <Card className="p-8">
            <div className="text-center mb-6">
              <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-3" />
              <h2 className="text-2xl font-bold">Saved successfully</h2>
              <p className="text-muted-foreground mt-1">
                {receipt.updated ? `We updated the existing record for ${receipt.name}.` : `We received the details for ${receipt.name}.`}
              </p>
            </div>
            <div className="border rounded-lg divide-y text-sm">
              <div className="flex justify-between p-3"><span className="text-muted-foreground">Reference</span><span className="font-mono">{receipt.id.slice(0, 8).toUpperCase()}</span></div>
              <div className="flex justify-between p-3"><span className="text-muted-foreground">Restaurant</span><span>{receipt.name}</span></div>
              {receipt.email && <div className="flex justify-between p-3"><span className="text-muted-foreground">Contact</span><span>{receipt.email}</span></div>}
              <div className="flex justify-between p-3"><span className="text-muted-foreground">Date</span><span>{receipt.at.toLocaleString()}</span></div>
              <div className="flex justify-between p-3"><span className="text-muted-foreground">Type</span><span>{receipt.updated ? "Update to existing" : "New submission"}</span></div>
              {receipt.counts.map(c => (
                <div key={c.label} className="flex justify-between p-3"><span className="text-muted-foreground">{c.label}</span><span>{c.n}</span></div>
              ))}
              <div className="flex justify-between p-3 font-medium"><span>Files received</span><span>{receipt.files}</span></div>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-6 print:hidden">
              <Button asChild><Link to={`/admin/submission/${receipt.id}`}><Pencil className="w-4 h-4 mr-2" />Edit this submission</Link></Button>
              <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print receipt</Button>
              <Button variant="ghost" onClick={() => setReceipt(null)}>Start another</Button>
            </div>
          </Card>
        </div>
      ) : (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProgressIndicator
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />

        <div className="form-section mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{steps[currentStep]}</h2>
            <p className="text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>

          <ImageFitContext.Provider value={{
            fits: formData.imageFits,
            setFit: (key, fit) => setFormData(prev => ({ ...prev, imageFits: { ...prev.imageFits, [key]: fit } })),
          }}>
            {renderCurrentForm()}
          </ImageFitContext.Provider>

          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting || uploading}
            >
              {isSubmitting ? "Submitting..." : currentStep === steps.length - 1 ? "Submit" : "Next"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
      )}

      <AlertDialog open={!!duplicate} onOpenChange={(o) => !o && setDuplicate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{duplicate?.restaurant_name} already exists — update it?</AlertDialogTitle>
            <AlertDialogDescription>
              We already have a record for this restaurant (from {duplicate && new Date(duplicate.created_at).toLocaleDateString()}).
              Updating keeps one clear record: anything you filled in now replaces the old version, and anything you left blank stays as it was.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleSubmit()}>No, create a new one</AlertDialogCancel>
            <AlertDialogAction onClick={() => duplicate && handleSubmit(duplicate.id)}>Yes, update it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}