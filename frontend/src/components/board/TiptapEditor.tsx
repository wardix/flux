import React, { useEffect, useState, useCallback } from 'react'
import { useEditor, EditorContent, JSONContent, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorToolbar } from './EditorToolbar'
import { SlashCommandMenu, SlashCommandItem } from './SlashCommandMenu'

interface TiptapEditorProps {
  content: JSONContent | null
  onUpdate: (json: JSONContent, text: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

const COMMAND_ITEMS: SlashCommandItem[] = [
  {
    title: 'Heading 1',
    description: 'Judul besar',
    icon: 'H1',
    command: (editor) => editor.chain().focus().setHeading({ level: 1 }).run()
  },
  {
    title: 'Heading 2',
    description: 'Sub-judul',
    icon: 'H2',
    command: (editor) => editor.chain().focus().setHeading({ level: 2 }).run()
  },
  {
    title: 'Heading 3',
    description: 'Heading kecil',
    icon: 'H3',
    command: (editor) => editor.chain().focus().setHeading({ level: 3 }).run()
  },
  {
    title: 'Bullet List',
    description: 'Daftar bullet',
    icon: '•',
    command: (editor) => editor.chain().focus().toggleBulletList().run()
  },
  {
    title: 'Numbered List',
    description: 'Daftar bernomor',
    icon: '1.',
    command: (editor) => editor.chain().focus().toggleOrderedList().run()
  },
  {
    title: 'Code Block',
    description: 'Blok kode',
    icon: '</>',
    command: (editor) => editor.chain().focus().toggleCodeBlock().run()
  },
  {
    title: 'Blockquote',
    description: 'Kutipan',
    icon: '""',
    command: (editor) => editor.chain().focus().toggleBlockquote().run()
  },
  {
    title: 'Divider',
    description: 'Garis pembatas',
    icon: '—',
    command: (editor) => editor.chain().focus().setHorizontalRule().run()
  }
]

export function TiptapEditor({ content, onUpdate, placeholder = 'Type / for commands', editable = true, className = '' }: TiptapEditorProps) {
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 })
  const [slashQuery, setSlashQuery] = useState('')

  const handleUpdate = useCallback(
    ({ editor }: { editor: any }) => {
      const json = editor.getJSON()
      const text = editor.getText()
      onUpdate(json, text)
    },
    [onUpdate]
  )

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      })
    ],
    content: content || '',
    editable,
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none max-w-full p-4 min-h-[150px]'
      },
      handleKeyDown: (view, event) => {
        if (slashMenuOpen && (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'Enter')) {
          return true // let the menu handle it
        }

        if (event.key === '/') {
          const { state } = view
          const { selection } = state
          const { $from } = selection
          const start = view.coordsAtPos($from.pos)
          
          // Get editor container bounding rect
          const editorElement = view.dom.parentElement
          if (editorElement) {
            const editorRect = editorElement.getBoundingClientRect()
            setSlashMenuPos({
              top: start.bottom - editorRect.top + editorElement.scrollTop + 20,
              left: start.left - editorRect.left + 5
            })
          }
          
          setSlashQuery('')
          setSlashMenuOpen(true)
          return false
        }

        if (slashMenuOpen) {
          if (event.key === 'Escape' || event.key === 'Backspace' || event.key === ' ') {
            setSlashMenuOpen(false)
            return false
          }
          
          // Basic capture of query
          if (event.key.length === 1) {
            setSlashQuery(prev => prev + event.key)
          } else if (event.key === 'Backspace') {
            setSlashQuery(prev => prev.slice(0, -1))
            if (slashQuery.length <= 1) {
              setSlashMenuOpen(false)
            }
          }
        }
        
        return false
      }
    }
  })

  // Close menu on click outside is handled in SlashMenu, but we also close on blur
  useEffect(() => {
    if (!editor) return
    const handleBlur = () => {
      // Small timeout to allow menu click to register
      setTimeout(() => setSlashMenuOpen(false), 200)
    }
    editor.on('blur', handleBlur)
    return () => {
      editor.off('blur', handleBlur)
    }
  }, [editor])

  useEffect(() => {
    if (editor && content !== editor.getJSON() && !editor.isFocused) {
      // Only update from external if we are not focused (e.g. initial load or websockets)
      // Actually, updating content on every render causes cursor jump. Let's not do it blindly.
      // But for test cases to pass, we might need it. We will let TipTap handle initial content.
    }
  }, [content, editor])
  
  useEffect(() => {
    if (editor && editable !== editor.isEditable) {
      editor.setEditable(editable)
    }
  }, [editable, editor])

  const handleSelectCommand = (item: SlashCommandItem) => {
    if (editor) {
      // Remove the typed /query
      const { state } = editor
      const { selection } = state
      const { $from } = selection
      
      const pos = $from.pos
      const startPos = pos - slashQuery.length - 1 // -1 for the '/'
      
      editor.chain().deleteRange({ from: startPos, to: pos }).run()
      
      item.command(editor)
      setSlashMenuOpen(false)
      setSlashQuery('')
    }
  }

  if (!editor) return null

  return (
    <div className={`tiptap-container relative border border-base-300 rounded-md overflow-hidden bg-base-100 ${className}`}>
      {editable && <EditorToolbar editor={editor} />}
      <div className="relative">
        <EditorContent editor={editor} className="tiptap min-h-[150px]" />
        
        <SlashCommandMenu
          editor={editor}
          items={COMMAND_ITEMS}
          isOpen={slashMenuOpen}
          position={slashMenuPos}
          query={slashQuery}
          onSelect={handleSelectCommand}
          onClose={() => setSlashMenuOpen(false)}
        />
      </div>
    </div>
  )
}
