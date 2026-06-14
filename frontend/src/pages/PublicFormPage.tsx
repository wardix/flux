import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

interface PublicFormInfo {
  id: number
  title: string
  description: string | null
}

export function PublicFormPage() {
  const { id } = useParams<{ id: string }>()
  const [formInfo, setFormInfo] = useState<PublicFormInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // We use direct fetch because this is a public page (we shouldn't use frontend/src/lib/api.ts which automatically appends localStorage token, or even if we do, it must work without token)
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/public-forms/${id}`)
        if (!res.ok) {
          throw new Error('Form not found or is inactive')
        }
        const json = await res.json()
        setFormInfo(json.data)
      } catch (err: any) {
        setError(err.message || 'Failed to load form')
      } finally {
        setLoading(false)
      }
    }
    fetchForm()
  }, [id, API_BASE_URL])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/public-forms/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to submit form')
      }
      setSubmitted(true)
      setTitle('')
      setDescription('')
    } catch (err: any) {
      setError(err.message || 'Failed to submit entry')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-300 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-sm font-medium text-base-content/60">Loading form...</p>
        </div>
      </div>
    )
  }

  if (error && !formInfo) {
    return (
      <div className="min-h-screen bg-base-300 flex items-center justify-center p-4">
        <div className="card w-full max-w-md bg-base-100 border border-base-200/50 shadow-xl p-8 text-center space-y-4">
          <span className="text-4xl">⚠️</span>
          <h1 className="text-xl font-bold text-error">Form Error</h1>
          <p className="text-sm text-base-content/75">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-300 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg bg-base-100 border border-base-200/50 shadow-xl overflow-hidden">
        {/* Colorful gradient header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-8 text-white relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl font-bold font-mono">FLUX</div>
          <h1 className="text-2xl font-black tracking-tight">{formInfo?.title}</h1>
          {formInfo?.description && (
            <p className="text-xs text-white/80 mt-2 whitespace-pre-wrap">{formInfo.description}</p>
          )}
        </div>

        <div className="p-8 space-y-6">
          {submitted ? (
            <div className="text-center space-y-4 py-8 animate-fade-in">
              <div className="w-16 h-16 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
              <h2 className="text-xl font-bold text-base-content">Submission Successful!</h2>
              <p className="text-sm text-base-content/60">Thank you for your response. Your entry has been recorded.</p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="btn btn-primary btn-sm text-white mt-4"
              >
                Submit another response
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="alert alert-error text-xs p-3 rounded-xl flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-sm font-semibold">Title <span className="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  placeholder="Summarize your request or feedback..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input input-bordered focus:outline-none focus:border-primary w-full text-sm"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-sm font-semibold">Description</span>
                </label>
                <textarea
                  placeholder="Provide any additional details or context..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="textarea textarea-bordered focus:outline-none focus:border-primary w-full h-32 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-block text-white mt-6"
              >
                {submitting ? 'Submitting...' : 'Submit Entry'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
