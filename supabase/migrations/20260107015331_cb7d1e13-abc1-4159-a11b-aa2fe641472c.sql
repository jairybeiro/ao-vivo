-- Criar tabela para gerenciar anúncios nativos
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sidebar', 'below_player', 'preroll')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cta_text TEXT DEFAULT 'Saiba mais',
  cta_url TEXT,
  image_url TEXT,
  duration INTEGER DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem visualizar anúncios ativos (para exibição no frontend)
CREATE POLICY "Anúncios ativos são visíveis para todos"
ON public.ads
FOR SELECT
USING (is_active = true);

-- Política: Admins podem ver todos os anúncios
CREATE POLICY "Admins podem ver todos os anúncios"
ON public.ads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Política: Admins podem criar anúncios
CREATE POLICY "Admins podem criar anúncios"
ON public.ads
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Política: Admins podem atualizar anúncios
CREATE POLICY "Admins podem atualizar anúncios"
ON public.ads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Política: Admins podem deletar anúncios
CREATE POLICY "Admins podem deletar anúncios"
ON public.ads
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();