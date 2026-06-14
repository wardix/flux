import { useState } from 'react'
import { api } from '../../lib/api'
import { QRCodeDisplay } from './QRCodeDisplay'
import { RecoveryCodesModal } from './RecoveryCodesModal'

export function TwoFactorSetup() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [secret, setSecret] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [setupStep, setSetupStep] = useState<'idle' | 'qr' | 'codes'>('idle')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [error, setError] = useState('')

  const handleStartSetup = async () => {
    setError('')
    try {
      const res = await api.post<{ data: { secret: string; qr_code_url: string } }>(
        '/auth/2fa/setup',
        {},
      )
      setSecret(res.data.secret)
      setQrCodeUrl(res.data.qr_code_url)
      setSetupStep('qr')
    } catch (err) {
      setError('Failed to initialize 2FA setup. Make sure you are authenticated.')
    }
  }

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post<{ data: { enabled: boolean; recovery_codes: string[] } }>(
        '/auth/2fa/verify',
        {
          code: totpCode,
        },
      )
      if (res.data.enabled) {
        setIsEnabled(true)
        setRecoveryCodes(res.data.recovery_codes)
        setSetupStep('codes')
      }
    } catch (err) {
      setError('Invalid verification code. Please try again.')
    }
  }

  const handleDisable2FA = async () => {
    const code = prompt('Enter a 6-digit TOTP code or recovery code to confirm disabling 2FA:')
    if (!code) return
    setError('')
    try {
      const res = await api.post<{ data: { enabled: boolean } }>('/auth/2fa/disable', { code })
      if (!res.data.enabled) {
        setIsEnabled(false)
        setSetupStep('idle')
        alert('Two-factor authentication has been disabled.')
      }
    } catch (err) {
      setError('Failed to disable 2FA. Invalid code.')
    }
  }

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200 p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-base-200 pb-4">
        <div>
          <h3 className="text-lg font-bold">Two-Factor Authentication (2FA)</h3>
          <p className="text-xs text-base-content/60">
            Secure your account with TOTP codes from Authenticator apps.
          </p>
        </div>
        <span
          className={`badge ${isEnabled ? 'badge-success' : 'badge-ghost'} font-semibold px-3 py-2`}
        >
          {isEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {error && (
        <div className="alert alert-error text-sm rounded-xl py-2 px-3 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {setupStep === 'idle' && (
        <div className="space-y-4">
          <p className="text-sm">
            Two-factor authentication adds an extra layer of security to your account. To log in,
            you will need to provide both your password and a code from your authenticator app.
          </p>
          {!isEnabled ? (
            <button
              type="button"
              onClick={handleStartSetup}
              className="btn btn-primary text-white btn-sm"
            >
              Enable 2FA
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDisable2FA}
              className="btn btn-error text-white btn-sm"
            >
              Disable 2FA
            </button>
          )}
        </div>
      )}

      {setupStep === 'qr' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <QRCodeDisplay qrCodeUrl={qrCodeUrl} secret={secret} />
            <div className="flex-1 space-y-4">
              <h4 className="font-bold text-sm">Scan QR Code</h4>
              <p className="text-xs text-base-content/70">
                1. Open your authenticator app (e.g. Google Authenticator, Authy, or Duo).
                <br />
                2. Choose to scan a QR code, or manually input the secret shown.
                <br />
                3. Enter the 6-digit verification code below to enable.
              </p>
              <form onSubmit={handleVerifySetup} className="space-y-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit code..."
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="input input-sm input-bordered focus:outline-none w-full"
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary text-white btn-sm flex-1">
                    Verify & Enable
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSetupStep('idle')
                      setTotpCode('')
                    }}
                    className="btn btn-ghost btn-sm flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {setupStep === 'codes' && (
        <RecoveryCodesModal
          codes={recoveryCodes}
          isOpen={true}
          onClose={() => {
            setSetupStep('idle')
            setRecoveryCodes([])
          }}
        />
      )}
    </div>
  )
}
