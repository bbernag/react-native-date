import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "react-native-date",
  description: "The fastest date library for React Native. Powered by C++ and Nitro Modules.",
  base: '/react-native-date/',
  head: [
    ['link', { rel: 'icon', href: '/react-native-date/icon.png' }]
  ],
  themeConfig: {
    logo: '/icon.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/examples' },
      { text: 'API', link: '/api-reference' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/' },
          { text: 'Installation', link: '/#installation' },
        ]
      },
      {
        text: 'Usage',
        items: [
          { text: 'Examples', link: '/examples' },
          { text: 'Locales & i18n', link: '/locales' },
          { text: 'API Reference', link: '/api-reference' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/bbernag/react-native-date' }
    ]
  }
})
