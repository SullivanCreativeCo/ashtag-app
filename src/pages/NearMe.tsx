import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Phone, Globe, Clock, Search, List, Map as MapIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lounge {
  id: string;
  name: string;
  address: string;
  distance: string;
  phone?: string;
  website?: string;
  hours?: string;
  rating?: number;
}

// Mock data for lounges - in production this would come from Google Maps API
const mockLounges: Lounge[] = [
  {
    id: "1",
    name: "The Velvet Cigar Lounge",
    address: "123 Main St, Downtown",
    distance: "0.3 mi",
    phone: "(555) 123-4567",
    website: "https://velvetcigar.com",
    hours: "Open until 11 PM",
    rating: 4.8,
  },
  {
    id: "2",
    name: "Smoke & Oak",
    address: "456 Oak Avenue",
    distance: "1.2 mi",
    phone: "(555) 234-5678",
    hours: "Open until 10 PM",
    rating: 4.5,
  },
  {
    id: "3",
    name: "Churchill's Reserve",
    address: "789 Heritage Blvd",
    distance: "2.4 mi",
    phone: "(555) 345-6789",
    website: "https://churchillsreserve.com",
    hours: "Open until 12 AM",
    rating: 4.9,
  },
  {
    id: "4",
    name: "The Leaf & Ember",
    address: "321 Tobacco Lane",
    distance: "3.1 mi",
    phone: "(555) 456-7890",
    hours: "Open until 9 PM",
    rating: 4.3,
  },
];

type ViewType = "list" | "map";

export default function NearMe() {
  const [view, setView] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [lounges, setLounges] = useState<Lounge[]>(mockLounges);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate getting user location
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In production, we'd use this to fetch nearby lounges
          console.log("Location:", position.coords);
          setLoading(false);
        },
        (error) => {
          setLocationError("Enable location to find lounges near you");
          setLoading(false);
        }
      );
    }
  }, []);

  const filteredLounges = lounges.filter(
    (lounge) =>
      lounge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lounge.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="py-4 space-y-4">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Near Me
        </h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lounges..."
            className="bg-card pl-10"
          />
        </div>

        {/* View toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
            List
          </button>
          <button
            onClick={() => setView("map")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              view === "map"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <MapIcon className="h-4 w-4" />
            Map
          </button>
        </div>

        {locationError && (
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <MapPin className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{locationError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : view === "list" ? (
          <div className="space-y-3">
            {filteredLounges.map((lounge) => (
              <div
                key={lounge.id}
                className="rounded-xl border border-border bg-card p-4 animate-fade-in"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {lounge.name}
                    </h3>
                    {lounge.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-sm font-medium text-primary">
                          ★ {lounge.rating}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {lounge.distance}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{lounge.address}</span>
                  </div>
                  {lounge.hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{lounge.hours}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  {lounge.phone && (
                    <a
                      href={`tel:${lounge.phone}`}
                      className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </a>
                  )}
                  {lounge.website && (
                    <a
                      href={lounge.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      lounge.name + " " + lounge.address
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Navigation className="h-4 w-4" />
                    Directions
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Map View Placeholder */
          <div className="aspect-square w-full overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <MapIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground">Map View</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect Google Maps API to enable map view
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
