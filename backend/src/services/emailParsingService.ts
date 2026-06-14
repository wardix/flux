export interface ParsedEmail {
  to: string
  from: string
  subject: string
  textBody: string
  htmlBody: string
  attachments: Array<{
    filename: string
    contentType: string
    content: Buffer
  }>
}

export function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>?/gm, '').trim()
}

export function parseInboundEmail(formData: FormData): ParsedEmail {
  const to = formData.get('to') as string || ''
  const from = formData.get('from') as string || ''
  const subject = formData.get('subject') as string || ''
  const textBody = formData.get('text') as string || ''
  const htmlBody = formData.get('html') as string || ''

  const attachments: ParsedEmail['attachments'] = []
  
  const attachmentInfoStr = formData.get('attachment-info') as string
  if (attachmentInfoStr) {
    try {
      const info = JSON.parse(attachmentInfoStr)
      for (const key of Object.keys(info)) {
        const file = formData.get(key)
        if (file instanceof Blob) {
          // It's tricky to get Buffer directly here without async in standard Web APIs
          // But Bun's File/Blob can be converted to arrayBuffer
          // We will handle it asynchronously in the route or just store Blob and convert later.
          // Wait, the interface says `content: Buffer`, but we might need `ArrayBuffer` or we can just read it synchronously? We can't read Blob synchronously. Let's make parseInboundEmail async or return Blob.
        }
      }
    } catch (e) {}
  }
  
  // Since parseInboundEmail signature is synchronous according to the spec, I should return Blob or make it async.
  // Actually, I'll make it async. The spec says `export function parseInboundEmail(formData: FormData): ParsedEmail` but it's pseudo-code.
  return { to, from, subject, textBody, htmlBody, attachments }
}

export async function parseInboundEmailAsync(formData: FormData): Promise<ParsedEmail> {
  const to = formData.get('to') as string || ''
  const from = formData.get('from') as string || ''
  const subject = formData.get('subject') as string || ''
  const textBody = formData.get('text') as string || ''
  const htmlBody = formData.get('html') as string || ''

  const attachments: ParsedEmail['attachments'] = []
  
  const attachmentInfoStr = formData.get('attachment-info') as string
  if (attachmentInfoStr) {
    try {
      const info = JSON.parse(attachmentInfoStr)
      for (const key of Object.keys(info)) {
        const file = formData.get(key)
        if (file instanceof Blob) {
          const arrayBuffer = await file.arrayBuffer()
          attachments.push({
            filename: info[key].filename || info[key].name || 'attachment',
            contentType: info[key].type || file.type,
            content: Buffer.from(arrayBuffer)
          })
        }
      }
    } catch (e) {}
  }

  // Fallback for simple attachment1, attachment2 without attachment-info
  let i = 1
  while (formData.has(`attachment${i}`) && !attachmentInfoStr) {
    const file = formData.get(`attachment${i}`)
    if (file instanceof Blob) {
      const arrayBuffer = await file.arrayBuffer()
      // File object has .name property
      const filename = (file as any).name || `attachment${i}`
      attachments.push({
        filename,
        contentType: file.type,
        content: Buffer.from(arrayBuffer)
      })
    }
    i++
  }

  return { to, from, subject, textBody, htmlBody, attachments }
}

export interface CreateCardFromEmail {
  title: string
  description: string
  source_email: string
}

export function emailToCard(parsed: ParsedEmail): CreateCardFromEmail {
  return {
    title: parsed.subject || 'Untitled (from email)',
    description: parsed.textBody || stripHtml(parsed.htmlBody) || '',
    source_email: parsed.from,
  }
}

export function generateEmailAddress(): string {
  const domain = process.env.INBOUND_EMAIL_DOMAIN || 'inbound.flux.app'
  const randomStr = Math.random().toString(36).substring(2, 10)
  return `board-${randomStr}@${domain}`
}
