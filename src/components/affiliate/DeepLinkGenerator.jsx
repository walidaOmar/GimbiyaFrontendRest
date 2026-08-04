import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link2, Copy, CheckCircle } from 'lucide-react'
import { productApi } from '../../api/index.js'
import { useAuthStore } from '../../store/authStore.js'
import toast from 'react-hot-toast'

export default function DeepLinkGenerator() {
  const { user } = useAuthStore()
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [copied, setCopied] = useState(false)

  const { data: catalog } = useQuery({
    queryKey: ['affiliate-products'],
    queryFn: () => productApi.getCatalog({ limit: 100 }).then((r) => r.data),
  })

  const baseUrl = `${window.location.origin}/shop`
  const deepLink = selectedProduct
    ? `${baseUrl}?ref=${user?.referralCode}&product=${selectedProduct._id}`
    : `${baseUrl}?ref=${user?.referralCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(deepLink)
    setCopied(true)
    toast.success('Deep link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-surface-l border border-border rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brass/10 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-brass" />
        </div>
        <div>
          <h3 className="font-display font-bold text-text-p">Deep Link Generator</h3>
          <p className="text-xs text-text-m">Create product-specific referral links</p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono text-text-m mb-2 uppercase">Select Product (optional)</label>
        <select
          value={selectedProduct?._id || ''}
          onChange={(e) => {
            const prod = catalog?.products?.find((p) => p._id === e.target.value)
            setSelectedProduct(prod || null)
          }}
          className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
        >
          <option value="">General store link</option>
          {catalog?.products?.map((p) => (
            <option key={p._id} value={p._id}>{p.name} — ₦{(p.priceKobo / 100).toLocaleString()}</option>
          ))}
        </select>
      </div>

      <div className="bg-midnight border border-border rounded-lg p-4">
        <p className="text-[10px] font-mono text-text-d uppercase mb-1">Your Deep Link</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-sm text-text-p break-all font-mono">{deepLink}</code>
          <button onClick={handleCopy} className="p-2 hover:bg-surface-h rounded-lg transition-colors text-text-m">
            {copied ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="bg-brass/5 border border-brass/20 rounded-lg p-3">
        <p className="text-xs text-text-m">
          <span className="text-brass font-bold">Tip:</span> Share product-specific links to increase conversion rates.
        </p>
      </div>
    </div>
  )
}
