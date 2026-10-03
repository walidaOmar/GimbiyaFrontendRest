import { useEffect, useState } from 'react'
import { ChevronDown, Scissors, Truck, Store as StoreIcon, X } from 'lucide-react'
import api from '../../api/index.js'
import { Card, Badge } from '../ui/index.jsx'

/** Optional service providers can be attached to an individual cart item. */
export function ServiceLogisticsAccordion({ cartItem, assignedState, onServiceAdded, onServiceRemoved }) {
  const [open, setOpen] = useState(false)
  const [offerings, setOfferings] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    api.get('/service-catalog/offerings', { params: { assignedState } })
      .then((res) => setOfferings(res.data.data || []))
      .catch(() => setOfferings([]))
      .finally(() => setLoading(false))
  }, [open, assignedState])

  const attach = (offering) => {
    onServiceAdded?.(offering)
    setOpen(false)
  }

  return (
    <div className="mt-2 border-t border-ash/30 pt-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 text-xs text-text-m transition-colors hover:text-brass"
      >
        <Scissors className="h-3.5 w-3.5" />
        {cartItem.serviceItems?.length > 0
          ? `${cartItem.serviceItems.length} service${cartItem.serviceItems.length > 1 ? 's' : ''} attached`
          : 'Add a service (optional)'}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {cartItem.serviceItems?.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {cartItem.serviceItems.map((service, index) => (
            <div key={service.offeringId || index} className="flex items-center gap-1">
              <Badge color="muted">
                {service.serviceType} - ₦{(service.priceKobo / 100).toLocaleString()}
              </Badge>
              <button
                type="button"
                onClick={() => onServiceRemoved?.(service.offeringId)}
                aria-label={`Remove ${service.serviceType} service`}
                className="text-text-m transition-colors hover:text-danger"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Card className="mt-2 p-3">
          {loading && <p className="text-xs text-text-m">Loading services near you...</p>}
          {!loading && offerings.length === 0 && (
            <p className="text-xs text-text-m">No service providers available at this location yet.</p>
          )}
          <div className="flex flex-col gap-1.5">
            {offerings.map((offering) => (
              <button
                key={offering._id}
                type="button"
                onClick={() => attach(offering)}
                className="flex items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-brass/10"
              >
                <span className="flex items-center gap-1.5">
                  <StoreIcon className="h-3 w-3" /> {offering.serviceType} - {offering.providerId?.name}
                </span>
                <span className="font-mono">₦{(offering.priceKobo / 100).toLocaleString()}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5 border-t border-ash/20 pt-2 text-xs text-text-m">
            <Truck className="h-3 w-3" /> Logistics/pickup is chosen after checkout, per fulfillment group.
          </div>
        </Card>
      )}
    </div>
  )
}