import React from 'react';
import { EmbedProvider } from '../../lib/embedProviders';

interface EmbedPreviewProps {
  url: string;
  provider: EmbedProvider;
  onEmbed: () => void;
  onKeepLink: () => void;
}

export const EmbedPreview: React.FC<EmbedPreviewProps> = ({ url, provider, onEmbed, onKeepLink }) => {
  return (
    <div className="flex flex-col gap-3 p-4 bg-base-200 rounded-lg border border-base-300 max-w-sm my-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="opacity-70">Link from {provider.name}</span>
      </div>
      <div className="text-xs truncate opacity-70 mb-1">{url}</div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onEmbed} className="btn btn-sm btn-primary">
          Embed
        </button>
        <button type="button" onClick={onKeepLink} className="btn btn-sm btn-ghost">
          Keep as link
        </button>
      </div>
    </div>
  );
};
