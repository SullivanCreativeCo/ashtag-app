import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Upload,
  Search,
  Loader2,
  Trash2,
  Image as ImageIcon,
  Plus,
  Shield,
  Check,
  X,
  Clock,
  MessageSquare,
} from "lucide-react";

interface Cigar {
  id: string;
  brand: string;
  line: string;
  vitola: string;
}

interface CigarBandImage {
  id: string;
  cigar_id: string;
  image_url: string;
  description: string | null;
  is_primary: boolean;
  created_at: string;
  cigar?: Cigar;
}

interface CigarRequest {
  id: string;
  user_id: string;
  requested_name: string;
  details: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  display_name?: string | null;
}

export default function AdminBandImages() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [bandImages, setBandImages] = useState<CigarBandImage[]>([]);
  const [cigars, setCigars] = useState<Cigar[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCigars, setFilteredCigars] = useState<Cigar[]>([]);
  const [activeTab, setActiveTab] = useState("images");
  
  // Cigar requests state
  const [cigarRequests, setCigarRequests] = useState<CigarRequest[]>([]);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  
  // Upload form state
  const [selectedCigarId, setSelectedCigarId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    checkAdminRole();
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
      fetchCigarRequests();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const filtered = cigars.filter(
        (c) =>
          c.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.line.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCigars(filtered.slice(0, 20));
    } else {
      setFilteredCigars([]);
    }
  }, [searchQuery, cigars]);

  const checkAdminRole = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!error && !!data);
    setLoading(false);
  };

  const fetchData = async () => {
    setLoading(true);

    // Fetch all cigars
    const { data: cigarsData } = await supabase
      .from("cigars")
      .select("id, brand, line, vitola")
      .order("brand");

    if (cigarsData) {
      setCigars(cigarsData);
    }

    // Fetch existing band images
    const { data: imagesData } = await supabase
      .from("cigar_band_images")
      .select(`
        *,
        cigar:cigars(id, brand, line, vitola)
      `)
      .order("created_at", { ascending: false });

    if (imagesData) {
      setBandImages(imagesData as CigarBandImage[]);
    }

    setLoading(false);
  };

  const fetchCigarRequests = async () => {
    const { data: requestsData, error } = await supabase
      .from("cigar_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && requestsData) {
      // Fetch profiles for each request
      const userIds = [...new Set(requestsData.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);

      const profileMap = new Map(profilesData?.map(p => [p.id, p.display_name]) || []);
      
      const requestsWithProfiles = requestsData.map(r => ({
        ...r,
        display_name: profileMap.get(r.user_id) || null,
      }));

      setCigarRequests(requestsWithProfiles as CigarRequest[]);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, status: "approved" | "rejected") => {
    setUpdatingRequestId(requestId);
    
    const { error } = await supabase
      .from("cigar_requests")
      .update({ status })
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    } else {
      toast({
        title: status === "approved" ? "Request Approved" : "Request Rejected",
        description: status === "approved" 
          ? "Don't forget to add the cigar to the database!" 
          : "The request has been rejected",
      });
      fetchCigarRequests();
    }
    
    setUpdatingRequestId(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    console.log("handleUpload called", { selectedFile, selectedCigarId, user: !!user });
    
    if (!selectedFile) {
      toast({
        title: "Missing image",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedCigarId) {
      toast({
        title: "Missing cigar",
        description: "Please select a cigar from the search",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to upload images",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload image to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${selectedCigarId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("cigar-bands")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("cigar-bands")
        .getPublicUrl(fileName);

      // Create database record
      const { error: dbError } = await supabase.from("cigar_band_images").insert({
        cigar_id: selectedCigarId,
        image_url: urlData.publicUrl,
        description: description || null,
        is_primary: isPrimary,
        created_by: user.id,
      });

      if (dbError) throw dbError;

      toast({
        title: "Image uploaded!",
        description: "The cigar band image has been added",
      });

      // Reset form and refresh
      resetForm();
      fetchData();
      setDialogOpen(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string, imageUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split("/cigar-bands/");
      const filePath = urlParts[1];

      // Delete from storage
      if (filePath) {
        await supabase.storage.from("cigar-bands").remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from("cigar_band_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;

      toast({
        title: "Image deleted",
        description: "The cigar band image has been removed",
      });

      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the image",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedCigarId("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescription("");
    setIsPrimary(false);
    setSearchQuery("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const pendingRequestsCount = cigarRequests.filter(r => r.status === "pending").length;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-4">
            <Shield className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground mt-2 max-w-xs">
            You need admin privileges to access this page.
          </p>
          <Button onClick={() => navigate("/feed")} className="mt-6">
            Go Back
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Admin Panel
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage cigars and requests
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="images" className="flex-1 gap-2">
              <ImageIcon className="h-4 w-4" />
              Band Images
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1 gap-2 relative">
              <MessageSquare className="h-4 w-4" />
              Requests
              {pendingRequestsCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {pendingRequestsCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Band Images Tab */}
          <TabsContent value="images" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {bandImages.length} reference images
              </p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Image
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Band Image</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 pt-4">
                    {/* Cigar Search */}
                    <div className="space-y-2">
                      <Label>Select Cigar</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by brand or line..."
                          className="pl-9"
                        />
                      </div>
                      
                      {filteredCigars.length > 0 && !selectedCigarId && (
                        <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-card">
                          {filteredCigars.map((cigar) => (
                            <button
                              key={cigar.id}
                              onClick={() => {
                                setSelectedCigarId(cigar.id);
                                setSearchQuery(`${cigar.brand} ${cigar.line}`);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                            >
                              <span className="font-medium">{cigar.brand} {cigar.line}</span>
                              <span className="text-muted-foreground ml-2">{cigar.vitola}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {selectedCigarId && (
                        <div className="flex items-center justify-between rounded-lg border border-primary bg-primary/5 px-3 py-2">
                          <span className="text-sm font-medium">{searchQuery}</span>
                          <button
                            onClick={() => {
                              setSelectedCigarId("");
                              setSearchQuery("");
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Change
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                      <Label>Band Image</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      
                      {previewUrl ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => {
                              setSelectedFile(null);
                              setPreviewUrl(null);
                            }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Click to upload image
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Front view, Gold band variant..."
                      />
                    </div>

                    {/* Primary Toggle */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPrimary"
                        checked={isPrimary}
                        onChange={(e) => setIsPrimary(e.target.checked)}
                        className="rounded border-border"
                      />
                      <Label htmlFor="isPrimary" className="text-sm font-normal">
                        Set as primary reference image
                      </Label>
                    </div>

                    {/* Status indicator */}
                    {(!selectedCigarId || !selectedFile) && (
                      <div className="text-sm text-amber-500 bg-amber-500/10 rounded-lg p-3 space-y-1">
                        <p className="font-medium">Before uploading:</p>
                        <ul className="list-disc list-inside text-xs space-y-0.5">
                          {!selectedCigarId && <li>Select a cigar from the search above</li>}
                          {!selectedFile && <li>Choose an image file to upload</li>}
                        </ul>
                      </div>
                    )}

                    {/* Submit */}
                    <Button
                      onClick={handleUpload}
                      disabled={!selectedCigarId || !selectedFile || uploading}
                      className="w-full"
                      size="lg"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Image Grid */}
            {bandImages.length === 0 ? (
              <div className="card-elevated flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No images yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Start building your recognition database by uploading cigar band images.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {bandImages.map((image) => (
                  <div
                    key={image.id}
                    className="card-elevated overflow-hidden group"
                  >
                    <div className="relative aspect-square">
                      <img
                        src={image.image_url}
                        alt={image.cigar?.brand || "Cigar band"}
                        className="w-full h-full object-cover"
                      />
                      {image.is_primary && (
                        <span className="absolute top-2 left-2 text-[10px] font-medium bg-primary text-white px-2 py-0.5 rounded-full">
                          Primary
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(image.id, image.image_url)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {image.cigar?.brand} {image.cigar?.line}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {image.cigar?.vitola}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Cigar Requests Tab */}
          <TabsContent value="requests" className="space-y-4 mt-4">
            {cigarRequests.length === 0 ? (
              <div className="card-elevated flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <MessageSquare className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No requests yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  When users request new cigars, they'll appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cigarRequests.map((request) => (
                  <div
                    key={request.id}
                    className="card-elevated p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">
                          {request.requested_name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          by {request.display_name || "Anonymous"} • {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          request.status === "pending" ? "secondary" :
                          request.status === "approved" ? "default" : "destructive"
                        }
                        className="capitalize"
                      >
                        {request.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {request.status === "approved" && <Check className="h-3 w-3 mr-1" />}
                        {request.status === "rejected" && <X className="h-3 w-3 mr-1" />}
                        {request.status}
                      </Badge>
                    </div>

                    {request.details && (
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                        {request.details}
                      </p>
                    )}

                    {request.status === "pending" && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateRequestStatus(request.id, "approved")}
                          disabled={updatingRequestId === request.id}
                          className="flex-1 gap-1"
                        >
                          {updatingRequestId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateRequestStatus(request.id, "rejected")}
                          disabled={updatingRequestId === request.id}
                          className="flex-1 gap-1"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
