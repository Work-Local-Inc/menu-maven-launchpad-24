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
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-bg.jpg";
const menuLogo = "https://i.imgur.com/AYyrnpP.png";
import { supabase } from "@/integrations/supabase/client";
import { useFileUpload } from "@/hooks/useFileUpload";

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
  menuPdf: File | null;
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
  },
  popularDishes: [],
  deals: [],
  menuPdf: null,
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
  "Social & Extras"
];

export default function RestaurantOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<RestaurantData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { uploadImage, uploadPDF, uploadMenuFile, uploading } = useFileUpload();

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
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Upload files first
      let logoUrl = null;
      let heroImageUrl = null;
      let aboutImageUrl = null;
      let menuPdfUrl = null;
      const photoUrls: string[] = [];
      const dishImageUrls: { [key: number]: string } = {};
      const dealImageUrls: { [key: number]: string } = {};

      // Upload logo if exists
      if (formData.businessInfo.logo) {
        logoUrl = await uploadImage(formData.businessInfo.logo, `logos/${Date.now()}-logo`);
      }

      // Upload hero image if exists
      if (formData.businessInfo.heroImage) {
        heroImageUrl = await uploadImage(formData.businessInfo.heroImage, `hero/${Date.now()}-hero`);
      }

      // Upload about image if exists
      if (formData.about.aboutImage) {
        aboutImageUrl = await uploadImage(formData.about.aboutImage, `about/${Date.now()}-about`);
      }

      // Upload menu file if exists (PDF or JPG)
      if (formData.menuPdf) {
        menuPdfUrl = await uploadMenuFile(formData.menuPdf, `menus/${Date.now()}-menu`);
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

      // Create restaurant submission
      const { data: submission, error: submissionError } = await supabase
        .from('restaurant_submissions')
        .insert({
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
          menu_pdf_url: menuPdfUrl,
          delivery_areas: formData.deliveryHours.deliveryAreas,
          delivery_instructions: formData.deliveryHours.instructions,
          hours: formData.deliveryHours.hours,
          instagram: formData.social.instagram,
          facebook: formData.social.facebook,
          twitter: formData.social.twitter,
          comments: formData.social.comments,
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Insert dishes
      if (formData.popularDishes.length > 0) {
        const dishesData = formData.popularDishes.map((dish, index) => ({
          restaurant_submission_id: submission.id,
          name: dish.name,
          description: dish.description,
          image_url: dishImageUrls[index] || null,
          display_order: index,
        }));

        const { error: dishesError } = await supabase
          .from('restaurant_dishes')
          .insert(dishesData);

        if (dishesError) throw dishesError;
      }

      // Insert deals
      if (formData.deals.length > 0) {
        const dealsData = formData.deals.map((deal, index) => ({
          restaurant_submission_id: submission.id,
          title: deal.title,
          description: deal.description,
          image_url: dealImageUrls[index] || null,
          display_order: index,
        }));

        const { error: dealsError } = await supabase
          .from('restaurant_deals')
          .insert(dealsData);

        if (dealsError) throw dealsError;
      }

      // Insert photos
      if (photoUrls.length > 0) {
        const photosData = photoUrls.map((url, index) => ({
          restaurant_submission_id: submission.id,
          image_url: url,
          display_order: index,
        }));

        const { error: photosError } = await supabase
          .from('restaurant_photos')
          .insert(photosData);

        if (photosError) throw photosError;
      }

      // Insert FAQs
      if (formData.faqs.length > 0) {
        const faqsData = formData.faqs.map((faq, index) => ({
          restaurant_submission_id: submission.id,
          question: faq.question,
          answer: faq.answer,
          display_order: index,
        }));

        // Note: This will be handled once the database types are updated
        // For now, we'll store FAQs in the comments field as JSON
        const faqsJson = JSON.stringify(formData.faqs);
        
        // Update submission with FAQs in comments field temporarily
        const { error: faqsError } = await supabase
          .from('restaurant_submissions')
          .update({ 
            comments: formData.social.comments + (formData.social.comments ? '\n\nFAQs:\n' : 'FAQs:\n') + faqsJson 
          })
          .eq('id', submission.id);

        if (faqsError) throw faqsError;
      }
      
      toast({
        title: "Restaurant information submitted!",
        description: "Thank you for sharing your restaurant details with us.",
      });

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
            data={formData.menuPdf}
            onChange={(data) => updateFormData('menuPdf', data)}
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

          {renderCurrentForm()}

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
    </div>
  );
}