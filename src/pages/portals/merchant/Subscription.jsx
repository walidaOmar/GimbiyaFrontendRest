import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Check } from 'lucide-react'
import { subscriptionApi } from '../../../api/v21.js'
import { PageHeader, QueryState } from '../../../components/ui/Polish.jsx'
import { Card, Badge, Button } from '../../../components/ui/index.jsx'
import { formatNaira } from '../../../utils/index.js'

const cap = (n) => (n == null ? 'Unlimited' : n)

export default function Subscription() {
  const query = useQuery({ queryKey: ['my-plan'], queryFn: () => subscriptionApi.me().then((r) => r.data.data) })
  const pay = useMutation({
    mutationFn: (tier) => subscriptionApi.checkout(tier),
    onSuccess: ({ data }) => { window.location.href = data.checkoutUrl },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not start the payment'),
  })

  return (
    <div>
      <PageHeader eyebrow="Your store" title="Plan and limits" description="Your plan decides how many products, services and staff you can have. Paid plans last one year." />
      <QueryState query={query}>
        {(d) => (
          <div className="space-y-5">
            <Card className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-sm text-text-m">{d.storeName}</p><p className="font-display text-xl font-bold">{d.limits.label} plan</p>
                {d.expiresAt && <p className="text-xs text-text-m">{d.tier === 'BASIC' && d.paidTier !== 'BASIC' ? 'Your paid plan expired on' : 'Active until'} {new Date(d.expiresAt).toLocaleDateString()}</p>}</div>
              <div className="text-xs text-text-m space-y-0.5">
                <p>Products: {d.usage.products} / {cap(d.limits.products)}</p><p>Services: {d.usage.services} / {cap(d.limits.services)}</p>
                <p>Staff: {d.usage.staff} / {cap(d.limits.staff)}</p><p>Branches: {d.usage.branches} / {cap(d.limits.branches)}</p>
              </div>
            </Card>
            <div className="grid md:grid-cols-3 gap-4">
              {d.plans.map((p) => (
                <Card key={p.tier} className={p.tier === d.tier ? 'border-brass' : ''}>
                  <div className="flex items-center justify-between"><h3 className="font-display text-lg font-bold">{p.label}</h3>{p.tier === d.tier && <Badge color="brass">Current</Badge>}</div>
                  <p className="text-2xl font-bold text-brass my-2">{p.priceKobo ? `${formatNaira(p.priceKobo)} / year` : 'Free'}</p>
                  <ul className="text-sm text-text-m space-y-1.5 mb-4">
                    {[`${cap(p.products)} products`, `${cap(p.services)} services`, `${cap(p.staff)} staff members`, `${cap(p.branches)} branches`,
                      p.priceEditCooldownHours ? `Price changes every ${p.priceEditCooldownHours} hours` : 'Change prices any time'].map((t) => <li key={t} className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0" />{t}</li>)}
                  </ul>
                  {p.tier !== 'BASIC' && <Button className="w-full" variant={p.tier === d.tier ? 'secondary' : 'primary'} loading={pay.isPending && pay.variables === p.tier} disabled={!p.priceKobo} onClick={() => pay.mutate(p.tier)}>{p.tier === d.tier ? 'Renew for a year' : `Choose ${p.label}`}</Button>}
                </Card>
              ))}
            </div>
          </div>
        )}
      </QueryState>
    </div>
  )
}
