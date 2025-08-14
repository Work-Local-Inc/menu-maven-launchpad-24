import { supabase } from "@/integrations/supabase/client";

export const downloadSubmissionJson = async (submissionId: string) => {
  try {
    // Fetch submission details
    const { data: submission, error: submissionError } = await supabase
      .from('restaurant_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError) throw submissionError;

    // Fetch dishes
    const { data: dishes, error: dishesError } = await supabase
      .from('restaurant_dishes')
      .select('*')
      .eq('restaurant_submission_id', submissionId)
      .order('display_order');

    if (dishesError) throw dishesError;

    // Fetch photos
    const { data: photos, error: photosError } = await supabase
      .from('restaurant_photos')
      .select('*')
      .eq('restaurant_submission_id', submissionId)
      .order('display_order');

    if (photosError) throw photosError;

    // Fetch deals
    const { data: deals, error: dealsError } = await supabase
      .from('restaurant_deals')
      .select('*')
      .eq('restaurant_submission_id', submissionId)
      .order('display_order');

    if (dealsError) throw dealsError;

    // Create comprehensive JSON structure
    const exportData = {
      restaurant: {
        id: submission.id,
        name: submission.restaurant_name,
        logo_url: submission.logo_url,
        hero_image_url: submission.hero_image_url,
        address: submission.address,
        email: submission.email,
        phone: submission.phone,
        website: submission.website,
        online_ordering_url: submission.online_ordering_url,
        founded_year: submission.founded_year,
        story: submission.story,
        owner_quote: submission.owner_quote,
        about_image_url: submission.about_image_url,
        menu_pdf_url: submission.menu_pdf_url,
        status: submission.status,
        created_at: submission.created_at,
        updated_at: submission.updated_at
      },
      operations: {
        hours: submission.hours,
        delivery_areas: submission.delivery_areas,
        delivery_instructions: submission.delivery_instructions
      },
      social_media: {
        instagram: submission.instagram,
        facebook: submission.facebook,
        twitter: submission.twitter
      },
      popular_dishes: dishes?.map(dish => ({
        id: dish.id,
        name: dish.name,
        description: dish.description,
        image_url: dish.image_url,
        display_order: dish.display_order
      })) || [],
      deals: deals?.map(deal => ({
        id: deal.id,
        title: deal.title,
        description: deal.description,
        image_url: deal.image_url,
        display_order: deal.display_order
      })) || [],
      photos: photos?.map(photo => ({
        id: photo.id,
        image_url: photo.image_url,
        display_order: photo.display_order
      })) || [],
      additional_comments: submission.comments,
      integration_instructions: {
        branding: "Use restaurant.logo_url for brand logo placement throughout the site",
        hero_image: "Use restaurant.hero_image_url as a banner/header image on your homepage for visual impact",
        ordering_platform: "Use restaurant.online_ordering_url for all 'Order Now' and 'View Menu' buttons",
        menu_display: "Use restaurant.menu_pdf_url for downloadable menu links",
        deals_promotion: "Feature deals prominently on homepage and dedicated deals page",
        note: "The online_ordering_url connects to your unified ordering platform backend"
      },
      export_metadata: {
        exported_at: new Date().toISOString(),
        export_version: "1.1"
      }
    };

    // Create and download the JSON file
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${submission.restaurant_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_submission.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error downloading submission JSON:', error);
    throw error;
  }
};