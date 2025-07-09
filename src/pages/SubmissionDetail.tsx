import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, ExternalLink, MapPin, Clock, Phone, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { downloadSubmissionJson } from "@/utils/downloadSubmissionJson";

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
  const [loading, setLoading] = useState(true);

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

        setSubmission(submissionData);
        setDishes(dishesData || []);
        setPhotos(photosData || []);
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
            <Button variant="outline" onClick={handleDownloadJson}>
              <Download className="w-4 h-4 mr-2" />
              Download JSON
            </Button>
            {submission.status === "submitted" && (
              <Button onClick={handleMarkAsLive}>
                Mark as Live
              </Button>
            )}
          </div>
        </div>

        {/* Business Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About the Restaurant</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Popular Dishes ({dishes.length})</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}