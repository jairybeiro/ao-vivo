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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
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
      headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch source: ${response.status}`);
    }

    const html = await response.text();

    // Parse channels from HTML
    const channels: Array<{
      name: string;
      logo: string;
      embedUrl: string;
      category: string;
    }> = [];

    // Track current category from h2 headers
    let currentCategory = "Variedades";

    // Split by cards and category headers
    const parts = html.split(/(<h2[^>]*data-category-title[^>]*>|<div class="card")/);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      // Check for category header
      if (part.includes("data-category-title")) {
        const catMatch = parts[i + 1]?.match(/data-category-title="([^"]+)"/);
        if (!catMatch) {
          // Try in current part
          const catMatch2 = part.match(/data-category-title="([^"]+)"/);
          if (catMatch2) currentCategory = catMatch2[1];
        } else {
          currentCategory = catMatch[1];
        }
        continue;
      }

      if (!part.includes('class="card"')) continue;

      // Get the card content (next part)
      const cardHtml = parts[i + 1] || "";

      // Extract category from data-category attribute  
      const dataCatMatch = cardHtml.match(/data-category="([^"]+)"/);
      if (dataCatMatch) {
        currentCategory = dataCatMatch[1];
      }

      // Extract name from aria-label
      const nameMatch = cardHtml.match(/aria-label="([^"]+)"/);
      if (!nameMatch) continue;
      const name = nameMatch[1];

      // Extract logo from img src
      const logoMatch = cardHtml.match(/src="(https:\/\/embedcanaisonline\.com\/images\/[^"]+)"/);
      const logo = logoMatch ? logoMatch[1] : "";

      // Extract embed URL from iframe src inside input value
      const iframeMatch = cardHtml.match(/src=&quot;(https:\/\/embedcanaisonline\.com\/[^&]+)&quot;/);
      if (!iframeMatch) continue;
      const embedUrl = iframeMatch[1];

      // Get display name from .title span or div
      const titleMatch = cardHtml.match(/<div class="title">(?:<span[^>]*>)?([^<]+)/);
      const displayName = titleMatch ? titleMatch[1].trim() : name;

      channels.push({
        name: displayName || name,
        logo,
        embedUrl,
        category: currentCategory,
      });
    }

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
      .select("id, name, embed_url");

    const existingMap = new Map(
      (existingChannels || []).map((ch) => [ch.name.toLowerCase().trim(), ch])
    );

    let updated = 0;
    let created = 0;

    for (const ch of channels) {
      const key = ch.name.toLowerCase().trim();
      const existing = existingMap.get(key);

      if (existing) {
        // Update embed_url and logo if changed
        if (existing.embed_url !== ch.embedUrl) {
          const { error } = await adminClient
            .from("channels")
            .update({
              embed_url: ch.embedUrl,
              logo: ch.logo || existing.embed_url,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (!error) updated++;
        }
      } else {
        // Create new channel
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
      JSON.stringify({
        success: true,
        total: channels.length,
        updated,
        created,
      }),
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
