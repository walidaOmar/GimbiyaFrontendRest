import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productApi } from '../../api/index.js'
import { STATE_OPTIONS } from '../../config/regions.js'

const naira = (kobo) => `₦${(kobo / 100).toLocaleString()}`

export default function ProductPicker({ node, onNodeChange, selected, onChange }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['picker-products', node, search, page],
    queryFn: () => productApi.getCatalog({ assignedState: node, search: search || undefined, page, limit: 24 }).then((response) => response.data),
    enabled: Boolean(node),
  })

  const ids = new Set(selected.map((product) => String(product._id)))
  const toggle = (product) => {
    if (ids.has(String(product._id))) onChange(selected.filter((item) => String(item._id) !== String(product._id)))
    else onChange([...selected, { _id: product._id, name: product.name }])
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <select className="input" value={node} onChange={(event) => { onNodeChange(event.target.value); setPage(1) }}>
          {STATE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <input className="input" placeholder="Search products…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((product) => (
            <button key={product._id} type="button" onClick={() => toggle(product)} className="rounded-full border border-brass/40 bg-brass/10 px-2.5 py-1 text-xs text-brass">
              {product.name} ✕
            </button>
          ))}
        </div>
      )}

      <div className="max-h-64 overflow-y-auto rounded-btn border border-border divide-y divide-border">
        {query.isLoading && <p className="p-3 text-xs text-text-m">Loading products…</p>}
        {query.isError && <p className="p-3 text-xs text-danger">Could not load products for this node.</p>}
        {query.data?.products?.length === 0 && <p className="p-3 text-xs text-text-m">No products found.</p>}
        {query.data?.products?.map((product) => (
          <label key={product._id} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-surface-h">
            <input type="checkbox" checked={ids.has(String(product._id))} onChange={() => toggle(product)} />
            <span className="flex-1 truncate">{product.name}</span>
            <span className="text-xs text-text-m">{naira(product.priceKobo)}</span>
          </label>
        ))}
      </div>

      {query.data?.pagination?.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-text-m">
          <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {query.data.pagination.totalPages}</span>
          <button type="button" className="btn btn-ghost btn-sm" disabled={page >= query.data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  )
}
