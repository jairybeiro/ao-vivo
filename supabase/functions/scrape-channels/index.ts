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

    // Extract channel links – typical pattern: <a href="/channel-slug">
    // with an image (logo) and text (name)
    const channels: ScrapedChannel[] = [];

    // Pattern: links pointing to embed pages
    const linkRegex =
      /<a[^>]*href=["']([^"']*?)["'][^>]*>([\s\S]*?)<\/a>/gi;

    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const inner = match[2];

      // Skip external links and navigation
      if (
        !href ||
        href === "/" ||
        href === "#" ||
        href.startsWith("http") ||
        href.includes("javascript:")
      ) {
        continue;
      }

      // Extract channel name from text or alt attribute
      const nameMatch =
        inner.match(/<(?:span|p|h\d)[^>]*>(.*?)<\/(?:span|p|h\d)>/i) ||
        inner.match(/alt=["'](.*?)["']/i);
      const name = nameMatch
        ? nameMatch[1].replace(/<[^>]+>/g, "").trim()
        : inner.replace(/<[^>]+>/g, "").trim();

      if (!name || name.length < 2) continue;

      // Extract logo
      const imgMatch = inner.match(
        /(?:src|data-src)=["'](https?:\/\/[^"']+)["']/i
      );
      const logo = imgMatch ? imgMatch[1] : null;

      // Build full embed URL
      const embedUrl = href.startsWith("http")
        ? href
        : `https://embedcanaisonline.com${href.startsWith("/") ? "" : "/"}${href}`;

      // Simple category inference from name
      let category = "Variedades";
      const lowerName = name.toLowerCase();
      if (
        lowerName.includes("sport") ||
        lowerName.includes("espn") ||
        lowerName.includes("fox sports") ||
        lowerName.includes("premiere") ||
        lowerName.includes("combate")
      ) {
        category = "Esportes";
      } else if (
        lowerName.includes("news") ||
        lowerName.includes("notícia") ||
        lowerName.includes("globonews") ||
        lowerName.includes("cnn") ||
        lowerName.includes("band news") ||
        lowerName.includes("record news")
      ) {
        category = "Notícias";
      } else if (
        lowerName.includes("telecine") ||
        lowerName.includes("hbo") ||
        lowerName.includes("megapix") ||
        lowerName.includes("film") ||
        lowerName.includes("cine")
      ) {
        category = "Filmes";
      }

      // Avoid duplicates
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
