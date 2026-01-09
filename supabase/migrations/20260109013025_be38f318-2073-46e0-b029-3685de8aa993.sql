-- Create premium_content table for exclusive content
CREATE TABLE public.premium_content (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    stream_urls TEXT[] NOT NULL DEFAULT '{}',
    embed_url TEXT,
    category TEXT DEFAULT 'Geral',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.premium_content ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view premium content
CREATE POLICY "Authenticated users can view premium content" 
ON public.premium_content 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Only admins can manage premium content
CREATE POLICY "Admins can manage premium content" 
ON public.premium_content 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_premium_content_updated_at
BEFORE UPDATE ON public.premium_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();