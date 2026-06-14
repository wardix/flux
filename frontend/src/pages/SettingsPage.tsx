import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/settings/LanguageSwitcher'
import { PersonalAccessTokens } from '../components/settings/PersonalAccessTokens'
import { TwoFactorSetup } from '../components/settings/TwoFactorSetup'

interface SettingsPageProps {
  onBack: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8 min-h-screen">
      <div className="flex justify-between items-center border-b border-base-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-base-content">
            {t('settings.title')}
          </h1>
          <p className="text-xs text-base-content/50 mt-1">
            Manage your account preferences, language, and security settings.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-outline btn-sm gap-2 rounded-full border-base-300 text-xs hover:bg-base-200"
        >
          <span>🏠</span> Back to Board
        </button>
      </div>

      <div className="space-y-6">
        {/* Language Section */}
        <div className="card bg-base-100 border border-base-200/50 p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-base-content/95">🌐 {t('settings.language')}</h2>
          <p className="text-xs text-base-content/60">
            Choose your preferred language for the user interface.
          </p>
          <LanguageSwitcher />
        </div>

        {/* Security Section */}
        <div className="card bg-base-100 border border-base-200/50 p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-base-content/95">🛡️ {t('settings.security')}</h2>
          <p className="text-xs text-base-content/60">
            Configure two-factor authentication to secure your account.
          </p>
          <div className="pt-2 border-t border-base-200/50">
            <TwoFactorSetup />
          </div>
        </div>

        {/* Personal Access Tokens Section */}
        <div className="card bg-base-100 border border-base-200/50 p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-base-content/95">🔑 Personal Access Tokens</h2>
          <p className="text-xs text-base-content/60">
            Generate access tokens for API integrations and external scripts.
          </p>
          <div className="pt-2 border-t border-base-200/50">
            <PersonalAccessTokens />
          </div>
        </div>
      </div>
    </div>
  )
}
