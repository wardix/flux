import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { EmbedRenderer } from './EmbedRenderer';
import { EmbedResizer } from './EmbedResizer';
import { EmbedSize } from '../../lib/constants';

export const EmbedNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
  const { src, provider, size, originalUrl } = node.attrs;

  const handleResize = (newSize: EmbedSize) => {
    updateAttributes({ size: newSize });
  };

  return (
    <NodeViewWrapper className={`relative group ${selected ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}`}>
      <div className="relative my-4" contentEditable={false}>
        <EmbedResizer
          currentSize={size}
          onResize={handleResize}
          onRemove={deleteNode}
        />
        <EmbedRenderer
          src={src}
          provider={provider}
          size={size}
          originalUrl={originalUrl}
        />
      </div>
    </NodeViewWrapper>
  );
};
