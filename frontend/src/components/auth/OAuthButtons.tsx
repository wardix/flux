interface OAuthButtonsProps {
  mode: 'login' | 'register' | 'link'
}

export function OAuthButtons({ mode }: OAuthButtonsProps) {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

  const handleOAuthRedirect = (provider: 'google' | 'github' | 'facebook') => {
    window.location.href = `${API_BASE_URL}/auth/${provider}`
  }

  const labelPrefix = mode === 'link' ? 'Link' : mode === 'register' ? 'Sign up with' : 'Log in with'

  return (
    <div className="flex flex-col gap-2 w-full mt-4">
      <button
        type="button"
        onClick={() => handleOAuthRedirect('google')}
        className="btn btn-outline btn-sm font-semibold flex items-center justify-center gap-2 hover:bg-base-200"
      >
        <span>{labelPrefix} Google</span>
      </button>

      <button
        type="button"
        onClick={() => handleOAuthRedirect('github')}
        className="btn btn-outline btn-sm font-semibold flex items-center justify-center gap-2 hover:bg-base-200"
      >
        <span>{labelPrefix} GitHub</span>
      </button>

      <button
        type="button"
        onClick={() => handleOAuthRedirect('facebook')}
        className="btn btn-outline btn-sm font-semibold flex items-center justify-center gap-2 hover:bg-base-200"
      >
        <span>{labelPrefix} Facebook</span>
      </button>
    </div>
  )
}
