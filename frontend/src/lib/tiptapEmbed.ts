import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { EmbedNodeView } from '../components/board/EmbedNodeView';

export interface EmbedOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    embed: {
      /**
       * Add an embed to the editor
       */
      setEmbed: (options: { src: string; originalUrl: string; provider: string; size?: string }) => ReturnType;
    };
  }
}

export const EmbedExtension = Node.create<EmbedOptions>({
  name: 'embed',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      originalUrl: {
        default: null,
      },
      provider: {
        default: null,
      },
      size: {
        default: 'medium',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-embed]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-embed': '' }, this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedNodeView);
  },

  addCommands() {
    return {
      setEmbed:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
