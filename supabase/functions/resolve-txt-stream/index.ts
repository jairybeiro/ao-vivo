const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Resolving TXT stream URL:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Fetch failed: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const text = await response.text();
    const trimmed = text.trim();

    // If the content IS an HLS playlist
    if (trimmed.startsWith('#EXTM3U')) {
      console.log('TXT is a valid HLS playlist, returning original URL');
      return new Response(
        JSON.stringify({ success: true, streamUrl: url, type: 'playlist' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look for m3u8 URLs in content
    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    
    const m3u8Line = lines.find(l => l.includes('.m3u8'));
    if (m3u8Line) {
      // Extract URL - might be the whole line or embedded
      const urlMatch = m3u8Line.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/);
      const resolved = urlMatch ? urlMatch[0] : m3u8Line;
      console.log('Resolved TXT to HLS URL:', resolved);
      return new Response(
        JSON.stringify({ success: true, streamUrl: resolved, type: 'resolved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try any HTTP URL
    const httpLine = lines.find(l => l.startsWith('http'));
    if (httpLine) {
      console.log('Resolved TXT to HTTP URL:', httpLine);
      return new Response(
        JSON.stringify({ success: true, streamUrl: httpLine, type: 'resolved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Nothing found - return original URL as fallback
    console.log('No URL found in TXT, returning original');
    return new Response(
      JSON.stringify({ success: true, streamUrl: url, type: 'passthrough' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
