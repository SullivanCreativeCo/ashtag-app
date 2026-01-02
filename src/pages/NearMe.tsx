import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Phone, Globe, Clock, Search, List, Map as MapIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Lounge {
  id: string;
  name: string;
  address: string;
  distance: string;
  phone?: string;
  website?: string;
  hours?: string;
  rating?: number;
  lat: number;
  lng: number;
  isOpen?: boolean;
}

type ViewType = "list" | "map";

export default function NearMe() {
  const [view, setView] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [lounges, setLounges] = useState<Lounge[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (error) {
        console.error("Failed to fetch Mapbox token:", error);
      }
    };
    fetchMapboxToken();
  }, []);

  // Get user location and fetch nearby lounges
  useEffect(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          await fetchNearbyLounges(location.lat, location.lng);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError("Enable location to find lounges near you");
          setLoading(false);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser");
      setLoading(false);
    }
  }, []);

  // Fetch nearby lounges from Google Places API
  const fetchNearbyLounges = async (lat: number, lng: number) => {
    try {
      console.log("Fetching nearby lounges for:", lat, lng);
      const { data, error } = await supabase.functions.invoke("search-nearby-lounges", {
        body: { lat, lng, radius: 16093 }, // 10 miles in meters
      });
      
      if (error) {
        console.error("Error fetching lounges:", error);
        throw error;
      }
      
      console.log("Received lounges:", data?.lounges?.length || 0);
      setLounges(data?.lounges || []);
    } catch (error) {
      console.error("Failed to fetch nearby lounges:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize map when viewing map tab
  useEffect(() => {
    if (view !== "map" || !mapContainer.current || !mapboxToken || !userLocation) return;
    if (map.current) return; // Already initialized

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [userLocation.lng, userLocation.lat],
      zoom: 13,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add user location marker
    new mapboxgl.Marker({ color: "hsl(25, 100%, 50%)" })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML("<strong>Your Location</strong>"))
      .addTo(map.current);

    // Add lounge markers
    filteredLounges.forEach((lounge) => {
      const marker = new mapboxgl.Marker({ color: "hsl(42, 100%, 55%)" })
        .setLngLat([lounge.lng, lounge.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <strong style="font-size: 14px;">${lounge.name}</strong>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">${lounge.address}</p>
              ${lounge.rating ? `<p style="margin: 4px 0; font-size: 12px;">★ ${lounge.rating}</p>` : ""}
            </div>
          `)
        )
        .addTo(map.current!);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [view, mapboxToken, userLocation]);

  // Update markers when lounges change
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    filteredLounges.forEach((lounge) => {
      const marker = new mapboxgl.Marker({ color: "hsl(42, 100%, 55%)" })
        .setLngLat([lounge.lng, lounge.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <strong style="font-size: 14px;">${lounge.name}</strong>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">${lounge.address}</p>
              ${lounge.rating ? `<p style="margin: 4px 0; font-size: 12px;">★ ${lounge.rating}</p>` : ""}
            </div>
          `)
        )
        .addTo(map.current!);
      markersRef.current.push(marker);
    });
  }, [searchQuery]);

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

        {locationError && !userLocation && (
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
                  {lounge.isOpen !== undefined && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className={lounge.isOpen ? "text-green-500" : "text-muted-foreground"}>
                        {lounge.isOpen ? "Open now" : "Closed"}
                      </span>
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
          /* Map View */
          <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-card">
            {mapboxToken ? (
              <div ref={mapContainer} className="h-full w-full" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
