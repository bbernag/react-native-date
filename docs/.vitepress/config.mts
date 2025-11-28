import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "react-native-date",
  description: "High-performance native date library for React Native",
  base: '/react-native-date/',
  themeConfig: {
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
