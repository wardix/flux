import React, { useState } from 'react';
import { EMBED_SIZE_CLASSES, EMBED_HEIGHT, EmbedSize } from '../../lib/constants';

interface EmbedRendererProps {
  src: string;
  provider: string;
  size: EmbedSize | string;
  originalUrl: string;
}

export const EmbedRenderer: React.FC<EmbedRendererProps> = ({ src, provider, size, originalUrl }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const sizeClass = EMBED_SIZE_CLASSES[size as EmbedSize] || EMBED_SIZE_CLASSES.medium;
  const heightClass = EMBED_HEIGHT[size as EmbedSize] || EMBED_HEIGHT.medium;

  return (
    <div className={`relative bg-base-200 rounded-lg overflow-hidden border border-base-300 ${sizeClass} ${heightClass}`}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-base-200">
          <span className="loading loading-spinner text-primary"></span>
        </div>
      )}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-200 p-4 text-center">
          <span className="text-error mb-2">Failed to load embed from {provider}</span>
          <a href={originalUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm">
            Open original link
          </a>
        </div>
      ) : (
        <iframe
          src={src}
          title={`${provider} embed`}
          className={`w-full h-full border-0 ${isLoading ? 'invisible' : 'visible'}`}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      )}
    </div>
  );
};
