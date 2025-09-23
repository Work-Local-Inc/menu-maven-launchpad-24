import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, ExternalLink, MapPin, Clock, Phone, Mail, Globe, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { downloadSubmissionJson } from "@/utils/downloadSubmissionJson";
import { EditableBusinessInfo } from "@/components/edit/EditableBusinessInfo";
import { EditableAboutSection } from "@/components/edit/EditableAboutSection";
import { EditableDishes } from "@/components/edit/EditableDishes";
import { EditableDeals } from "@/components/edit/EditableDeals";
import { EditableHoursDelivery } from "@/components/edit/EditableHoursDelivery";
import { EditableSocialMedia } from "@/components/edit/EditableSocialMedia";

const statusColors = {
  submitted: "bg-blue-100 text-blue-800",
  live: "bg-purple-100 text-purple-800"
};

export default function SubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submission, setSubmission] = useState<any>(null);
  const [dishes, setDishes] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSubmissionData = async () => {
      if (!id) return;
      
      try {
        // Fetch submission details
        const { data: submissionData, error: submissionError } = await supabase
          .from('restaurant_submissions')
          .select('*')
          .eq('id', id)
          .single();

        if (submissionError) throw submissionError;

        // Fetch dishes
        const { data: dishesData, error: dishesError } = await supabase
          .from('restaurant_dishes')
          .select('*')
          .eq('restaurant_submission_id', id)
          .order('display_order');

        if (dishesError) throw dishesError;

        // Fetch photos
        const { data: photosData, error: photosError } = await supabase
          .from('restaurant_photos')
          .select('*')
          .eq('restaurant_submission_id', id)
          .order('display_order');

        if (photosError) throw photosError;

        // Fetch deals
        const { data: dealsData, error: dealsError } = await supabase
          .from('restaurant_deals')
          .select('*')
          .eq('restaurant_submission_id', id)
          .order('display_order');

        if (dealsError) throw dealsError;

        setSubmission(submissionData);
        setDishes(dishesData || []);
        setPhotos(photosData || []);
        setDeals(dealsData || []);
        
        // Initialize edit data
        setEditData({
          ...submissionData,
          dishes: dishesData || [],
          deals: dealsData || []
        });
      } catch (error) {
        console.error('Error fetching submission:', error);
        toast({
          title: "Error loading submission",
          description: "Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionData();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-muted-foreground">Loading submission details...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-muted-foreground">Submission not found.</p>
        </div>
      </div>
    );
  }

  const handleDownloadJson = async () => {
    try {
      await downloadSubmissionJson(submission.id);
      toast({
        title: "JSON Downloaded",
        description: "Submission data exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download submission data.",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsLive = async () => {
    try {
      const { error } = await supabase
        .from('restaurant_submissions')
        .update({ status: 'live' })
        .eq('id', submission.id);

      if (error) throw error;
      
      setSubmission({ ...submission, status: 'live' });
      toast({
        title: "Status Updated",
        description: "Submission marked as live.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update submission status.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset edit data to original submission data
    setEditData({
      ...submission,
      dishes: dishes,
      deals: deals
    });
  };

  const handleSave = async () => {
    if (!editData) return;
    
    setSaving(true);
    try {
      // Update main submission data
      const { error: submissionError } = await supabase
        .from('restaurant_submissions')
        .update({
          restaurant_name: editData.restaurant_name,
          address: editData.address,
          email: editData.email,
          phone: editData.phone,
          website: editData.website,
          online_ordering_url: editData.online_ordering_url,
          founded_year: editData.founded_year,
          story: editData.story,
          owner_quote: editData.owner_quote,
          hours: editData.hours,
          delivery_areas: editData.delivery_areas,
          delivery_instructions: editData.delivery_instructions,
          instagram: editData.instagram,
          facebook: editData.facebook,
          twitter: editData.twitter,
          comments: editData.comments,
        })
        .eq('id', submission.id);

      if (submissionError) throw submissionError;

      // Handle dishes updates
      if (editData.dishes) {
        // Delete existing dishes
        await supabase
          .from('restaurant_dishes')
          .delete()
          .eq('restaurant_submission_id', submission.id);

        // Insert updated dishes (only non-empty ones)
        const validDishes = editData.dishes.filter((dish: any) => dish.name.trim() && dish.description.trim());
        if (validDishes.length > 0) {
          const dishesForInsert = validDishes.map((dish: any, index: number) => ({
            ...dish,
            id: dish.id.startsWith('temp_') ? undefined : dish.id, // Remove temp IDs
            restaurant_submission_id: submission.id,
            display_order: index + 1
          }));

          const { error: dishesError } = await supabase
            .from('restaurant_dishes')
            .insert(dishesForInsert);

          if (dishesError) throw dishesError;
        }
      }

      // Handle deals updates
      if (editData.deals) {
        // Delete existing deals
        await supabase
          .from('restaurant_deals')
          .delete()
          .eq('restaurant_submission_id', submission.id);

        // Insert updated deals (only non-empty ones)
        const validDeals = editData.deals.filter((deal: any) => deal.title.trim() && deal.description.trim());
        if (validDeals.length > 0) {
          const dealsForInsert = validDeals.map((deal: any, index: number) => ({
            ...deal,
            id: deal.id.startsWith('temp_') ? undefined : deal.id, // Remove temp IDs
            restaurant_submission_id: submission.id,
            display_order: index + 1
          }));

          const { error: dealsError } = await supabase
            .from('restaurant_deals')
            .insert(dealsForInsert);

          if (dealsError) throw dealsError;
        }
      }

      // Refresh data
      const { data: updatedSubmission } = await supabase
        .from('restaurant_submissions')
        .select('*')
        .eq('id', submission.id)
        .single();

      const { data: updatedDishes } = await supabase
        .from('restaurant_dishes')
        .select('*')
        .eq('restaurant_submission_id', submission.id)
        .order('display_order');

      const { data: updatedDeals } = await supabase
        .from('restaurant_deals')
        .select('*')
        .eq('restaurant_submission_id', submission.id)
        .order('display_order');

      setSubmission(updatedSubmission);
      setDishes(updatedDishes || []);
      setDeals(updatedDeals || []);
      setIsEditing(false);

      toast({
        title: "Changes Saved",
        description: "Submission updated successfully.",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateEditData = (field: string, value: any) => {
    setEditData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{submission.restaurant_name}</h1>
              <p className="text-muted-foreground">Submitted on {new Date(submission.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={statusColors[submission.status as keyof typeof statusColors]}>
              {submission.status}
            </Badge>
            
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={handleEdit}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={handleDownloadJson}>
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
                {submission.status === "submitted" && (
                  <Button onClick={handleMarkAsLive}>
                    Mark as Live
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Save Changes?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will update the submission with your changes. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSave}>
                        Save Changes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        {/* Business Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <EditableBusinessInfo
                data={editData}
                onChange={updateEditData}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p>{submission.address}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p>{submission.email}</p>
                  </div>
                </div>
                {submission.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p>{submission.phone}</p>
                    </div>
                  </div>
                )}
                {submission.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a href={submission.website} target="_blank" rel="noopener noreferrer" 
                         className="text-primary hover:underline">
                        {submission.website}
                      </a>
                    </div>
                  </div>
                )}
                {submission.online_ordering_url && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Online Ordering</p>
                      <a href={submission.online_ordering_url} target="_blank" rel="noopener noreferrer" 
                         className="text-primary hover:underline">
                        {submission.online_ordering_url}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* About Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About the Restaurant</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <EditableAboutSection
                data={editData}
                onChange={updateEditData}
              />
            ) : (
              <>
                {submission.founded_year && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Founded</p>
                    <p className="font-semibold">{submission.founded_year}</p>
                  </div>
                )}
                {submission.story && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Restaurant Story</p>
                    <p className="leading-relaxed">{submission.story}</p>
                  </div>
                )}
                {submission.owner_quote && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Owner Quote</p>
                    <blockquote className="italic border-l-4 border-primary pl-4">
                      "{submission.owner_quote}"
                    </blockquote>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Popular Dishes ({isEditing ? (editData?.dishes?.length || 0) : dishes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <EditableDishes
                data={editData?.dishes || []}
                onChange={(updatedDishes) => updateEditData('dishes', updatedDishes)}
              />
            ) : (
              <>
                {dishes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dishes.map((dish, index) => (
                      <div key={dish.id} className="border rounded-lg p-4">
                        {dish.image_url && (
                          <img 
                            src={dish.image_url} 
                            alt={dish.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        )}
                        <h4 className="font-semibold mb-2">{dish.name}</h4>
                        <p className="text-sm text-muted-foreground">{dish.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No dishes added yet.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Deals */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Special Deals & Offers ({isEditing ? (editData?.deals?.length || 0) : deals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <EditableDeals
                data={editData?.deals || []}
                onChange={(updatedDeals) => updateEditData('deals', updatedDeals)}
              />
            ) : (
              <>
                {deals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {deals.map((deal) => (
                      <div key={deal.id} className="border rounded-lg p-4">
                        {deal.image_url && (
                          <img 
                            src={deal.image_url} 
                            alt={deal.title}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        )}
                        <h4 className="font-semibold mb-2">{deal.title}</h4>
                        <p className="text-sm text-muted-foreground">{deal.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No deals added yet.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Menu PDF */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Menu PDF</CardTitle>
          </CardHeader>
          <CardContent>
            {submission.menu_pdf_url ? (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Restaurant Menu</p>
                  <p className="text-sm text-muted-foreground">PDF Document</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={submission.menu_pdf_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">No menu uploaded yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Hours & Delivery */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Hours & Delivery Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <EditableHoursDelivery
                data={editData}
                onChange={updateEditData}
              />
            ) : (
              <>
                {submission.hours && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Hours of Operation</p>
                    <pre className="text-sm whitespace-pre-line">{submission.hours}</pre>
                  </div>
                )}
                {submission.hours && submission.delivery_areas && <Separator />}
                {submission.delivery_areas && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Delivery Areas</p>
                    <pre className="text-sm whitespace-pre-line">{submission.delivery_areas}</pre>
                  </div>
                )}
                {submission.delivery_areas && submission.delivery_instructions && <Separator />}
                {submission.delivery_instructions && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Instructions</p>
                    <p className="text-sm">{submission.delivery_instructions}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Restaurant Photos ({photos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="aspect-square rounded-lg overflow-hidden">
                    <img 
                      src={photo.image_url} 
                      alt={`Restaurant photo ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No photos uploaded yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Social & Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Social Media & Additional Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <EditableSocialMedia
                data={editData}
                onChange={updateEditData}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {submission.instagram && (
                    <div>
                      <p className="text-sm text-muted-foreground">Instagram</p>
                      <p>{submission.instagram}</p>
                    </div>
                  )}
                  {submission.facebook && (
                    <div>
                      <p className="text-sm text-muted-foreground">Facebook</p>
                      <p>{submission.facebook}</p>
                    </div>
                  )}
                  {submission.twitter && (
                    <div>
                      <p className="text-sm text-muted-foreground">Twitter</p>
                      <p>{submission.twitter}</p>
                    </div>
                  )}
                </div>
                {submission.comments && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Additional Comments</p>
                      <p className="text-sm leading-relaxed">{submission.comments}</p>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}