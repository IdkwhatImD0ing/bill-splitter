import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bills.art3m1s.me'
  
  // Base pages that are always included
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]

  // Fetch public bill pages from database
  const publicBillPages: MetadataRoute.Sitemap = []
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Get all public links
      const { data: publicLinks } = await supabase
        .from('public_links')
        .select('id, created_at')
        .order('created_at', { ascending: false })
      
      if (publicLinks) {
        for (const link of publicLinks) {
          publicBillPages.push({
            url: `${baseUrl}/bill/${link.id}`,
            lastModified: new Date(link.created_at),
            changeFrequency: 'monthly',
            priority: 0.7,
          })
        }
      }
    }
  } catch (error) {
    // If database fetch fails, continue with static pages only
    console.error('Failed to fetch public bills for sitemap:', error)
  }

  return [...staticPages, ...publicBillPages]
}

