import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// This function is public and doesn't require authentication
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const SITE_URL = 'https://elathosemijoias.com.br'

const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/sobre', priority: '0.8', changefreq: 'monthly' },
  { url: '/faq', priority: '0.7', changefreq: 'monthly' },
  { url: '/contato', priority: '0.7', changefreq: 'monthly' },
  { url: '/cuidados', priority: '0.6', changefreq: 'monthly' },
  { url: '/trocas', priority: '0.6', changefreq: 'monthly' },
  { url: '/privacidade', priority: '0.5', changefreq: 'yearly' },
  { url: '/rastreio', priority: '0.5', changefreq: 'monthly' },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all products
    const { data: produtos, error } = await supabase
      .from('produtos')
      .select('id, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
      throw error
    }

    const today = new Date().toISOString().split('T')[0]

    // Build XML sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`
    }

    // Add product pages
    if (produtos && produtos.length > 0) {
      for (const produto of produtos) {
        const lastmod = new Date(produto.created_at).toISOString().split('T')[0]
        xml += `  <url>
    <loc>${SITE_URL}/produto/${produto.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`
      }
    }

    xml += `</urlset>`

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
