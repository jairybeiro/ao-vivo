const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { embedUrl } = await req.json();

    if (!embedUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'embedUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching embed page:', embedUrl);

    // Fetch the embed page
    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': embedUrl,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch embed page:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch embed: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    console.log('Received HTML length:', html.length);

    // Try multiple patterns to find the m3u8 URL
    const patterns = [
      // Direct m3u8 URL patterns
      /["']?(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*?)["']/gi,
      // Source patterns in video/script tags
      /source\s*[=:]\s*["']?(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*?)["']/gi,
      // File/src patterns
      /(?:file|src|url|source)\s*[=:]\s*["']?(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*?)["']/gi,
      // Hls.loadSource patterns
      /loadSource\s*\(\s*["']?(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*?)["']/gi,
      // Generic token URL pattern (like the example)
      /["']?(https?:\/\/[^"'\s]*\/token\/[^"'\s]+\.m3u8[^"'\s]*?)["']/gi,
    ];

    let m3u8Url: string | null = null;

    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const url = match[1] || match[0].replace(/["']/g, '');
        if (url && url.includes('.m3u8')) {
          m3u8Url = url;
          console.log('Found m3u8 URL:', m3u8Url);
          break;
        }
      }
      if (m3u8Url) break;
    }

    if (!m3u8Url) {
      console.log('No m3u8 URL found in HTML');
      // Log a snippet for debugging
      const snippet = html.substring(0, 2000);
      console.log('HTML snippet:', snippet);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not find m3u8 URL in embed page. The page may use JavaScript to generate the URL.' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the URL (remove escape characters if any)
    m3u8Url = m3u8Url.replace(/\\/g, '');

    console.log('Returning m3u8 URL:', m3u8Url);

    return new Response(
      JSON.stringify({ success: true, streamUrl: m3u8Url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
