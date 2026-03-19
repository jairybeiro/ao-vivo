import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseChannels(html: string) {
  const channels: Array<{
    name: string;
    logo: string;
    embedUrl: string;
    category: string;
  }> = [];

  // Build category index from h2 headers (text content)
  const catHeaders: Array<{ pos: number; cat: string }> = [];
  const catRe = /<h2[^>]*>([^<]+)<\/h2>/g;
  let cm;
  while ((cm = catRe.exec(html)) !== null) {
    catHeaders.push({ pos: cm.index, cat: cm[1].trim() });
  }

  function getCategoryAt(pos: number): string {
    let cat = "Variedades";
    for (const h of catHeaders) {
      if (h.pos < pos) cat = h.cat;
      else break;
    }
    return cat;
  }

  // Match each card block: starts with <div class="card"> ends with </div> before next card or h2
  const cardRe = /<div class="card">\s*<a aria-label="([^"]+)"[^>]*href="([^"]*)"[^>]*>\s*<img[^>]*src="([^"]*)"[^>]*\/?\s*>\s*<\/a>\s*<div class="title">[\s\S]*?<\/div>\s*<div class="embedrow"><input[^>]*value='[^']*src="([^"]*)"[^']*'[^>]*\/?\s*><\/div>\s*<\/div>/g;

  let m;
  while ((m = cardRe.exec(html)) !== null) {
    const name = m[1];
    const logo = m[3];
    const embedUrl = m[4];
    const category = getCategoryAt(m.index);
    channels.push({ name, logo, embedUrl, category });
  }

  return channels;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sourceUrl = "https://embedcanaisonline.com/";
    const response = await fetch(sourceUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch source: ${response.status}`);
    }

    const html = await response.text();
    const channels = parseChannels(html);

    console.log(`Scraped ${channels.length} channels from source`);

    if (channels.length === 0) {
      return new Response(
        JSON.stringify({ error: "No channels found in source", updated: 0, created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existingChannels } = await adminClient
      .from("channels")
      .select("id, name, embed_url, logo");

    const existingMap = new Map(
      (existingChannels || []).map((ch) => [ch.name.toLowerCase().trim(), ch])
    );

    let updated = 0;
    let created = 0;

    for (const ch of channels) {
      const key = ch.name.toLowerCase().trim();
      const existing = existingMap.get(key);

      if (existing) {
        if (existing.embed_url !== ch.embedUrl) {
          const { error } = await adminClient
            .from("channels")
            .update({
              embed_url: ch.embedUrl,
              logo: ch.logo || existing.logo,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          if (!error) updated++;
        }
      } else {
        const { error } = await adminClient.from("channels").insert({
          name: ch.name,
          category: ch.category,
          logo: ch.logo || null,
          embed_url: ch.embedUrl,
          stream_urls: [],
          is_live: true,
        });
        if (!error) created++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, total: channels.length, updated, created }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scrape error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
