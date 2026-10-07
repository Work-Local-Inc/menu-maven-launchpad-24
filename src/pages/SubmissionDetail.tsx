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
import { downloadSubmissionJson, downloadJsonFile } from "@/utils/downloadSubmissionJson";
import { fetchSubmissionBundle, type Faq } from "@/lib/submissionBundle";
import { fitLabel } from "@/lib/imageFit";
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
  const [menus, setMenus] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const loadAll = async (sid: string) => {
    const b = await fetchSubmissionBundle(sid);
    const { data: revs } = await (supabase as any)
      .from('restaurant_submission_revisions')
      .select('id, source, changed_fields, changed_lists, snapshot, created_at')
      .eq('restaurant_submission_id', sid)
      .order('created_at', { ascending: false });
    const sub = { ...b.submission, comments: b.cleanComments };
    setSubmission(sub);
    setDishes(b.dishes);
    setPhotos(b.photos);
    setDeals(b.deals);
    setMenus(b.menus);
    setFaqs(b.faqs);
    setRevisions(revs || []);
    setEditData({ ...sub, dishes: b.dishes, deals: b.deals });
  };

  useEffect(() => {
    const fetchSubmissionData = async () => {
      if (!id) return;
      
      try {
        await loadAll(id);
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
      const keys = ['restaurant_name','address','email','phone','website','online_ordering_url','founded_year','story',
        'owner_quote','hours','delivery_areas','delivery_instructions','instagram','facebook','twitter','comments'];
      const fields: Record<string, any> = {};
      keys.forEach(k => { fields[k] = editData[k] ?? null; });
      const clean = (list: any[], ok: (x: any) => boolean) => list.filter(ok);
      const lists = {
        dishes: clean(editData.dishes || [], (d) => d.name?.trim() || d.description?.trim()).map((d: any) => ({
          name: d.name, description: d.description, image_url: d.image_url || null, image_fit: d.image_fit || 'cover',
        })),
        deals: clean(editData.deals || [], (d) => d.title?.trim() || d.description?.trim()).map((d: any) => ({
          title: d.title, description: d.description, image_url: d.image_url || null, image_fit: d.image_fit || 'cover',
        })),
        // Also moves any older FAQs that were stored inside comments into proper FAQ records
        faqs: faqs.map(f => ({ question: f.question, answer: f.answer })),
      };
      // Single transaction with a revision snapshot: a failure leaves the record untouched
      const { error } = await (supabase as any).rpc('save_restaurant_submission', {
        p_id: submission.id, p_fields: fields, p_lists: lists, p_source: 'admin_edit',
      });
      if (error) throw error;

      await loadAll(submission.id);
      setIsEditing(false);

      toast({
        title: "Changes Saved",
        description: "Submission updated. The previous version is kept in revision history.",
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
                            className={`w-full h-32 rounded-lg mb-2 bg-muted ${dish.image_fit === 'contain' ? 'object-contain' : 'object-cover'}`}
                          />
                        )}
                        {dish.image_url && <Badge variant="outline" className="mb-2">{fitLabel(dish.image_fit)}</Badge>}
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
                            className={`w-full h-32 rounded-lg mb-2 bg-muted ${deal.image_fit === 'contain' ? 'object-contain' : 'object-cover'}`}
                          />
                        )}
                        {deal.image_url && <Badge variant="outline" className="mb-2">{fitLabel(deal.image_fit)}</Badge>}
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

        {/* Menus */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Menus ({menus.length || (submission.menu_pdf_url ? 1 : 0)})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(menus.length ? menus : submission.menu_pdf_url ? [{ id: 'legacy', menu_name: 'Restaurant Menu', category: 'legacy', menu_url: submission.menu_pdf_url }] : []).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{m.menu_name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {m.category === 'custom' ? m.custom_category_name || 'Custom' : m.category} • {/\.pdf($|\?)/i.test(m.menu_url) ? 'PDF' : 'Image'}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={m.menu_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Open
                  </a>
                </Button>
              </div>
            ))}
            {!menus.length && !submission.menu_pdf_url && <p className="text-muted-foreground">No menu uploaded yet.</p>}
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
            <CardTitle>Restaurant Photos ({photos.length}){photos[0] && <Badge variant="outline" className="ml-2 align-middle">{fitLabel(photos[0].image_fit)}</Badge>}</CardTitle>
          </CardHeader>
          <CardContent>
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="aspect-square rounded-lg overflow-hidden">
                    <img 
                      src={photo.image_url} 
                      alt={`Restaurant photo ${index + 1}`}
                      className={`w-full h-full bg-muted ${photo.image_fit === 'contain' ? 'object-contain' : 'object-cover'} hover:scale-105 transition-transform duration-200`}
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

        {/* FAQs */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>FAQs ({faqs.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.length === 0 && <p className="text-muted-foreground">No FAQs added.</p>}
            {faqs.some(f => f.source === 'legacy_comments') && (
              <p className="text-xs text-muted-foreground">Some of these were saved inside the comments by an older version of the form. Saving an edit stores them as proper FAQs.</p>
            )}
            {faqs.map((f, i) => (
              <div key={i}>
                <p className="font-medium">{f.question}</p>
                <p className="text-sm text-muted-foreground">{f.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Revision history */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Revision History ({revisions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {revisions.length === 0 && <p className="text-muted-foreground">No changes since the first submission.</p>}
            {revisions.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3 border rounded-lg text-sm">
                <div>
                  <p className="font-medium">
                    {new Date(r.created_at).toLocaleString()} • {r.source === 'admin_edit' ? 'Edited by our team' : 'Re-submitted by restaurant'}
                  </p>
                  <p className="text-muted-foreground">
                    Changed: {[...(r.changed_fields || []), ...(r.changed_lists || [])].map((k: string) => k.replace(/_/g, ' ')).join(', ') || 'nothing'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => downloadJsonFile(r.snapshot, `${String(submission.restaurant_name).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_before_${r.created_at.slice(0, 19).replace(/[:T]/g, '-')}.json`)}>
                  <Download className="w-4 h-4 mr-2" />
                  Version before this change
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}