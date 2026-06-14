import React from 'react'
import { Editor } from '@tiptap/react'
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, FileCode2 } from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor | null
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null

  const items = [
    {
      name: 'bold',
      icon: <Bold className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold')
    },
    {
      name: 'italic',
      icon: <Italic className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic')
    },
    {
      name: 'strike',
      icon: <Strikethrough className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive('strike')
    },
    {
      name: 'code',
      icon: <Code className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive('code')
    },
    {
      name: 'h1',
      icon: <Heading1 className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 })
    },
    {
      name: 'h2',
      icon: <Heading2 className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 })
    },
    {
      name: 'h3',
      icon: <Heading3 className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive('heading', { level: 3 })
    },
    {
      name: 'bulletList',
      icon: <List className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList')
    },
    {
      name: 'orderedList',
      icon: <ListOrdered className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList')
    },
    {
      name: 'blockquote',
      icon: <Quote className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive('blockquote')
    },
    {
      name: 'codeBlock',
      icon: <FileCode2 className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive('codeBlock')
    }
  ]

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-base-300 bg-base-100/50 rounded-t-md">
      {items.map((item, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.preventDefault()
            item.action()
          }}
          className={`p-1.5 rounded-md hover:bg-base-200 transition-colors ${
            item.isActive ? 'bg-primary/20 text-primary' : 'text-base-content/70'
          }`}
          title={item.name}
        >
          {item.icon}
        </button>
      ))}
    </div>
  )
}
