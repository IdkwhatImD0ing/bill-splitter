import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bill Splitter',
    short_name: 'Bill Splitter',
    description: 'Split bills and track who owes what with Bill Splitter. Upload receipts, create bill splits, and share with friends.',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf8f5',
    theme_color: '#c4663a',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/apple-touch-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
      },
    ],
    categories: ['finance', 'utilities'],
  }
}

