import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'RDP-Connector',
  description: 'A Tauri App for wrapping the usage of *.rdpx files with freerdp',
  base: '/rdp-connector/', // Use repository name as base if deploying to GitHub Pages
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', href: '/assets/rdp-connector-icon.svg' }],
  ],

  sitemap: {
    hostname: 'https://mike-boddin.github.io/rdp-connector/',
  },
  themeConfig: {
    logo: '/assets/rdp-connector-icon-light.svg',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Changelog', link: '/changelog' },
      { text: 'Releases', link: 'https://github.com/mike-boddin/rdp-connector/releases' },
    ],

    sidebar: [
      {
        text: 'Documentation',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Changelog', link: '/changelog' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mike-boddin/rdp-connector' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present Mike Boddin',
    },
  },
});
