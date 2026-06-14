import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OAuthButtons } from '../components/auth/OAuthButtons'
import { TwoFactorLoginForm } from '../components/auth/TwoFactorLoginForm'
import { api } from '../lib/api'

import { useBranding } from '../hooks/useBranding'

interface LoginPageProps {
  onLoginSuccess: (token: string, user: any) => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { t } = useTranslation()
  const { appName, logoUrl } = useBranding()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [tempToken, setTempToken] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)

  // Check query params for OAuth callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const userStr = params.get('user')
    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr))
        localStorage.setItem('token', token)
        onLoginSuccess(token, user)
      } catch (err) {
        setError('OAuth login failed.')
      }
    }
  }, [onLoginSuccess])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post<{
        data: {
          token?: string
          user?: any
          requires_2fa?: boolean
          temp_token?: string
        }
      }>('/auth/login', { email, password })

      if (res.data.requires_2fa && res.data.temp_token) {
        setTempToken(res.data.temp_token)
        setRequires2FA(true)
      } else if (res.data.token && res.data.user) {
        localStorage.setItem('token', res.data.token)
        onLoginSuccess(res.data.token, res.data.user)
      }
    } catch (err) {
      setError('Invalid email or password.')
    }
  }

  return (
    <div className="min-h-screen bg-base-300 flex items-center justify-center p-4">
      <div className="card bg-base-100 border border-base-200 shadow-2xl max-w-md w-full p-8 rounded-2xl space-y-6">
        {requires2FA ? (
          <TwoFactorLoginForm
            tempToken={tempToken}
            onSuccess={(token, user) => {
              localStorage.setItem('token', token)
              onLoginSuccess(token, user)
            }}
            onCancel={() => {
              setRequires2FA(false)
              setTempToken('')
              setPassword('')
            }}
          />
        ) : (
          <>
            <div className="flex flex-col items-center gap-3 text-center">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-10 object-contain mb-1" />
              ) : (
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl mb-1 shadow-md">
                  F
                </div>
              )}
              <h2 className="text-2xl font-bold tracking-tight">
                {t('auth.welcomeBack')} to {appName}
              </h2>
              <p className="text-xs text-base-content/60">{t('auth.login')}</p>
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
                  <span className="label-text font-semibold">{t('auth.email')}</span>
                </label>
                <input
                  type="email"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-bordered focus:outline-none w-full"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">{t('auth.password')}</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-bordered focus:outline-none w-full"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary text-white w-full">
                {t('auth.login')}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-base-300"></div>
              <span className="flex-shrink mx-4 text-base-content/40 text-xs font-semibold uppercase">
                {t('auth.loginWith', { provider: 'OAuth' })}
              </span>
              <div className="flex-grow border-t border-base-300"></div>
            </div>

            <OAuthButtons mode="login" />
          </>
        )}
      </div>
    </div>
  )
}
