import { useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { BusinessInfoForm } from "@/components/onboarding/BusinessInfoForm";
import { AboutForm } from "@/components/onboarding/AboutForm";
import { PopularDishesForm } from "@/components/onboarding/PopularDishesForm";
import { MenuUploadForm } from "@/components/onboarding/MenuUploadForm";
import { DeliveryHoursForm } from "@/components/onboarding/DeliveryHoursForm";
import { PhotosForm } from "@/components/onboarding/PhotosForm";
import { SocialForm } from "@/components/onboarding/SocialForm";
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
}

const initialData: RestaurantData = {
  businessInfo: {
    name: "",
    address: "",
    email: "",
    phone: "",
    website: "",
  },
  about: {
    foundedYear: "",
    story: "",
    ownerQuote: "",
    aboutImage: null,
  },
  popularDishes: [],
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
};

const steps = [
  "Business Info",
  "About Us", 
  "Popular Dishes",
  "Menu Upload",
  "Delivery & Hours",
  "Photos",
  "Social & Extras"
];

export default function RestaurantOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<RestaurantData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { uploadImage, uploadPDF, uploading } = useFileUpload();

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
    switch (step) {
      case 0:
        return !!(formData.businessInfo.name && formData.businessInfo.address && formData.businessInfo.email);
      case 1:
        return !!(formData.about.foundedYear && formData.about.story);
      case 2:
        return formData.popularDishes.length >= 3;
      case 3:
        return !!formData.menuPdf;
      case 4:
        return !!(formData.deliveryHours.deliveryAreas && formData.deliveryHours.hours);
      case 5:
        return formData.photos.length >= 3;
      case 6:
        return true; // Social is optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid(currentStep)) {
      markStepCompleted(currentStep);
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    } else {
      toast({
        title: "Please complete required fields",
        description: "Fill in all required information before proceeding.",
        variant: "destructive"
      });
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
      let aboutImageUrl = null;
      let menuPdfUrl = null;
      const photoUrls: string[] = [];
      const dishImageUrls: { [key: number]: string } = {};

      // Upload about image if exists
      if (formData.about.aboutImage) {
        aboutImageUrl = await uploadImage(formData.about.aboutImage, `about/${Date.now()}-about`);
      }

      // Upload menu PDF if exists
      if (formData.menuPdf) {
        menuPdfUrl = await uploadPDF(formData.menuPdf, `menus/${Date.now()}-menu`);
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

      // Create restaurant submission
      const { data: submission, error: submissionError } = await supabase
        .from('restaurant_submissions')
        .insert({
          restaurant_name: formData.businessInfo.name,
          address: formData.businessInfo.address,
          email: formData.businessInfo.email,
          phone: formData.businessInfo.phone,
          website: formData.businessInfo.website,
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
          <MenuUploadForm
            data={formData.menuPdf}
            onChange={(data) => updateFormData('menuPdf', data)}
          />
        );
      case 4:
        return (
          <DeliveryHoursForm
            data={formData.deliveryHours}
            onChange={(data) => updateFormData('deliveryHours', data)}
          />
        );
      case 5:
        return (
          <PhotosForm
            data={formData.photos}
            onChange={(data) => updateFormData('photos', data)}
          />
        );
      case 6:
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
          <img src={menuLogo} alt="Menu.ca" className="w-48 h-auto mb-4" />
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
              disabled={(!isStepValid(currentStep) && currentStep !== 6) || isSubmitting || uploading}
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