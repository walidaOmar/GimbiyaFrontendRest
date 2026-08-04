import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, CreditCard, Calendar } from 'lucide-react'
import { affiliateApi } from '../../api/index.js'

export default function AffiliateInvoicePanel() {
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['affiliate-invoices'],
    queryFn: () => affiliateApi.getInvoices().then((r) => r.data),
  })

  const { data: detailData } = useQuery({
    queryKey: ['invoice-detail', selectedInvoice?.couponCode],
    queryFn: () => affiliateApi.getInvoice(selectedInvoice.couponCode).then((r) => r.data),
    enabled: !!selectedInvoice,
  })

  const invoices = data?.invoices || []

  if (isLoading) return <div className="p-8 text-center text-text-m animate-pulse">Loading invoices...</div>

  return (
    <div className="space-y-6">
      <h3 className="font-display text-lg font-bold text-text-p">Fulfillment Invoices</h3>

      {invoices.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-xl">
          <FileText className="w-10 h-10 text-text-d mx-auto mb-3" />
          <p className="text-text-m text-sm">No invoices yet</p>
          <p className="text-text-d text-xs mt-1">Invoices are generated when you pay orders via fulfillment coupons</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.invoiceNumber} onClick={() => setSelectedInvoice(inv)} className="bg-surface-l border border-border rounded-xl p-4 hover:border-brass/30 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brass/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-brass" />
                  </div>
                  <div>
                    <p className="font-medium text-text-p">{inv.invoiceNumber}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-m">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(inv.issuedAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> {inv.couponCode}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-text-p">₦{inv.totalAmountNaira.toLocaleString()}</p>
                  <p className="text-xs text-text-m">{inv.totalOrders} orders</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedInvoice && detailData?.invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedInvoice(null)}>
          <div className="bg-white text-gray-900 rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold">INVOICE</h2>
              <p className="text-gray-500">{detailData.invoice.invoiceNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase">Billed To</p>
                <p className="font-medium">{detailData.invoice.billedTo.name}</p>
                <p className="text-sm text-gray-600">{detailData.invoice.billedTo.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase">Date</p>
                <p className="font-medium">{new Date(detailData.invoice.issuedAt).toLocaleDateString()}</p>
                <p className="text-xs text-gray-500 uppercase mt-2">Payment Method</p>
                <p className="font-medium">{detailData.invoice.summary.paymentMethod}</p>
              </div>
            </div>

            <table className="w-full text-sm mb-6">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Order Ref</th>
                  <th className="text-left py-2">Customer</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {detailData.invoice.lineItems.map((item) => (
                  <tr key={item.orderRef} className="border-b border-gray-100">
                    <td className="py-2">{item.orderRef}</td>
                    <td className="py-2">{item.customer}</td>
                    <td className="py-2 text-right">₦{(item.orderTotalKobo / 100).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center border-t pt-4">
              <div>
                <p className="text-xs text-gray-500">Total Orders: {detailData.invoice.summary.totalOrders}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase">Total Paid</p>
                <p className="text-2xl font-bold">₦{detailData.invoice.summary.totalAmountNaira.toLocaleString()}</p>
              </div>
            </div>

            <button onClick={() => window.print()} className="mt-6 w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Download / Print Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
