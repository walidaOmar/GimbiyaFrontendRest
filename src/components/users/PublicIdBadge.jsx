import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react'
import api from '../../api/index.js'
import { Badge } from '../ui/index.jsx'

const TIER_LABEL = { 1: 'Basic', 2: 'Identity Verified', 3: 'Financially Verified' }
const TIER_ICON = { 1: ShieldQuestion, 2: ShieldAlert, 3: ShieldCheck }
const TIER_COLOR = { 1: 'muted', 2: 'amber', 3: 'green' }

export function PublicIdBadge() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/public-ids/me').then((res) => setData(res.data.data)).catch(() => {})
  }, [])

  if (!data) return null

  const Icon = TIER_ICON[data.kycTier] || ShieldQuestion

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-text-m">{data.publicId}</span>
      <Badge color={TIER_COLOR[data.kycTier] || 'muted'}>
        <Icon className="mr-1 inline h-3 w-3" />
        {TIER_LABEL[data.kycTier] || 'Verification pending'}
      </Badge>
    </div>
  )
}