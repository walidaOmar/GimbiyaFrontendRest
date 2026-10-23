import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Wallet as WalletIcon } from 'lucide-react'
import { walletApi } from '../../../api/v21.js'
import { PageHeader, QueryState } from '../../../components/ui/Polish.jsx'
import { Card, Badge, Button, Input, Modal, Select } from '../../../components/ui/index.jsx'
import { formatNaira } from '../../../utils/index.js'

const KIND_LABEL = {
  MERCHANT_SALE: 'Sale released', SERVICE_PAYOUT: 'Service completed', RIDER_EARNING: 'Delivery earning', AFFILIATE_COMMISSION: 'Referral commission',
  WITHDRAWAL_HOLD: 'Withdrawal requested', WITHDRAWAL_RELEASE: 'Withdrawal returned', SUBSCRIPTION_PAYMENT: 'Subscription', REFUND_REVERSAL: 'Refund',
}
const STATUS_COLOR = { REQUESTED: 'amber', APPROVED: 'blue', PAID: 'green', REJECTED: 'red', FAILED: 'red' }

export default function Wallet() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ amountNaira: '', bankCode: '', accountNumber: '' })
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: () => walletApi.me().then((r) => r.data.data) })
  const banks = useQuery({ queryKey: ['banks'], queryFn: () => walletApi.banks().then((r) => r.data.data), enabled: open, staleTime: 3600000 })

  const withdraw = useMutation({
    mutationFn: () => {
      const bank = (banks.data || []).find((b) => b.code === form.bankCode)
      return walletApi.withdraw({ amountKobo: Math.round(Number(form.amountNaira) * 100), bankCode: form.bankCode, bankName: bank?.name, accountNumber: form.accountNumber })
    },
    onSuccess: () => { toast.success('Withdrawal requested. HQ will review it.'); setOpen(false); setForm({ amountNaira: '', bankCode: '', accountNumber: '' }); qc.invalidateQueries({ queryKey: ['wallet'] }) },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not request the withdrawal'),
  })

  return (
    <div>
      <PageHeader eyebrow="Earnings" title="My wallet" description="Money is added here when a delivery or service is confirmed with its code. You can withdraw it to your bank account."
        actions={<Button icon={<WalletIcon className="w-4 h-4" />} onClick={() => setOpen(true)}>Withdraw</Button>} />
      <QueryState query={wallet}>
        {(d) => (
          <div className="space-y-5">
            <Card className="border-brass/30"><p className="section-label">Available balance</p><p className="font-display text-4xl font-bold text-brass mt-1">{formatNaira(d.balanceKobo)}</p><p className="text-xs text-text-m mt-1">Minimum withdrawal {formatNaira(d.minWithdrawalKobo)}</p></Card>

            {d.withdrawals.length > 0 && <div><h2 className="font-display text-lg font-bold mb-2">Withdrawals</h2><div className="space-y-2">{d.withdrawals.map((w) => (
              <Card key={w._id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{formatNaira(w.amountKobo)} to {w.bankName || w.bankCode} ····{w.accountNumber.slice(-4)}</span>
                <span className="flex items-center gap-2 text-xs text-text-m">{w.reviewNote && <em>{w.reviewNote}</em>}{new Date(w.createdAt).toLocaleDateString()}<Badge color={STATUS_COLOR[w.status] || 'muted'}>{w.status}</Badge></span>
              </Card>))}</div></div>}

            <div><h2 className="font-display text-lg font-bold mb-2">Activity</h2>
              {!d.entries.length ? <Card className="text-sm text-text-m">Nothing yet. Earnings appear here after a handover code is confirmed.</Card>
                : <div className="space-y-2">{d.entries.map((e) => (
                  <Card key={e._id} className="flex items-center justify-between text-sm">
                    <span>{KIND_LABEL[e.kind] || e.kind}<span className="block text-[11px] text-text-m">{new Date(e.createdAt).toLocaleString()}</span></span>
                    <span className={e.amountKobo < 0 ? 'text-danger' : 'text-success'}>{e.amountKobo < 0 ? '-' : '+'}{formatNaira(Math.abs(e.amountKobo))}</span>
                  </Card>))}</div>}
            </div>
          </div>
        )}
      </QueryState>

      <Modal open={open} onClose={() => setOpen(false)} title="Withdraw to your bank">
        <div className="space-y-4">
          <Input label="Amount (₦)" type="number" min="1000" value={form.amountNaira} onChange={(e) => setForm({ ...form, amountNaira: e.target.value })} />
          <Select label="Bank" value={form.bankCode} onChange={(e) => setForm({ ...form, bankCode: e.target.value })}
            options={[{ value: '', label: banks.isLoading ? 'Loading banks…' : banks.isError ? 'Could not load banks' : 'Choose your bank' }, ...(banks.data || []).map((b) => ({ value: b.code, label: b.name }))]} />
          <Input label="Account number" inputMode="numeric" maxLength={10} value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '') })} />
          <p className="text-xs text-text-m">Your account must be verified. HQ reviews every withdrawal before it is paid.</p>
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={withdraw.isPending} disabled={!form.amountNaira || !form.bankCode || form.accountNumber.length !== 10} onClick={() => withdraw.mutate()}>Request withdrawal</Button></div>
        </div>
      </Modal>
    </div>
  )
}
