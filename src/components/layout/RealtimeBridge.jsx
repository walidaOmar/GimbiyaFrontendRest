import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useSSE } from '../../hooks/useSSE.js'
import { useAuthStore } from '../../store/authStore.js'

const MAP = {
  'kyc:status_changed': { keys: [['public-id-me'], ['ceo-kyc-queue']] },
  'order:status_changed': { keys: [['orders'], ['order-history']] },
  'order:rider_assigned': { keys: [['orders'], ['order-history']], text: 'A rider is on the way.' },
  'escrow:released': { keys: [['merchant-settlement'], ['fulfillment-groups']], text: 'Escrow released.' },
  'fulfillment:status_changed': { keys: [['fulfillment-groups'], ['order-history'], ['rider-v2']] },
  'fulfillment:rider_assigned': { keys: [['order-history'], ['fulfillment-groups']] },
  'fulfillment:confirmed': { keys: [['order-history'], ['rider-v2']] },
  'waiver:approved': { keys: [['my-coupons'], ['pending-waiver-requests'], ['my-quota']], text: 'Waiver approved.' },
  'waiver:rejected': { keys: [['my-coupons'], ['pending-waiver-requests']], text: 'Waiver request rejected.' },
  'payment:confirmed': { keys: [['order-history'], ['orders']], text: 'Payment confirmed.' },
}

export default function RealtimeBridge() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  useSSE(Boolean(user), {
    '*': (name, payload) => {
      if (name === 'fulfillment:status_changed' && payload?.type === 'GPS_UPDATE') return
      const config = MAP[name]
      if (!config) return
      config.keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
      const text = payload?.message || config.text
      if (text) toast(text, { icon: '🔔' })
    },
  })
  return null
}
