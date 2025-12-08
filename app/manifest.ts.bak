import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nexo - Jogos de Palavras',
    short_name: 'Nexo',
    description: 'Plataforma de jogos de palavras em português. Palavras cruzadas, sopa de letras e mais!',
    start_url: '/',
    display: 'standalone',
    background_color: '#030014',
    theme_color: '#030014',
    orientation: 'any',
    scope: '/',
    lang: 'pt-PT',
    dir: 'ltr',
    categories: ['games', 'entertainment', 'education'],
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/desktop-home.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide' as const,
        label: 'Nexo Homepage - Desktop',
      },
      {
        src: '/screenshots/mobile-home.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow' as const,
        label: 'Nexo Homepage - Mobile',
      },
    ],
    shortcuts: [
      {
        name: 'Palavras Cruzadas',
        short_name: 'Cruzadas',
        description: 'Jogar palavras cruzadas',
        url: '/palavras-cruzadas',
        icons: [{ src: '/icons/crossword-shortcut.png', sizes: '96x96' }],
      },
      {
        name: 'Sopa de Letras',
        short_name: 'Sopa',
        description: 'Jogar sopa de letras',
        url: '/sopa-de-letras',
        icons: [{ src: '/icons/wordsearch-shortcut.png', sizes: '96x96' }],
      },
      {
        name: 'Leaderboards',
        short_name: 'Rankings',
        description: 'Ver classificações',
        url: '/leaderboards',
        icons: [{ src: '/icons/leaderboard-shortcut.png', sizes: '96x96' }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  }
}
