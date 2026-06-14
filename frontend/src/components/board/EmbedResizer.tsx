import React from 'react';
import { EmbedSize } from '../../lib/constants';

interface EmbedResizerProps {
  currentSize: string;
  onResize: (size: EmbedSize) => void;
  onRemove: () => void;
}

export const EmbedResizer: React.FC<EmbedResizerProps> = ({ currentSize, onResize, onRemove }) => {
  return (
    <div className="absolute top-2 right-2 flex items-center gap-1 p-1 bg-base-100 rounded-lg shadow-lg border border-base-300 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        type="button"
        className={`btn btn-xs ${currentSize === 'small' ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => onResize('small')}
      >
        S
      </button>
      <button
        type="button"
        className={`btn btn-xs ${currentSize === 'medium' ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => onResize('medium')}
      >
        M
      </button>
      <button
        type="button"
        className={`btn btn-xs ${currentSize === 'full' ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => onResize('full')}
      >
        L
      </button>
      <div className="w-[1px] h-4 bg-base-300 mx-1" />
      <button
        type="button"
        className="btn btn-xs btn-ghost text-error"
        onClick={onRemove}
        title="Remove embed"
      >
        🗑️
      </button>
    </div>
  );
};
