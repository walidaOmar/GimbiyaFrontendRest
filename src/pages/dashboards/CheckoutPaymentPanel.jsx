import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import api from '../../api/index.js'
import { Card } from '../../components/ui/index.jsx'
import toast from 'react-hot-toast'

/** Initiates the hosted Monnify payment for an existing order. */
export function CheckoutPaymentPanel({ orderId }) {
  const [loading, setLoading] = useState(false)

  const pay = async () => {
    setLoading(true)
    try {
      const res = await api.post('/payments/initiate', { orderId, paymentMethod: 'ACCOUNT_TRANSFER' })
      window.location.href = res.data.checkoutUrl
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start payment')
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center px-4 py-8">
      <Card className="flex w-full items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm font-medium">Ready to pay</p>
          <p className="text-xs text-text-m">You'll be redirected to Monnify to complete payment securely.</p>
        </div>
        <button
          type="button"
          onClick={pay}
          disabled={loading}
          className="flex shrink-0 items-center gap-2 rounded bg-brass px-4 py-2 font-medium text-midnight hover:brightness-110 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          Pay now
        </button>
      </Card>
    </main>
  )
}
