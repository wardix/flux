import { JSONContent } from '@tiptap/react'

export function extractTextFromJSON(doc: JSONContent): string {
  if (!doc) return ''
  if (doc.type === 'text') {
    return doc.text || ''
  }
  let text = ''
  if (doc.content) {
    for (const node of doc.content) {
      const nodeText = extractTextFromJSON(node)
      text += nodeText
      if (node.type === 'paragraph' || node.type?.includes('heading')) {
        text += '\n'
      }
    }
  }
  return text.trim()
}

export function isValidTiptapDoc(doc: unknown): doc is JSONContent {
  if (typeof doc !== 'object' || doc === null) return false
  const obj = doc as Record<string, unknown>
  if (obj.type !== 'doc') return false
  if (!Array.isArray(obj.content)) return false
  return true
}

export function sanitizeTiptapDoc(doc: JSONContent): JSONContent {
  const allowedTypes = [
    'doc',
    'paragraph',
    'text',
    'heading',
    'bulletList',
    'orderedList',
    'listItem',
    'codeBlock',
    'blockquote',
    'horizontalRule',
    'hardBreak',
    'image'
  ]

  if (!doc.type || !allowedTypes.includes(doc.type)) {
    // If it's a root doc, return an empty doc
    if (doc.type === 'doc') {
      return { type: 'doc', content: [{ type: 'paragraph' }] }
    }
    // For invalid nodes, we could return a simple text node or null, but since we return JSONContent, returning a text node is safer or we skip it in the parent. Let's just return a generic valid structure or remove invalid props.
    // Actually, sanitize should filter children.
  }

  const sanitized: JSONContent = { type: doc.type }

  if (doc.text) sanitized.text = doc.text

  if (doc.attrs) {
    // Strip potentially dangerous attrs like src with javascript:
    const safeAttrs: Record<string, any> = { ...doc.attrs }
    if (safeAttrs.src && safeAttrs.src.toString().toLowerCase().startsWith('javascript:')) {
      safeAttrs.src = ''
    }
    sanitized.attrs = safeAttrs
  }

  if (doc.marks) {
    sanitized.marks = doc.marks.map(mark => {
      const safeMark = { ...mark }
      if (safeMark.attrs && safeMark.attrs.href) {
        if (safeMark.attrs.href.toLowerCase().startsWith('javascript:')) {
          safeMark.attrs.href = ''
        }
      }
      return safeMark
    })
  }

  if (doc.content && Array.isArray(doc.content)) {
    sanitized.content = doc.content
      .filter((child: any) => allowedTypes.includes(child.type))
      .map((child: any) => sanitizeTiptapDoc(child))
  }

  return sanitized
}
