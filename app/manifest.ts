import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'My Queen App',
        short_name: 'MQapp',
        description: 'A simple app to show my love for my queen',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
          {
            src: '/icon-48x48.ico',
            sizes: '48x48',
            type: 'image/ico',
          },
          {
            src: '/icon-72x72.ico',
            sizes: '72x72',
            type: 'image/ico',
          },
          {
            src: '/icon-96x96.ico',
            sizes: '96x96',
            type: 'image/ico',
          },
          {
            src: '/icon-144x144.ico',
            sizes: '144x144',
            type: 'image/ico',
          },
          {
            src: '/icon-192x192.ico',
            sizes: '192x192',
            type: 'image/ico',
          },
          {
            src: '/icon-256x256.ico',
            sizes: '256x256',
            type: 'image/ico',
          },
          {
            src: '/icon.webp',
            sizes: '384x384',
            type: 'image/webp',
          },
          {
            src: '/icon.webp',
            sizes: '512x512',
            type: 'image/webp',
          },
        ],
      }
    }