import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Commis',
    short_name: 'Commis',
    description: 'Gestion de vos recettes personnelles et planning',
    start_url: '/',
    display: 'standalone',
    background_color: '#F4F1EA',
    theme_color: '#C4704B',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
