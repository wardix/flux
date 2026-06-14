import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface PAT {
  id: number
  name: string
  token: string
  created_at: string
}

export function PersonalAccessTokens() {
  const [tokens, setTokens] = useState<PAT[]>([])
  const [newTokenName, setNewTokenName] = useState('')
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchTokens = async () => {
    try {
      const res = await api.get<{ data: PAT[] }>('/personal-access-tokens')
      setTokens(res.data)
    } catch (err) {
      console.error('Failed to fetch tokens:', err)
    }
  }

  useEffect(() => {
    fetchTokens()
  }, [])

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTokenName.trim()) return
    setIsLoading(true)
    try {
      const res = await api.post<{ data: PAT }>('/personal-access-tokens', {
        name: newTokenName.trim(),
      })
      setGeneratedToken(res.data.token)
      setNewTokenName('')
      fetchTokens()
    } catch (err) {
      console.error('Failed to create token:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteToken = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this token?')) return
    try {
      await api.delete(`/personal-access-tokens/${id}`)
      fetchTokens()
    } catch (err) {
      console.error('Failed to delete token:', err)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreateToken} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Token name (e.g. CLI, Script)..."
            value={newTokenName}
            onChange={(e) => setNewTokenName(e.target.value)}
            className="input input-bordered input-sm flex-1 focus:outline-none"
            required
          />
          <button type="submit" disabled={isLoading} className="btn btn-primary btn-sm text-white">
            {isLoading ? 'Generating...' : 'Generate Token'}
          </button>
        </div>
      </form>

      {generatedToken && (
        <div className="alert alert-success text-xs p-3 rounded-lg flex flex-col items-start gap-2 bg-success/20 border-success/30">
          <span className="font-bold text-success-content">
            ⚠️ Copy your Personal Access Token now. You won't be able to see it again!
          </span>
          <div className="flex gap-2 w-full">
            <input
              type="text"
              readOnly
              value={generatedToken}
              className="input input-xs input-bordered flex-1 font-mono text-xs focus:outline-none bg-base-100"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(generatedToken)
                alert('Copied to clipboard!')
              }}
              className="btn btn-xs btn-outline btn-success"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <span className="text-xs font-semibold text-base-content/50 uppercase block">
          Active Tokens
        </span>
        {tokens.length === 0 ? (
          <p className="text-xs text-base-content/40 italic">
            No personal access tokens generated yet.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between p-2 rounded-lg bg-base-200/50 border border-base-300 text-xs"
              >
                <div>
                  <p className="font-semibold text-base-content/90">{token.name}</p>
                  <p className="text-[10px] text-base-content/40 font-mono">
                    Token: {token.token.substring(0, 12)}...
                  </p>
                  <p className="text-[10px] text-base-content/40">
                    Created: {new Date(token.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteToken(token.id)}
                  className="btn btn-xs btn-error btn-outline"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
