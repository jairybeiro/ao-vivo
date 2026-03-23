import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const { name, plot, category_tag, type } = await req.json();
    if (!name) throw new Error("Nome é obrigatório");

    const mediaLabel = type === "series" ? "série" : "filme";
    const systemPrompt = `Você é um estrategista de conteúdo especializado em desenvolvimento pessoal e mentalidade empreendedora. Seu trabalho é analisar filmes e séries sob a ótica de crescimento, poder, liderança e negócios.

Escreva uma análise estratégica em português brasileiro, com tom premium e inspirador. A análise deve ter 3-4 parágrafos curtos e impactantes.

Estrutura:
1. Abertura: Por que este conteúdo é relevante para quem busca evolução
2. Lição Central: A principal lição de mentalidade/estratégia/poder extraída
3. Aplicação Prática: Como aplicar no mundo real dos negócios e da vida
4. Fechamento: Uma frase de impacto que motive a assistir

Use linguagem sofisticada mas acessível. Não use emojis. Não use bullet points.`;

    const userPrompt = `Analise o ${mediaLabel} "${name}" sob a perspectiva de "${category_tag || "Mentalidade"}".

${plot ? `Sinopse: ${plot}` : "Sinopse não disponível - baseie-se no seu conhecimento sobre o conteúdo."}

Gere uma análise estratégica que seria publicada em uma plataforma premium de curadoria cinematográfica focada em desenvolvimento pessoal.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      throw new Error(`AI gateway error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content || "Não foi possível gerar a análise.";

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
