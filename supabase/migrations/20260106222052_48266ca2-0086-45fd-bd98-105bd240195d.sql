-- Add embed_url column to channels table for automatic stream URL refresh
ALTER TABLE public.channels 
ADD COLUMN embed_url text;