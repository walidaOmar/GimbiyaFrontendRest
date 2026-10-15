import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, ShieldAlert, ShieldQuestion, Copy, CheckCircle2, Circle } from 'lucide-react'
import toast from 'react-hot-toast'
import { publicIdApi } from '../../../api/index.js'
import { Card, Badge } from '../../../components/ui/index.jsx'
import { PageHeader, QueryState } from '../../../components/ui/Polish.jsx'

export const TIERS = {
  1: { label: 'Basic', icon: ShieldQuestion, color: 'muted', note: 'Account created. Verify your identity to unlock more.' },
  2: { label: 'Identity verified', icon: ShieldAlert, color: 'amber', note: 'Your NIN has been verified.' },
  3: { label: 'Financially verified', icon: ShieldCheck, color: 'green', note: 'NIN and BVN verified. Full access.' },
}

export function TierBadge({ tier }) {
  const tierInfo = TIERS[tier] || TIERS[1]
  const Icon = tierInfo.icon
  return <Badge color={tierInfo.color}><Icon className="mr-1 inline h-3 w-3" />{tierInfo.label}</Badge>
}

export default function PublicIdKyc() {
  const query = useQuery({ queryKey: ['public-id-me'], queryFn: () => publicIdApi.me().then((response) => response.data.data) })

  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="Gimbiya Mall" title="Public ID & verification" description="Your Public ID is how Gimbiya officers find you at the market. Share it only with people you trust." />
      <QueryState query={query}>
        {(data) => {
          const tier = TIERS[data.kycTier] || TIERS[1]
          const Icon = tier.icon
          return (
            <div className="space-y-4">
              <Card className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="section-label">Your Public ID</p>
                  <p className="font-mono text-2xl text-brass mt-1">{data.publicId || 'Not issued yet'}</p>
                </div>
                {data.publicId && <button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(data.publicId); toast.success('Copied') }}><Copy className="w-4 h-4" /> Copy</button>}
              </Card>
              <Card>
                <div className="flex items-center gap-3 mb-4"><Icon className="w-6 h-6 text-brass" /><div><p className="font-medium text-text-p">{tier.label}</p><p className="text-xs text-text-m">{tier.note}</p></div></div>
                <ol className="space-y-3 text-sm">
                  <Step done label="Account created" />
                  <Step done={data.ninVerified} label="NIN verified" hint="Visit an Affiliate Officer or coordinator with your National ID." />
                  <Step done={data.bvnVerified} label="BVN verified" hint="Available after NIN. Unlocks financial features." />
                </ol>
              </Card>
            </div>
          )
        }}
      </QueryState>
    </div>
  )
}

function Step({ done, label, hint }) {
  return (
    <li className="flex items-start gap-3">
      {done ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" /> : <Circle className="w-5 h-5 text-text-d shrink-0" />}
      <div><p className={done ? 'text-text-p' : 'text-text-m'}>{label}</p>{!done && hint && <p className="text-xs text-text-d">{hint}</p>}</div>
    </li>
  )
}
