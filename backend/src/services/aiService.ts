import OpenAI from 'openai'

// Initialize OpenAI client lazily so that tests can modify environment variables before calls
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured')
  }
  return new OpenAI({
    apiKey,
  })
}

const getModel = () => process.env.OPENAI_MODEL || 'gpt-4o-mini'

const SUGGEST_LABELS_PROMPT = `You are a project management AI assistant. 
Given a card's title and description, suggest the most relevant labels from the available list.

Card Title: {{title}}
Card Description: {{description}}

Available Labels: {{labels}}

Respond in JSON format:
{
  "suggested_labels": [
    { "name": "label_name", "confidence": 0.0-1.0 }
  ],
  "reasoning": "Brief explanation"
}

Only suggest labels from the available list. Max 3 suggestions. Order by confidence descending.`

const SUMMARIZE_PROMPT = `You are a project management AI assistant.
Summarize the following card information concisely.

Card Title: {{title}}
Card Description: {{description}}

Comments:
{{comments}}

Activity Log:
{{activities}}

Respond in JSON format:
{
  "summary": "2-3 sentence summary",
  "key_points": ["point 1", "point 2", "point 3"]
}

Keep it brief and actionable.`

const SUGGEST_ASSIGNEE_PROMPT = `You are a project management AI assistant.
Based on the card content and team members' recent work history, suggest the best assignee.

Card Title: {{title}}
Card Description: {{description}}

Team Members and their recent tasks:
{{members}}

Respond in JSON format:
{
  "suggested_assignees": [
    { "name": "member_name", "confidence": 0.0-1.0, "reason": "Brief reason" }
  ]
}

Max 2 suggestions. Consider workload balance and expertise match.`

export async function suggestLabels(
  title: string,
  description: string,
  availableLabels: Array<{ id: number; name: string; color: string }>
) {
  if (!title) {
    throw new Error('Title is required for AI suggestion')
  }

  const openai = getOpenAIClient()
  const prompt = SUGGEST_LABELS_PROMPT
    .replace('{{title}}', title)
    .replace('{{description}}', description || 'No description')
    .replace('{{labels}}', JSON.stringify(availableLabels.map((l) => l.name)))

  try {
    const response = await openai.chat.completions.create({
      model: getModel(),
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500,
    })

    const parsed = JSON.parse(response.choices[0].message.content!)
    const suggested = parsed.suggested_labels || []

    const suggestedWithIds = suggested
      .map((s: any) => {
        const matching = availableLabels.find(
          (l) => l.name.toLowerCase() === s.name.toLowerCase()
        )
        return {
          id: matching ? matching.id : null,
          name: s.name,
          confidence: s.confidence,
        }
      })
      .filter((s: any) => s.id !== null)

    return {
      suggested_labels: suggestedWithIds.slice(0, 3),
      reasoning: parsed.reasoning || '',
    }
  } catch (err: any) {
    console.error('OpenAI API Error:', err)
    throw new Error(err.message || 'AI service error')
  }
}

export async function summarizeCard(cardData: {
  title: string
  description?: string | null
  comments: Array<{ text?: string; content?: string }>
  activities: Array<{ action?: string; details?: string }>
}) {
  const openai = getOpenAIClient()
  const commentsStr = cardData.comments
    .map((c) => c.text || c.content || '')
    .filter(Boolean)
    .join('\n')
  const activitiesStr = cardData.activities
    .map((a) => a.action || a.details || '')
    .filter(Boolean)
    .join('\n')

  const prompt = SUMMARIZE_PROMPT
    .replace('{{title}}', cardData.title)
    .replace('{{description}}', cardData.description || 'No description')
    .replace('{{comments}}', commentsStr || 'No comments')
    .replace('{{activities}}', activitiesStr || 'No activities')

  try {
    const response = await openai.chat.completions.create({
      model: getModel(),
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500,
    })

    return JSON.parse(response.choices[0].message.content!)
  } catch (err: any) {
    console.error('OpenAI API Error:', err)
    throw new Error(err.message || 'AI service error')
  }
}

export async function suggestAssignee(cardData: {
  title: string
  description?: string | null
  members: Array<{ id: number; name: string; recent_cards?: number }>
}) {
  const openai = getOpenAIClient()
  const prompt = SUGGEST_ASSIGNEE_PROMPT
    .replace('{{title}}', cardData.title)
    .replace('{{description}}', cardData.description || 'No description')
    .replace(
      '{{members}}',
      JSON.stringify(
        cardData.members.map((m) => ({
          name: m.name,
          workload: m.recent_cards || 0,
        }))
      )
    )

  try {
    const response = await openai.chat.completions.create({
      model: getModel(),
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500,
    })

    const parsed = JSON.parse(response.choices[0].message.content!)
    const suggested = parsed.suggested_assignees || []

    const suggestedWithIds = suggested
      .map((s: any) => {
        const matching = cardData.members.find(
          (m) => m.name.toLowerCase() === s.name.toLowerCase()
        )
        return {
          id: matching ? matching.id : null,
          name: s.name,
          confidence: s.confidence,
          reason: s.reason,
        }
      })
      .filter((s: any) => s.id !== null)

    return {
      suggested_assignees: suggestedWithIds.slice(0, 2),
    }
  } catch (err: any) {
    console.error('OpenAI API Error:', err)
    throw new Error(err.message || 'AI service error')
  }
}
