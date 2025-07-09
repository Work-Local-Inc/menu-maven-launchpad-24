import { useState } from "react";
import { Eye, FileText, Calendar, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
const menuLogo = "https://i.imgur.com/AYyrnpP.png";
import { useRestaurantSubmissions } from "@/hooks/useRestaurantSubmissions";


const statusColors = {
  submitted: "bg-blue-100 text-blue-800",
  live: "bg-purple-100 text-purple-800"
};

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const { submissions, loading, error, updateSubmissionStatus } = useRestaurantSubmissions();

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <img src={menuLogo} alt="Menu.ca" className="w-16 h-auto" />
            <div>
              <h1 className="text-3xl font-bold">Restaurant Submissions</h1>
              <p className="text-muted-foreground">Manage and review restaurant directory submissions</p>
            </div>
          </div>
          <Button onClick={() => navigate("/")} variant="outline">
            Back to Home
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.filter(s => s.status === "submitted").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Live Sites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.filter(s => s.status === "live").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search restaurants or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">New Submissions</option>
            <option value="live">Live Sites</option>
          </select>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading submissions...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Error: {error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{submission.restaurant_name}</h3>
                        <Badge className={statusColors[submission.status as keyof typeof statusColors]}>
                          {submission.status.replace("-", " ")}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-1">{submission.email}</p>
                      <p className="text-muted-foreground text-sm mb-2">{submission.address}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        Submitted {new Date(submission.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/submission/${submission.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      {submission.status === "submitted" && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => updateSubmissionStatus(submission.id, "live")}
                        >
                          Mark as Live
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No submissions found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}