import { Building2, MapPin, Phone, Mail, ChevronRight, BadgeCheck, Clock, AlertCircle } from 'lucide-react'
import { getRegionLabel } from '../../config/regions.js'

const STATUS_ICONS = {
  VERIFIED: <BadgeCheck className="w-4 h-4 text-emerald-400" />,
  PENDING: <Clock className="w-4 h-4 text-amber-400" />,
  SUSPENDED: <AlertCircle className="w-4 h-4 text-red-400" />,
}

const STATUS_LABELS = {
  VERIFIED: 'Verified',
  PENDING: 'Pending',
  SUSPENDED: 'Suspended',
}

export default function StoresTable({ stores, onSelect, loading }) {
  if (loading) return <div className="p-8 text-center text-text-m animate-pulse">Loading stores...</div>
  if (!stores?.length) return (
    <div className="p-8 text-center border border-dashed border-border rounded-xl">
      <Building2 className="w-10 h-10 text-text-d mx-auto mb-3" />
      <p className="text-text-m text-sm">No stores found</p>
    </div>
  )

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-midnight/50 text-text-m font-mono text-xs uppercase tracking-wider">
          <tr>
            <th className="text-left px-4 py-3">Business</th>
            <th className="text-left px-4 py-3">Contact</th>
            <th className="text-left px-4 py-3">State</th>
            <th className="text-left px-4 py-3">Segment</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-right px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {stores.map((store) => (
            <tr
              key={store._id}
              onClick={() => onSelect(store)}
              className="hover:bg-surface-h/50 cursor-pointer transition-colors group"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brass/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-brass" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-p group-hover:text-brass transition-colors">{store.businessName}</p>
                    <p className="text-xs text-text-d">ID: {store._id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-text-m">
                    <Mail className="w-3 h-3 text-text-d" />
                    <span className="text-xs">{store.businessEmail}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-text-m">
                    <Phone className="w-3 h-3 text-text-d" />
                    <span className="text-xs">{store.businessPhone || '—'}</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-text-m">
                  <MapPin className="w-3 h-3 text-text-d" />
                  <span className="text-xs">{getRegionLabel(store.primaryState)}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  store.commerceSegment === 'manufacturer' ? 'bg-blue-500/10 text-blue-400' :
                  store.commerceSegment === 'wholesaler' ? 'bg-purple-500/10 text-purple-400' :
                  store.commerceSegment === 'retailer' ? 'bg-emerald-500/10 text-emerald-400' :
                  store.commerceSegment === 'service_provider' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-cyan-500/10 text-cyan-400'
                }`}>
                  {store.commerceSegment?.replace('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {STATUS_ICONS[store.verificationStatus]}
                  <span className={`text-xs font-medium ${
                    store.verificationStatus === 'VERIFIED' ? 'text-emerald-400' :
                    store.verificationStatus === 'PENDING' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {STATUS_LABELS[store.verificationStatus]}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <ChevronRight className="w-4 h-4 text-text-d group-hover:text-brass transition-colors ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
