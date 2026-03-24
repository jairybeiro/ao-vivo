const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOURCE_URL = "https://embedcanaisonline.com/";

interface ScrapedChannel {
  name: string;
  embedUrl: string;
  category: string;
  logo: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fetching page from", SOURCE_URL);
    const res = await fetch(SOURCE_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch source: ${res.status}`);
    }

    const html = await res.text();
    const channels: ScrapedChannel[] = [];

    // Strategy: split by <h2> category headers, then parse cards within each section
    // Pattern: <h2 ...>Category Name</h2> followed by <div class="card">...</div> blocks
    
    // First, find all category sections by splitting on h2 tags
    const sectionRegex = /<h2[^>]*>(.*?)<\/h2>([\s\S]*?)(?=<h2|<\/main|$)/gi;
    let sectionMatch;
    
    while ((sectionMatch = sectionRegex.exec(html)) !== null) {
      const categoryRaw = sectionMatch[1].replace(/<[^>]+>/g, "").trim();
      const category = categoryRaw || "Variedades";
      const sectionHtml = sectionMatch[2];
      
      // Find all cards in this section
      const cardRegex = /<div\s+class="card"[^>]*>([\s\S]*?)<\/div>\s*<div\s+class="embedrow">/gi;
      let cardMatch;
      
      while ((cardMatch = cardRegex.exec(sectionHtml)) !== null) {
        const cardHtml = cardMatch[1];
        
        // Extract embed URL from <a> href
        const hrefMatch = cardHtml.match(/<a[^>]*href="([^"]+)"[^>]*>/i);
        if (!hrefMatch) continue;
        const embedUrl = hrefMatch[1];
        
        // Extract name from aria-label
        const ariaMatch = cardHtml.match(/aria-label="([^"]+)"/i);
        const name = ariaMatch ? ariaMatch[1].trim() : "";
        
        if (!name || name.length < 2) continue;
        
        // Extract logo from <img> src
        const imgMatch = cardHtml.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
        const logo = imgMatch ? imgMatch[1] : null;
        
        if (!channels.find((c) => c.embedUrl === embedUrl)) {
          channels.push({ name, embedUrl, category, logo });
        }
      }
    }
    
    // Fallback: if section approach found nothing, try simple card extraction
    if (channels.length === 0) {
      const simpleCardRegex = /<div\s+class="card"[^>]*>[\s\S]*?<a[^>]*aria-label="([^"]*)"[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<div\s+class="title"[^>]*>([\s\S]*?)<\/div>/gi;
      let simpleMatch;
      
      while ((simpleMatch = simpleCardRegex.exec(html)) !== null) {
        const ariaName = simpleMatch[1].trim();
        const embedUrl = simpleMatch[2];
        const logo = simpleMatch[3];
        const titleName = simpleMatch[4].replace(/<[^>]+>/g, "").trim();
        const name = titleName || ariaName;
        
        if (!name || name.length < 2) continue;
        if (!channels.find((c) => c.embedUrl === embedUrl)) {
          channels.push({ name, embedUrl, category: "Variedades", logo });
        }
      }
    }

    console.log(`Found ${channels.length} channels`);

    if (channels.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Nenhum canal encontrado na página",
          htmlPreview: html.substring(0, 1000),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insert into database using service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    let inserted = 0;
    let skipped = 0;

    for (const ch of channels) {
      const checkRes = await fetch(
        `${supabaseUrl}/rest/v1/channels?embed_url=eq.${encodeURIComponent(ch.embedUrl)}&select=id`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      const existing = await checkRes.json();

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      const insertRes = await fetch(`${supabaseUrl}/rest/v1/channels`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          name: ch.name,
          category: ch.category,
          logo: ch.logo,
          embed_url: ch.embedUrl,
          stream_urls: ["placeholder"],
          is_live: true,
        }),
      });

      if (insertRes.ok) {
        inserted++;
      } else {
        const err = await insertRes.text();
        console.error(`Failed to insert ${ch.name}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: channels.length,
        inserted,
        skipped,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Scrape error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
