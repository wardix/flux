export interface EmbedProvider {
  name: string;
  icon: string;
  patterns: RegExp[];
  transform: (url: string) => string;
  defaultAspectRatio?: string;
}

export const EMBED_PROVIDERS: EmbedProvider[] = [
  {
    name: 'YouTube',
    icon: 'YoutubeIcon',
    patterns: [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
      /youtu\.be\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/
    ],
    transform: (url) => {
      const match = url.match(/v=([a-zA-Z0-9_-]+)/) || url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
      return url;
    },
    defaultAspectRatio: '16/9'
  },
  {
    name: 'Figma',
    icon: 'FigmaIcon',
    patterns: [
      /figma\.com\/(file|design|proto)\/([a-zA-Z0-9]+)/
    ],
    transform: (url) => `https://www.figma.com/embed?embed_host=flux&url=${encodeURIComponent(url)}`,
  },
  {
    name: 'Google Docs',
    icon: 'FileTextIcon',
    patterns: [
      /docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/
    ],
    transform: (url) => {
      if (url.includes('/edit')) {
        return url.replace('/edit', '/preview');
      }
      if (!url.includes('/preview')) {
        return `${url}/preview`;
      }
      return url;
    }
  },
  {
    name: 'CodeSandbox',
    icon: 'CodeIcon',
    patterns: [
      /codesandbox\.io\/s\/([a-zA-Z0-9_-]+)/
    ],
    transform: (url) => {
      if (url.includes('/s/')) {
        return url.replace('/s/', '/embed/');
      }
      return url;
    }
  },
  {
    name: 'Loom',
    icon: 'VideoIcon',
    patterns: [
      /loom\.com\/share\/([a-zA-Z0-9_-]+)/
    ],
    transform: (url) => url.replace('/share/', '/embed/')
  }
];
