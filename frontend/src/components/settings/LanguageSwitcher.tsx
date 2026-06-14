import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation()

  const currentLanguage = i18n.language || 'en'

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value
    await i18n.changeLanguage(newLang)
    localStorage.setItem('flux-language', newLang)
    try {
      await api.put('/users/me/locale', { locale: newLang })
    } catch (err) {
      console.error('Failed to sync locale to backend:', err)
    }
  }

  return (
    <div className={`form-control w-full max-w-xs ${className}`}>
      <select
        role="combobox"
        value={currentLanguage.startsWith('id') ? 'id' : 'en'}
        onChange={handleLanguageChange}
        className="select select-bordered select-sm w-full focus:outline-none focus:select-primary text-xs"
      >
        <option value="en">🇺🇸 English</option>
        <option value="id">🇮🇩 Bahasa Indonesia</option>
      </select>
    </div>
  )
}
