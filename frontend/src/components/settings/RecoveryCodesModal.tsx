interface RecoveryCodesModalProps {
  codes: string[]
  isOpen: boolean
  onClose: () => void
}

export function RecoveryCodesModal({ codes, isOpen, onClose }: RecoveryCodesModalProps) {
  if (!isOpen) return null

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(codes.join('\n'))
    alert('Recovery codes copied to clipboard!')
  }

  const handleDownloadCodes = () => {
    const element = document.createElement('a')
    const file = new Blob([codes.join('\n')], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'flux-recovery-codes.txt'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card bg-base-100 border border-base-200 shadow-2xl max-w-md w-full p-6 space-y-6 rounded-2xl transform scale-100 transition-transform duration-300">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-warning flex items-center gap-2">
            ⚠️ Store Recovery Codes Safely
          </h3>
          <p className="text-xs text-base-content/70">
            These recovery codes can be used to access your account if you lose your mobile device. They will not be displayed again, so copy or download them now.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-base-200/50 p-4 rounded-xl border border-base-200 font-mono text-sm text-center">
          {codes.map((code) => (
            <div key={code} className="bg-base-100 py-1.5 px-2 rounded border border-base-300 shadow-sm select-all">
              {code}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button type="button" onClick={handleCopyCodes} className="btn btn-outline btn-sm flex-1">
              📋 Copy Codes
            </button>
            <button type="button" onClick={handleDownloadCodes} className="btn btn-outline btn-sm flex-1">
              💾 Download
            </button>
          </div>
          <button type="button" onClick={onClose} className="btn btn-primary text-white btn-sm w-full mt-2">
            I have stored my recovery codes
          </button>
        </div>
      </div>
    </div>
  )
}
