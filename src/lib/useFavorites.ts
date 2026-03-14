import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export function useFavorites(producerId: string | null) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (producerId) loadFavorites();
  }, [producerId]);

  const loadFavorites = async () => {
    if (!producerId) return;
    const { data } = await supabase.from("favorites")
      .select("tech_id").eq("producer_id", producerId);
    setFavorites(new Set((data || []).map(f => f.tech_id)));
    setLoading(false);
  };

  const toggleFavorite = async (techId: string) => {
    if (!producerId) return;

    if (favorites.has(techId)) {
      await supabase.from("favorites").delete()
        .eq("producer_id", producerId).eq("tech_id", techId);
      const updated = new Set(favorites);
      updated.delete(techId);
      setFavorites(updated);
    } else {
      await supabase.from("favorites").insert({
        producer_id: producerId,
        tech_id: techId,
      });
      const updated = new Set(favorites);
      updated.add(techId);
      setFavorites(updated);
    }
  };

  const isFavorite = (techId: string) => favorites.has(techId);

  return { favorites, toggleFavorite, isFavorite, loading };
}