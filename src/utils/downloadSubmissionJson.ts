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

    // Create comprehensive JSON structure
    const exportData = {
      restaurant: {
        id: submission.id,
        name: submission.restaurant_name,
        address: submission.address,
        email: submission.email,
        phone: submission.phone,
        website: submission.website,
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
      photos: photos?.map(photo => ({
        id: photo.id,
        image_url: photo.image_url,
        display_order: photo.display_order
      })) || [],
      additional_comments: submission.comments,
      export_metadata: {
        exported_at: new Date().toISOString(),
        export_version: "1.0"
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