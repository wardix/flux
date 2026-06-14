interface QRCodeDisplayProps {
  qrCodeUrl: string
  secret: string
}

export function QRCodeDisplay({ qrCodeUrl, secret }: QRCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center p-4 bg-base-200/50 rounded-2xl border border-base-200 w-full max-w-[260px] gap-3">
      {qrCodeUrl ? (
        <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 rounded-lg shadow" />
      ) : (
        <div className="w-48 h-48 bg-base-300 rounded-lg flex items-center justify-center animate-pulse">
          <span className="text-xs text-base-content/40">Loading QR...</span>
        </div>
      )}
      <div className="w-full text-center">
        <span className="text-[10px] uppercase font-bold text-base-content/50 block">Secret Key</span>
        <code className="text-xs font-mono bg-base-100 px-2 py-1 rounded select-all break-all border border-base-300">
          {secret}
        </code>
      </div>
    </div>
  )
}
