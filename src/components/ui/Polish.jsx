import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Skeleton, EmptyState } from './index.jsx'

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="min-w-0">
        {eyebrow && <p className="section-label mb-1">{eyebrow}</p>}
        <h1 className="font-display text-2xl md:text-3xl font-bold text-text-p">{title}</h1>
        {description && <p className="text-sm text-text-m mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function QueryState({ query, isEmpty, empty = {}, rows = 3, children }) {
  if (query.isLoading) {
    return <div className="space-y-2">{Array.from({ length: rows }).map((_, index) => <Skeleton key={index} className="h-14" />)}</div>
  }
  if (query.isError) {
    return (
      <div className="card flex items-center justify-between gap-3 border-danger/30">
        <div className="flex items-center gap-3 text-sm text-text-m">
          <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
          {query.error?.response?.data?.message || 'Could not load this data.'}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => query.refetch()}><RefreshCw className="w-3 h-3" /> Retry</button>
      </div>
    )
  }
  if (isEmpty?.(query.data)) return <EmptyState title={empty.title || 'Nothing here yet'} description={empty.description} icon={empty.icon} action={empty.action} />
  return children(query.data)
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-5" role="tablist">
      {tabs.map((tab) => (
        <button key={tab.id} role="tab" aria-selected={value === tab.id} onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-btn text-sm font-medium border transition-colors ${value === tab.id ? 'bg-brass/10 text-brass border-brass/30' : 'text-text-m border-transparent hover:text-text-p hover:bg-surface-h'}`}>
          {tab.label}{tab.count != null && <span className="ml-2 text-[10px] font-mono opacity-70">{tab.count}</span>}
        </button>
      ))}
    </div>
  )
}
