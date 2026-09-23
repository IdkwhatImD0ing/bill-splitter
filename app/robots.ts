import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bills.art3m1s.me'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/receipts/', '/login'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

