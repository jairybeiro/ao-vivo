import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PremiumContent {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  streamUrls: string[];
  embedUrl: string | null;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DBPremiumContent {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  stream_urls: string[];
  embed_url: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const mapDBToContent = (db: DBPremiumContent): PremiumContent => ({
  id: db.id,
  title: db.title,
  description: db.description,
  thumbnailUrl: db.thumbnail_url,
  streamUrls: db.stream_urls,
  embedUrl: db.embed_url,
  category: db.category,
  isActive: db.is_active,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export const usePremiumContent = () => {
  const [content, setContent] = useState<PremiumContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("premium_content")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar conteúdo premium:", error);
    } else {
      setContent((data as DBPremiumContent[]).map(mapDBToContent));
    }
    setLoading(false);
  };

  const getContentById = (id: string) => {
    return content.find((c) => c.id === id);
  };

  return { content, loading, refetch: fetchContent, getContentById };
};

export const usePremiumContentAdmin = () => {
  const [content, setContent] = useState<PremiumContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("premium_content")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar conteúdo premium:", error);
    } else {
      setContent((data as DBPremiumContent[]).map(mapDBToContent));
    }
    setLoading(false);
  };

  const createContent = async (
    contentData: Omit<PremiumContent, "id" | "createdAt" | "updatedAt">
  ) => {
    const { error } = await supabase.from("premium_content").insert({
      title: contentData.title,
      description: contentData.description,
      thumbnail_url: contentData.thumbnailUrl,
      stream_urls: contentData.streamUrls,
      embed_url: contentData.embedUrl,
      category: contentData.category,
      is_active: contentData.isActive,
    });

    if (error) throw error;
    await fetchContent();
  };

  const updateContent = async (id: string, contentData: Partial<PremiumContent>) => {
    const updateData: Record<string, unknown> = {};
    if (contentData.title !== undefined) updateData.title = contentData.title;
    if (contentData.description !== undefined) updateData.description = contentData.description;
    if (contentData.thumbnailUrl !== undefined) updateData.thumbnail_url = contentData.thumbnailUrl;
    if (contentData.streamUrls !== undefined) updateData.stream_urls = contentData.streamUrls;
    if (contentData.embedUrl !== undefined) updateData.embed_url = contentData.embedUrl;
    if (contentData.category !== undefined) updateData.category = contentData.category;
    if (contentData.isActive !== undefined) updateData.is_active = contentData.isActive;

    const { error } = await supabase
      .from("premium_content")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;
    await fetchContent();
  };

  const deleteContent = async (id: string) => {
    const { error } = await supabase
      .from("premium_content")
      .delete()
      .eq("id", id);

    if (error) throw error;
    await fetchContent();
  };

  return { content, loading, createContent, updateContent, deleteContent, refetch: fetchContent };
};
