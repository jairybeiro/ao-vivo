import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin
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

    // Check admin role
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

    // Fetch HTML from source
    const sourceUrl = "https://embedcanaisonline.com/";
    const response = await fetch(sourceUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch source: ${response.status}`);
    }

    const html = await response.text();

    // Parse channels from HTML using card-by-card regex
    const channels: Array<{
      name: string;
      logo: string;
      embedUrl: string;
      category: string;
    }> = [];

    // Extract category headers positions
    const categoryHeaders: Array<{ index: number; category: string }> = [];
    const catRegex = /data-category-title="([^"]+)"/g;
    let catMatch;
    while ((catMatch = catRegex.exec(html)) !== null) {
      categoryHeaders.push({ index: catMatch.index, category: catMatch[1] });
    }

    // Extract each card
    const cardRegex = /<div class="card" data-category="([^"]+)">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
    let cardMatch;
    while ((cardMatch = cardRegex.exec(html)) !== null) {
      const category = cardMatch[1];
      const cardHtml = cardMatch[2];

      // Extract name from aria-label
      const nameMatch = cardHtml.match(/aria-label="([^"]+)"/);
      if (!nameMatch) continue;
      const name = nameMatch[1];

      // Extract logo
      const logoMatch = cardHtml.match(/src="(https:\/\/embedcanaisonline\.com\/images\/[^"]+)"/);
      const logo = logoMatch ? logoMatch[1] : "";

      // Extract embed URL from input value
      const embedMatch = cardHtml.match(/src=&quot;(https:\/\/embedcanaisonline\.com\/[^&]+)&quot;/);
      if (!embedMatch) continue;
      const embedUrl = embedMatch[1];

      channels.push({ name, logo, embedUrl, category });
    }

    console.log(`Scraped ${channels.length} channels from source`);

    if (channels.length === 0) {
      return new Response(
        JSON.stringify({ error: "No channels found in source", updated: 0, created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for upserts
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get existing channels
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
