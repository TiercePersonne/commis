import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Commis',
    short_name: 'Commis',
    description: 'Gestion de vos recettes personnelles et planning',
    start_url: '/',
    display: 'standalone',
    background_color: '#130F0D',
    theme_color: '#130F0D',
    share_target: {
      action: '/import',
      method: 'GET',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    },
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
