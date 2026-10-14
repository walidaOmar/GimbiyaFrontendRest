import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Warehouse, AlertTriangle, FileText, RefreshCw,
} from 'lucide-react'
import { stockApi } from '../../../api/index.js'
import {
  Card, StatCard, Badge,
  Modal, EmptyState, Skeleton, Spinner,
} from '../../../components/ui/index.jsx'
import toast from 'react-hot-toast'

export function StockDashboard() {
  const qc = useQueryClient()
  const [selected, setSel] = useState(null)
  const [auditModal, setAudit] = useState(null)
  const [lowOnly, setLowOnly] = useState(false)
  const [adjusting, setAdj] = useState({ reason: 'AUDIT', note: '' })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stock-manifest', lowOnly],
    queryFn: () => stockApi.manifest({ lowStockOnly: lowOnly, limit: 100 }).then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: auditData, isLoading: auditLoad } = useQuery({
    queryKey: ['stock-audit', auditModal?._id],
    queryFn: () => stockApi.auditLog(auditModal._id, { limit: 30 }).then(r => r.data),
    enabled: !!auditModal,
  })

  const adjustMut = useMutation({
    mutationFn: (payload) => stockApi.adjust(payload),
    onSuccess: (res) => {
      const d = res.data
      toast.success(`Stock updated: ${d.stockBefore} → ${d.stockAfter}`)
      qc.invalidateQueries(['stock-manifest'])
      setSel(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Adjustment failed'),
  })

  const handleAdjust = (productId, delta) => {
    if (!adjusting.reason) { toast.error('Select a reason code'); return }
    adjustMut.mutate({
      productId,
      deltaCount: delta,
      reasonCode: adjusting.reason,
      noteText: adjusting.note,
    })
  }

  const manifest = data?.manifest || []
  const lowCount = manifest.filter(p => p.isLowStock).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="section-label mb-1">Warehouse Operations</p>
          <h1 className="font-display text-3xl font-bold text-text-p">Stock Control</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLowOnly(!lowOnly)}
            className={`px-4 py-2 rounded-btn font-mono text-xs border transition-all ${
              lowOnly ? 'bg-warning/10 border-warning text-warning' : 'bg-surface border-border text-text-m hover:text-text-p'
            }`}>
            {lowOnly ? '⚠ Low Stock Only' : 'All Stock'}
          </button>
          <button onClick={() => refetch()} className="btn-icon"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total SKUs" value={manifest.length} icon={Warehouse} />
        <StatCard label="Low Stock" value={lowCount} icon={AlertTriangle} color="text-warning" />
        <StatCard label="Threshold" value={data?.lowStockThreshold || 10} icon={AlertTriangle} color="text-text-m" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="section-label">Inventory Manifest</p>
          {isLoading ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-btn" />)
          ) : !manifest.length ? (
            <EmptyState icon={Warehouse} title="No Products" description="No inventory in your region." />
          ) : (
            manifest.map(p => (
              <motion.div key={p._id}
                onClick={() => setSel(sel => sel?._id === p._id ? null : p)}
                whileHover={{ x: 2 }}
                className={`p-3 rounded-btn border cursor-pointer transition-all ${
                  selected?._id === p._id
                    ? 'bg-success/10 border-success'
                    : 'bg-surface-h border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm font-semibold text-text-p truncate">{p.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-text-m">{p.assignedState}</span>
                      <span className="font-mono text-[10px] text-text-d">{p.categorySlug}</span>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <p className={`font-mono text-xl font-bold ${
                      p.stock === 0 ? 'text-danger' : p.isLowStock ? 'text-warning' : 'text-success'
                    }`}>{p.stock}</p>
                    <p className="font-mono text-[10px] text-text-d">{p.stockStatus}</p>
                  </div>
                </div>

                {selected?._id === p._id && (
                  <div className="mt-3 pt-3 border-t border-border space-y-3"
                    onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      {['AUDIT', 'DAMAGED', 'RECOUNT', 'INBOUND'].map(r => (
                        <button key={r}
                          onClick={() => setAdj(a => ({ ...a, reason: r }))}
                          className={`flex-1 py-1 rounded-btn font-mono text-[9px] transition-all ${
                            adjusting.reason === r
                              ? 'bg-brass text-midnight font-bold'
                              : 'bg-midnight border border-border text-text-m hover:text-text-p'
                          }`}>{r}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[-50, -10, 10, 50].map(d => (
                        <button key={d}
                          onClick={() => handleAdjust(p._id, d)}
                          disabled={adjustMut.isPending}
                          className={`py-2.5 rounded-btn font-mono text-sm font-bold transition-all
                            border ${d < 0
                              ? 'bg-danger/10 border-danger/30 text-danger hover:bg-danger/20'
                              : 'bg-success/10 border-success/30 text-success hover:bg-success/20'
                            }`}>
                          {d > 0 ? `+${d}` : d}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setAudit(p)}
                        className="flex-1 py-1.5 rounded-btn border border-border text-text-m
                                   font-mono text-xs hover:text-brass hover:border-brass transition-colors">
                        View Audit Log
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        <div>
          <p className="section-label mb-2">Recent Adjustments</p>
          <Card className="h-[480px] overflow-y-auto">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Warehouse className="w-10 h-10 text-text-d mb-3" />
                <p className="font-mono text-xs text-text-d">Select a product to adjust stock</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-mono text-xs text-text-m">
                  Audit log: <span className="text-text-p">{selected.name}</span>
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-midnight rounded-btn p-2">
                    <p className="font-mono text-[10px] text-text-d">Current Stock</p>
                    <p className="font-mono text-xl font-bold text-brass">{selected.stock}</p>
                  </div>
                  <div className="bg-midnight rounded-btn p-2">
                    <p className="font-mono text-[10px] text-text-d">Status</p>
                    <p className={`font-mono text-sm font-bold ${
                      selected.stock === 0 ? 'text-danger' : selected.isLowStock ? 'text-warning' : 'text-success'
                    }`}>{selected.stockStatus}</p>
                  </div>
                </div>
                <p className="font-mono text-[10px] text-text-d">
                  Click +/- buttons on the left to adjust. Each change is logged permanently.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal open={!!auditModal} onClose={() => setAudit(null)}
        title={`Audit Log — ${auditModal?.name || ''}`} size="lg">
        {auditLoad ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : !auditData?.entries?.length ? (
          <EmptyState icon={FileText} title="No Audit Entries" description="No adjustments recorded yet." />
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditData.entries.map(e => (
              <div key={e._id} className="flex items-center justify-between p-3 bg-midnight rounded-btn border border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge color={e.deltaCount > 0 ? 'green' : 'red'}>
                      {e.deltaCount > 0 ? `+${e.deltaCount}` : e.deltaCount}
                    </Badge>
                    <Badge color="muted">{e.reasonCode}</Badge>
                  </div>
                  <p className="font-mono text-[10px] text-text-d mt-1">
                    {e.stockBefore} → {e.stockAfter} · {e.actorId?.name}
                  </p>
                </div>
                <p className="font-mono text-[10px] text-text-d">
                  {new Date(e.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
