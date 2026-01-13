import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Phone, Globe, Clock, Search, List, Map as MapIcon, Loader2, Star } from "lucide-react";
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

  const fetchNearbyLounges = async (lat: number, lng: number) => {
    try {
      const { data, error } = await supabase.functions.invoke("search-nearby-lounges", {
        body: { lat, lng, radius: 16093 },
      });
      
      if (error) throw error;
      setLounges(data?.lounges || []);
    } catch (error) {
      console.error("Failed to fetch nearby lounges:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view !== "map" || !mapContainer.current || !mapboxToken || !userLocation) return;
    if (map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [userLocation.lng, userLocation.lat],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    new mapboxgl.Marker({ color: "hsl(38, 70%, 57%)" })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML("<strong>Your Location</strong>"))
      .addTo(map.current);

    filteredLounges.forEach((lounge) => {
      const marker = new mapboxgl.Marker({ color: "hsl(38, 70%, 57%)" })
        .setLngLat([lounge.lng, lounge.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; background: #1a1a1a; color: #fff; border-radius: 8px;">
              <strong style="font-size: 14px; color: #dfa245;">${lounge.name}</strong>
              <p style="margin: 4px 0; font-size: 12px; color: #888;">${lounge.address}</p>
              ${lounge.rating ? `<p style="margin: 4px 0; font-size: 12px; color: #dfa245;">★ ${lounge.rating}</p>` : ""}
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

  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    filteredLounges.forEach((lounge) => {
      const marker = new mapboxgl.Marker({ color: "hsl(38, 70%, 57%)" })
        .setLngLat([lounge.lng, lounge.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; background: #1a1a1a; color: #fff; border-radius: 8px;">
              <strong style="font-size: 14px; color: #dfa245;">${lounge.name}</strong>
              <p style="margin: 4px 0; font-size: 12px; color: #888;">${lounge.address}</p>
              ${lounge.rating ? `<p style="margin: 4px 0; font-size: 12px; color: #dfa245;">★ ${lounge.rating}</p>` : ""}
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
      <div className="py-5 space-y-5 px-1">
        <h1 className="font-display text-3xl font-semibold text-foreground px-2">
          Near Me
        </h1>

        {/* Search */}
        <div className="relative px-2">
          <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lounges..."
            className="input-glass pl-10"
          />
        </div>

        {/* Premium pill toggle */}
        <div className="flex justify-start px-2">
          <div className="pill-toggle">
            <div 
              className="pill-toggle-indicator"
              style={{
                left: view === "list" ? "4px" : "calc(50%)",
                width: "calc(50% - 4px)"
              }}
            />
            <button
              onClick={() => setView("list")}
              className={cn(
                "pill-toggle-item flex items-center gap-2",
                view === "list" && "active"
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setView("map")}
              className={cn(
                "pill-toggle-item flex items-center gap-2",
                view === "map" && "active"
              )}
            >
              <MapIcon className="h-4 w-4" />
              Map
            </button>
          </div>
        </div>

        {locationError && !userLocation && (
          <div className="card-glass p-6 text-center mx-2">
            <MapPin className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground font-body">{locationError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium transition-colors hover:bg-muted/80"
            >
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : view === "list" ? (
          <div className="space-y-3 px-2">
            {filteredLounges.map((lounge, index) => (
              <div
                key={lounge.id}
                className="card-leather p-4 stagger-item"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {lounge.name}
                    </h3>
                    {lounge.rating && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star className="h-4 w-4 text-primary fill-primary" />
                        <span className="text-sm font-medium text-primary font-body">
                          {lounge.rating}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-primary font-body">
                    {lounge.distance}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-sm text-muted-foreground font-body">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{lounge.address}</span>
                  </div>
                  {lounge.isOpen !== undefined && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span className={lounge.isOpen ? "text-emerald-400" : "text-muted-foreground"}>
                        {lounge.isOpen ? "Open now" : "Closed"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  {lounge.phone && (
                    <a
                      href={`tel:${lounge.phone}`}
                      className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2 text-sm font-medium text-foreground font-body transition-colors hover:bg-muted"
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
                      className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2 text-sm font-medium text-foreground font-body transition-colors hover:bg-muted"
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
                    className="flex items-center gap-1.5 rounded-lg btn-glow px-4 py-2 text-sm font-medium text-primary-foreground font-body"
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
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/30 mx-2">
            {mapboxToken ? (
              <div ref={mapContainer} className="h-full w-full" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center bg-card">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground font-body">Loading map...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
