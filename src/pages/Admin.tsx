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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Globe,
  Cigarette,
  Play,
  RefreshCw,
  Database,
  Zap,
  Users,
  Star,
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

interface ScrapedCigar {
  name?: string;
  brand?: string;
  line?: string;
  vitola?: string;
  origin?: string;
  ringGauge?: string;
  length?: string;
  wrapper?: string;
  description?: string;
}

interface ScrapeSource {
  id: string;
  name: string;
  base_url: string;
  last_mapped_at: string | null;
  total_urls_found: number;
  total_processed: number;
  is_active: boolean;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  duplicate: number;
}

const VITOLA_OPTIONS = [
  "Robusto", "Toro", "Gordo", "Churchill", "Corona", "Lancero",
  "Torpedo", "Belicoso", "Perfecto", "Petit Corona", "Double Corona",
  "Lonsdale", "Panatela", "Rothschild", "Figurado",
];

const WRAPPER_OPTIONS = [
  "Natural", "Maduro", "Connecticut", "Habano", "Corojo", "Oscuro",
  "Candela", "Cameroon", "Sumatra", "Broadleaf",
];

const ORIGIN_OPTIONS = [
  "Nicaragua", "Dominican Republic", "Honduras", "Cuba", "Mexico",
  "Costa Rica", "Ecuador", "United States", "Brazil", "Philippines",
];

const STRENGTH_OPTIONS = [
  "Mild", "Mild-Medium", "Medium", "Medium-Full", "Full",
];

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
  const [totalCigarsCount, setTotalCigarsCount] = useState(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [totalRatingsCount, setTotalRatingsCount] = useState(0);
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

  // Add cigar form state
  const [addCigarDialogOpen, setAddCigarDialogOpen] = useState(false);
  const [addingCigar, setAddingCigar] = useState(false);
  const [newCigar, setNewCigar] = useState({
    brand: "",
    line: "",
    vitola: "",
    wrapper: "",
    origin: "",
    strength: "",
    size: "",
  });

  // Scraper state
  const [scraping, setScraping] = useState(false);
  const [scrapeQuery, setScrapeQuery] = useState("");
  const [scrapedCigars, setScrapedCigars] = useState<ScrapedCigar[]>([]);
  const [importingIndex, setImportingIndex] = useState<number | null>(null);

  // Automated scraper state
  const [scrapeSources, setScrapeSources] = useState<ScrapeSource[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats>({ pending: 0, processing: 0, completed: 0, failed: 0, duplicate: 0 });
  const [mappingSource, setMappingSource] = useState<string | null>(null);
  const [processingQueue, setProcessingQueue] = useState(false);

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
      fetchScrapeSources();
      fetchQueueStats();
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

    // Fetch all counts in parallel
    const [cigarsCountResult, usersCountResult, ratingsCountResult, cigarsDataResult, imagesDataResult] = await Promise.all([
      supabase.from("cigars").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("smoke_logs").select("*", { count: "exact", head: true }),
      supabase.from("cigars").select("id, brand, line, vitola").order("brand").limit(1000),
      supabase.from("cigar_band_images").select(`*, cigar:cigars(id, brand, line, vitola)`).order("created_at", { ascending: false }),
    ]);

    if (cigarsCountResult.count !== null) {
      setTotalCigarsCount(cigarsCountResult.count);
    }

    if (usersCountResult.count !== null) {
      setTotalUsersCount(usersCountResult.count);
    }

    if (ratingsCountResult.count !== null) {
      setTotalRatingsCount(ratingsCountResult.count);
    }

    if (cigarsDataResult.data) {
      setCigars(cigarsDataResult.data);
    }

    if (imagesDataResult.data) {
      setBandImages(imagesDataResult.data as CigarBandImage[]);
    }

    setLoading(false);
  };

  const fetchCigarRequests = async () => {
    const { data: requestsData, error } = await supabase
      .from("cigar_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && requestsData) {
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

  const fetchScrapeSources = async () => {
    const { data, error } = await supabase
      .from("scrape_sources")
      .select("*")
      .order("name");

    if (!error && data) {
      setScrapeSources(data as ScrapeSource[]);
    }
  };

  const fetchQueueStats = async () => {
    const { data, error } = await supabase
      .from("scrape_queue")
      .select("status");

    if (!error && data) {
      const stats: QueueStats = { pending: 0, processing: 0, completed: 0, failed: 0, duplicate: 0 };
      data.forEach((item: { status: string }) => {
        if (item.status in stats) {
          stats[item.status as keyof QueueStats]++;
        }
      });
      setQueueStats(stats);
    }
  };

  const handleMapUrls = async (sourceName: string) => {
    setMappingSource(sourceName);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke("map-cigar-urls", {
        body: { sourceName },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "URLs Mapped!",
        description: `Found ${data.cigarUrls} cigar pages. Added ${data.inserted} new URLs to queue.`,
      });

      fetchScrapeSources();
      fetchQueueStats();
    } catch (error) {
      console.error("Map error:", error);
      toast({
        title: "Mapping failed",
        description: error instanceof Error ? error.message : "Failed to map URLs",
        variant: "destructive",
      });
    } finally {
      setMappingSource(null);
    }
  };

  const handleProcessQueue = async (batchSize = 50, continueInBackground = false) => {
    setProcessingQueue(true);

    try {
      const { data, error } = await supabase.functions.invoke("process-scrape-queue", {
        body: { batchSize, continueInBackground },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (continueInBackground) {
        toast({
          title: "Bulk processing started!",
          description: `First batch: ${data.processed} items. Processing will continue in the background. Refresh to see progress.`,
        });
      } else {
        toast({
          title: "Batch processed!",
          description: `Processed ${data.processed} items: ${data.inserted} inserted, ${data.duplicates} duplicates, ${data.failed} failed.`,
        });
      }

      fetchData();
      fetchQueueStats();
    } catch (error) {
      console.error("Process error:", error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process queue",
        variant: "destructive",
      });
    } finally {
      setProcessingQueue(false);
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
    if (!selectedFile || !selectedCigarId || !user) return;

    setUploading(true);

    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${selectedCigarId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("cigar-bands")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("cigar-bands")
        .getPublicUrl(fileName);

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
      const urlParts = imageUrl.split("/cigar-bands/");
      const filePath = urlParts[1];

      if (filePath) {
        await supabase.storage.from("cigar-bands").remove([filePath]);
      }

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

  const handleAddCigar = async () => {
    if (!newCigar.brand.trim() || !newCigar.line.trim() || !newCigar.vitola.trim()) {
      toast({
        title: "Missing fields",
        description: "Brand, line, and vitola are required",
        variant: "destructive",
      });
      return;
    }

    setAddingCigar(true);

    try {
      const { error } = await supabase.from("cigars").insert({
        brand: newCigar.brand.trim(),
        line: newCigar.line.trim(),
        vitola: newCigar.vitola.trim(),
        wrapper: newCigar.wrapper.trim() || null,
        origin: newCigar.origin.trim() || null,
        strength_profile: newCigar.strength || null,
        size: newCigar.size.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Cigar added!",
        description: `${newCigar.brand} ${newCigar.line} has been added to the database`,
      });

      setNewCigar({ brand: "", line: "", vitola: "", wrapper: "", origin: "", strength: "", size: "" });
      setAddCigarDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error adding cigar:", error);
      toast({
        title: "Failed to add cigar",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setAddingCigar(false);
    }
  };

  const handleScrape = async () => {
    if (!scrapeQuery.trim()) {
      toast({
        title: "Enter a search term",
        description: "Please enter a brand or cigar name to search",
        variant: "destructive",
      });
      return;
    }

    setScraping(true);
    setScrapedCigars([]);

    try {
      const { data, error } = await supabase.functions.invoke("scrape-cigars", {
        body: { action: "search", searchQuery: scrapeQuery.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.cigars && data.cigars.length > 0) {
        setScrapedCigars(data.cigars);
        toast({
          title: "Found cigars!",
          description: `Found ${data.cigars.length} cigars from Elite Cigar Library`,
        });
      } else {
        toast({
          title: "No results",
          description: "No cigars found for that search. Try a different term.",
        });
      }
    } catch (error) {
      console.error("Scrape error:", error);
      toast({
        title: "Scraping failed",
        description: error instanceof Error ? error.message : "Failed to scrape website",
        variant: "destructive",
      });
    } finally {
      setScraping(false);
    }
  };

  const handleImportCigar = async (cigar: ScrapedCigar, index: number) => {
    setImportingIndex(index);

    try {
      // Check if cigar already exists
      const brand = cigar.brand || cigar.name?.split(" ")[0] || "Unknown";
      const line = cigar.line || cigar.name || "Unknown";
      const vitola = cigar.vitola || "Robusto";

      const { data: existing } = await supabase
        .from("cigars")
        .select("id")
        .ilike("brand", brand)
        .ilike("line", line)
        .ilike("vitola", vitola)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Already exists",
          description: `${brand} ${line} ${vitola} is already in the database`,
        });
        return;
      }

      const { error } = await supabase.from("cigars").insert({
        brand,
        line,
        vitola,
        wrapper: cigar.wrapper || null,
        origin: cigar.origin || null,
        size: cigar.ringGauge ? `${cigar.length || "?"} x ${cigar.ringGauge}` : null,
      });

      if (error) throw error;

      toast({
        title: "Cigar imported!",
        description: `${brand} ${line} has been added to the database`,
      });

      fetchData();
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import cigar",
        variant: "destructive",
      });
    } finally {
      setImportingIndex(null);
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
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-foreground">
              Admin
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage cigars, images, and requests
            </p>
          </div>
          
          {/* Quick Add Cigar Button */}
          <Dialog open={addCigarDialogOpen} onOpenChange={setAddCigarDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <Cigarette className="h-4 w-4" />
                Add Cigar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Cigar</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Brand *</Label>
                    <Input
                      value={newCigar.brand}
                      onChange={(e) => setNewCigar({ ...newCigar, brand: e.target.value })}
                      placeholder="e.g., Padron"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Line/Series *</Label>
                    <Input
                      value={newCigar.line}
                      onChange={(e) => setNewCigar({ ...newCigar, line: e.target.value })}
                      placeholder="e.g., 1926 Serie"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vitola *</Label>
                    <Select
                      value={newCigar.vitola}
                      onValueChange={(v) => setNewCigar({ ...newCigar, vitola: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vitola" />
                      </SelectTrigger>
                      <SelectContent>
                        {VITOLA_OPTIONS.map((v) => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Wrapper</Label>
                    <Select
                      value={newCigar.wrapper}
                      onValueChange={(v) => setNewCigar({ ...newCigar, wrapper: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select wrapper" />
                      </SelectTrigger>
                      <SelectContent>
                        {WRAPPER_OPTIONS.map((w) => (
                          <SelectItem key={w} value={w}>{w}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Origin</Label>
                    <Select
                      value={newCigar.origin}
                      onValueChange={(v) => setNewCigar({ ...newCigar, origin: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select origin" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORIGIN_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Strength</Label>
                    <Select
                      value={newCigar.strength}
                      onValueChange={(v) => setNewCigar({ ...newCigar, strength: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select strength" />
                      </SelectTrigger>
                      <SelectContent>
                        {STRENGTH_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Size (e.g., 5 x 50)</Label>
                  <Input
                    value={newCigar.size}
                    onChange={(e) => setNewCigar({ ...newCigar, size: e.target.value })}
                    placeholder="Length x Ring Gauge"
                  />
                </div>

                <Button
                  onClick={handleAddCigar}
                  disabled={addingCigar || !newCigar.brand || !newCigar.line || !newCigar.vitola}
                  className="w-full"
                >
                  {addingCigar ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Cigar
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2">
          <div className="card-elevated p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-primary">{totalUsersCount.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Users</p>
          </div>
          <div className="card-elevated p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-primary">{totalRatingsCount.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Ratings</p>
          </div>
          <div className="card-elevated p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Cigarette className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-primary">{totalCigarsCount.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Cigars</p>
          </div>
          <div className="card-elevated p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-primary">{bandImages.length}</p>
            <p className="text-[10px] text-muted-foreground">Bands</p>
          </div>
          <div className="card-elevated p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-primary">{pendingRequestsCount}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="images" className="gap-1 text-xs">
              <ImageIcon className="h-3.5 w-3.5" />
              Images
            </TabsTrigger>
            <TabsTrigger value="scraper" className="gap-1 text-xs">
              <Globe className="h-3.5 w-3.5" />
              Scraper
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-1 text-xs relative">
              <MessageSquare className="h-3.5 w-3.5" />
              Requests
              {pendingRequestsCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
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

                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                        placeholder="e.g., Front view, Gold band variant..."
                        maxLength={500}
                      />
                    </div>

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

                    {(!selectedCigarId || !selectedFile) && (
                      <div className="text-sm text-amber-500 bg-amber-500/10 rounded-lg p-3 space-y-1">
                        <p className="font-medium">Before uploading:</p>
                        <ul className="list-disc list-inside text-xs space-y-0.5">
                          {!selectedCigarId && <li>Select a cigar from the search above</li>}
                          {!selectedFile && <li>Choose an image file to upload</li>}
                        </ul>
                      </div>
                    )}

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

          {/* Scraper Tab */}
          <TabsContent value="scraper" className="space-y-4 mt-4">
            {/* Queue Stats */}
            <div className="grid grid-cols-5 gap-2">
              <div className="card-elevated p-2 text-center">
                <p className="text-lg font-bold text-amber-500">{queueStats.pending}</p>
                <p className="text-[10px] text-muted-foreground">Pending</p>
              </div>
              <div className="card-elevated p-2 text-center">
                <p className="text-lg font-bold text-blue-500">{queueStats.processing}</p>
                <p className="text-[10px] text-muted-foreground">Processing</p>
              </div>
              <div className="card-elevated p-2 text-center">
                <p className="text-lg font-bold text-green-500">{queueStats.completed}</p>
                <p className="text-[10px] text-muted-foreground">Complete</p>
              </div>
              <div className="card-elevated p-2 text-center">
                <p className="text-lg font-bold text-muted-foreground">{queueStats.duplicate}</p>
                <p className="text-[10px] text-muted-foreground">Duplicate</p>
              </div>
              <div className="card-elevated p-2 text-center">
                <p className="text-lg font-bold text-red-500">{queueStats.failed}</p>
                <p className="text-[10px] text-muted-foreground">Failed</p>
              </div>
            </div>

            {/* Process Queue Button */}
            <div className="card-elevated p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <h3 className="font-medium text-foreground">Auto-Import Queue</h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { fetchQueueStats(); fetchScrapeSources(); }}
                  className="gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Process {queueStats.pending} pending URLs in the queue. Each batch scrapes and imports cigars automatically.
              </p>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => handleProcessQueue(50, true)}
                  disabled={processingQueue || queueStats.pending === 0}
                  className="flex-1"
                >
                  {processingQueue ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Process All ({queueStats.pending.toLocaleString()})
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleProcessQueue(50)}
                  disabled={processingQueue || queueStats.pending === 0}
                >
                  Process 50
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                "Process All" will continue in the background until complete. Refresh to see progress.
              </p>
            </div>

            {/* Data Sources */}
            <div className="card-elevated p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <h3 className="font-medium text-foreground">Data Sources</h3>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Map URLs from cigar databases to add them to the processing queue.
              </p>

              <div className="space-y-2">
                {scrapeSources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {source.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{source.total_urls_found} URLs</span>
                        <span>{source.total_processed} processed</span>
                        {source.last_mapped_at && (
                          <span>Last: {new Date(source.last_mapped_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMapUrls(source.name)}
                      disabled={mappingSource === source.name || !source.is_active}
                    >
                      {mappingSource === source.name ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-1" />
                          Map
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Search (existing) */}
            <div className="card-elevated p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <h3 className="font-medium text-foreground">Manual Search</h3>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Search and import individual cigars from Elite Cigar Library.
              </p>

              <div className="flex gap-2">
                <Input
                  value={scrapeQuery}
                  onChange={(e) => setScrapeQuery(e.target.value)}
                  placeholder="Search cigars (e.g., 'Padron', 'Fuente')"
                  onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                />
                <Button onClick={handleScrape} disabled={scraping}>
                  {scraping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {scrapedCigars.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Found {scrapedCigars.length} cigars
                </p>
                
                {scrapedCigars.map((cigar, index) => (
                  <div key={index} className="card-elevated p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">
                        {cigar.name || `${cigar.brand} ${cigar.line}`}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {cigar.vitola && (
                          <Badge variant="secondary" className="text-xs">{cigar.vitola}</Badge>
                        )}
                        {cigar.origin && (
                          <Badge variant="outline" className="text-xs">{cigar.origin}</Badge>
                        )}
                        {cigar.wrapper && (
                          <Badge variant="outline" className="text-xs">{cigar.wrapper}</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleImportCigar(cigar, index)}
                      disabled={importingIndex === index}
                    >
                      {importingIndex === index ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Import
                        </>
                      )}
                    </Button>
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
