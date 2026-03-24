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

    // New structure: <div class="card" data-category="Esportes">
    //   <a aria-label="ESPN" class="thumb" href="https://2.embedcanaisonline.com/espn/">
    //     <img alt="ESPN" src="https://embedcanaisonline.com/images/espn.png">
    //   </a>
    //   <div class="title">ESPN</div>
    // </div>
    const cardRegex = /<div\s+class="card"[^>]*data-category="([^"]*)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;

    let match;
    while ((match = cardRegex.exec(html)) !== null) {
      const category = match[1] || "Variedades";
      const cardHtml = match[2];

      // Extract embed URL from the <a> tag
      const hrefMatch = cardHtml.match(/<a[^>]*href="([^"]+)"[^>]*>/i);
      if (!hrefMatch) continue;
      const embedUrl = hrefMatch[1];

      // Extract name from aria-label or <div class="title">
      const titleMatch = cardHtml.match(/<div\s+class="title"[^>]*>(?:<[^>]+>)*(.*?)(?:<\/[^>]+>)*<\/div>/i);
      const ariaMatch = cardHtml.match(/aria-label="([^"]+)"/i);
      const name = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : 
                   ariaMatch ? ariaMatch[1].trim() : "";

      if (!name || name.length < 2) continue;

      // Extract logo from <img> src
      const imgMatch = cardHtml.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
      const logo = imgMatch ? imgMatch[1] : null;

      // Skip duplicates
      if (!channels.find((c) => c.embedUrl === embedUrl)) {
        channels.push({ name, embedUrl, category, logo });
      }
    }

    console.log(`Found ${channels.length} channels`);

    if (channels.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Nenhum canal encontrado na página",
          htmlPreview: html.substring(0, 500),
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
