import type { Config } from '@docusaurus/types';

const config: Config = {
  title: 'Knowledge Base',
  tagline: 'Documentation and knowledge articles',
  url: 'https://hophanminh.github.io',
  baseUrl: '/knowledgebase/',

  organizationName: 'Tech',
  projectName: 'knowledgebase',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Knowledge Base',
      logo: {
        alt: 'Knowledge Base',
        src: 'img/logo.svg',
      },
      items: [],
    },
    prism: {
      additionalLanguages: ['java', 'python', 'bash', 'json', 'yaml', 'sql', 'docker', 'groovy', 'properties'],
    },
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
  },
};

export default config;
