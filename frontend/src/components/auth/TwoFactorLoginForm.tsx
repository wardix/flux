import { useState } from 'react'
import { api } from '../../lib/api'

interface TwoFactorLoginFormProps {
  tempToken: string
  onSuccess: (token: string, user: any) => void
  onCancel: () => void
}

export function TwoFactorLoginForm({ tempToken, onSuccess, onCancel }: TwoFactorLoginFormProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isRecovery, setIsRecovery] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post<{ data: { token: string; user: any } }>('/auth/2fa/login', {
        temp_token: tempToken,
        code,
      })
      onSuccess(res.data.token, res.data.user)
    } catch (err) {
      setError(isRecovery ? 'Invalid recovery code.' : 'Invalid authenticator code.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h3 className="text-xl font-bold">Two-Factor Authentication</h3>
        <p className="text-xs text-base-content/60">
          {isRecovery
            ? 'Enter one of your backup recovery codes to access your account.'
            : 'Enter the 6-digit verification code from your authenticator app.'}
        </p>
      </div>

      {error && (
        <div className="alert alert-error text-sm rounded-xl py-2 px-3 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">{isRecovery ? 'Recovery Code' : 'Verification Code'}</span>
          </label>
          <input
            type="text"
            placeholder={isRecovery ? 'xxxx-xxxx' : '000000'}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="input input-bordered focus:outline-none w-full"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <button type="submit" className="btn btn-primary text-white w-full">
            Verify Code
          </button>
          <div className="flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={() => {
                setIsRecovery(!isRecovery)
                setCode('')
                setError('')
              }}
              className="text-primary hover:underline bg-transparent border-none cursor-pointer"
            >
              {isRecovery ? 'Use authenticator code' : 'Use recovery code'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-base-content/60 hover:underline bg-transparent border-none cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
