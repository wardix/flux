import { EMBED_PROVIDERS, EmbedProvider } from './embedProviders';

export function detectEmbedProvider(url: string): EmbedProvider | null {
  try {
    for (const provider of EMBED_PROVIDERS) {
      if (provider.patterns.some(pattern => pattern.test(url))) {
        return provider;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function getEmbedUrl(url: string): string | null {
  const provider = detectEmbedProvider(url);
  if (!provider) {
    return null;
  }
  return provider.transform(url);
}

export function isEmbeddableUrl(url: string): boolean {
  return detectEmbedProvider(url) !== null;
}
