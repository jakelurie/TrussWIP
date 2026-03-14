"use client";

import { useEffect, useState } from "react";
import { CITY_COORDS } from "@/lib/city-coords";

interface TechMapViewProps {
  techs: any[];
}

export default function TechMapView({ techs }: TechMapViewProps) {
  const [MapContainer, setMapContainer] = useState<any>(null);
  const [TileLayer, setTileLayer] = useState<any>(null);
  const [CircleMarker, setCircleMarker] = useState<any>(null);
  const [Popup, setPopup] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import("react-leaflet").then(mod => {
      setMapContainer(() => mod.MapContainer);
      setTileLayer(() => mod.TileLayer);
      setCircleMarker(() => mod.CircleMarker);
      setPopup(() => mod.Popup);
      setReady(true);
    });
  }, []);

  // Group techs by city — iterate all cities a tech is available in
  const cityGroups: Record<string, { coords: [number, number]; techs: any[] }> = {};
  techs.forEach(tech => {
    const techCities = tech.profiles?.cities?.length
      ? tech.profiles.cities
      : tech.profiles?.city ? [tech.profiles.city] : [];
    for (const city of techCities) {
      if (!city || !CITY_COORDS[city]) continue;
      if (!cityGroups[city]) {
        cityGroups[city] = { coords: CITY_COORDS[city], techs: [] };
      }
      cityGroups[city].techs.push(tech);
    }
  });

  if (!ready || !MapContainer) {
    return (
      <div className="h-[500px] bg-deep-stage rounded-lg flex items-center justify-center">
        <span className="font-mono text-sm text-aluminum">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="h-[500px] rounded-lg overflow-hidden border border-white/5">
      <MapContainer
        center={[39.5, -98.35]}
        zoom={4}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {Object.entries(cityGroups).map(([city, group]) => {
          const count = group.techs.length;
          const radius = Math.min(8 + count * 2, 24);
          return (
            <CircleMarker
              key={city}
              center={group.coords}
              radius={radius}
              fillColor="var(--color-signal-orange)"
              color="var(--color-signal-orange)"
              weight={1}
              opacity={0.8}
              fillOpacity={0.4}
            >
              <Popup>
                <div style={{ color: "#1a1a2e", minWidth: 140 }}>
                  <strong style={{ fontSize: 13 }}>{city}</strong>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>{count} tech{count !== 1 ? "s" : ""}</div>
                  {group.techs.slice(0, 5).map((t: any) => (
                    <div key={t.id} style={{ fontSize: 11, padding: "2px 0", borderBottom: "1px solid #eee" }}>
                      {t.profiles?.display_name} — {t.primary_skill}
                      {t.hourly_rate > 0 && <span style={{ color: "var(--color-signal-orange)" }}> ${t.hourly_rate}/hr</span>}
                    </div>
                  ))}
                  {count > 5 && <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>+{count - 5} more</div>}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
