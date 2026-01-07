/**
 * Hook para gerenciar anúncios do Supabase
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Ad {
  id: string;
  name: string;
  type: "sidebar" | "below_player" | "preroll";
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string | null;
  imageUrl: string | null;
  duration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdRow {
  id: string;
  name: string;
  type: string;
  title: string;
  description: string;
  cta_text: string;
  cta_url: string | null;
  image_url: string | null;
  duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar anúncios:", error);
      setAds([]);
    } else {
      setAds(
        (data as AdRow[] || []).map((ad) => ({
          id: ad.id,
          name: ad.name,
          type: ad.type as Ad["type"],
          title: ad.title,
          description: ad.description,
          ctaText: ad.cta_text,
          ctaUrl: ad.cta_url,
          imageUrl: ad.image_url,
          duration: ad.duration,
          isActive: ad.is_active,
          createdAt: ad.created_at,
          updatedAt: ad.updated_at,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  return { ads, loading, refetch: fetchAds };
}

export function useActiveAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveAds = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("is_active", true);

      if (error) {
        console.error("Erro ao buscar anúncios ativos:", error);
        setAds([]);
      } else {
        setAds(
          (data as AdRow[] || []).map((ad) => ({
            id: ad.id,
            name: ad.name,
            type: ad.type as Ad["type"],
            title: ad.title,
            description: ad.description,
            ctaText: ad.cta_text,
            ctaUrl: ad.cta_url,
            imageUrl: ad.image_url,
            duration: ad.duration,
            isActive: ad.is_active,
            createdAt: ad.created_at,
            updatedAt: ad.updated_at,
          }))
        );
      }
      setLoading(false);
    };

    fetchActiveAds();
  }, []);

  const getSidebarAd = () => ads.find((ad) => ad.type === "sidebar");
  const getBelowPlayerAd = () => ads.find((ad) => ad.type === "below_player");
  const getPrerollAd = () => ads.find((ad) => ad.type === "preroll");

  return { 
    ads, 
    loading, 
    getSidebarAd, 
    getBelowPlayerAd, 
    getPrerollAd 
  };
}
