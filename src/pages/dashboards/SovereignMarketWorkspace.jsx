import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  ArrowDownToLine, BriefcaseBusiness, CheckCircle2, ClipboardList,
  Coins, FileBarChart, Filter, LineChart, Search, ShieldCheck,
  Store, UserPlus, Users, Wallet,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore.js'
import { Badge, Card, StatCard, StatusBadge } from '../../components/ui/index.jsx'

const INCUBATOR_LABEL = 'Sovereign Market Incubator System'

const fallbackData = {
  requests: [
    { id: 'SMI-1042', business: 'Amina Foods & Provisions', owner: 'Amina Yusuf', state: 'Kano', status: 'PENDING', submitted: '06 Sep 2026' },
    { id: 'SMI-1038', business: 'Northstar Home Goods', owner: 'Ibrahim Musa', state: 'Kaduna', status: 'REVIEW', submitted: '04 Sep 2026' },
    { id: 'SMI-1031', business: 'Arewa Craft Collective', owner: 'Zainab Bello', state: 'Katsina', status: 'APPROVED', submitted: '01 Sep 2026' },
  ],
  remote: [
    { id: 'RMT-208', business: 'Savanna Logistics', owner: 'Sani Umar', state: 'Kano', channel: 'Video verification', status: 'SCHEDULED' },
    { id: 'RMT-204', business: 'Murna Textiles', owner: 'Maryam Lawal', state: 'Kaduna', channel: 'Document review', status: 'PENDING' },
  ],
  businesses: [
    { id: 'BUS-771', business: 'Amina Foods & Provisions', owner: 'Amina Yusuf', category: 'Commerce', score: 91, state: 'Kano' },
    { id: 'BUS-764', business: 'Northstar Home Goods', owner: 'Ibrahim Musa', category: 'Commerce', score: 87, state: 'Kaduna' },
    { id: 'BUS-753', business: 'Arewa Craft Collective', owner: 'Zainab Bello', category: 'Industry', score: 84, state: 'Katsina' },
  ],
  wallet: [
    { id: 'ORD-8291', date: '06 Sep 2026', buyer: 'M. Okafor', business: 'Amina Foods & Provisions', amount: 185000, commission: 10175, status: 'RELEASED' },
    { id: 'ORD-8277', date: '05 Sep 2026', buyer: 'S. Ibrahim', business: 'Northstar Home Goods', amount: 92000, commission: 5060, status: 'PENDING' },
    { id: 'ORD-8250', date: '03 Sep 2026', buyer: 'N. Bello', business: 'Arewa Craft Collective', amount: 246500, commission: 13557, status: 'RELEASED' },
    { id: 'ORD-8214', date: '01 Sep 2026', buyer: 'A. Danjuma', business: 'Amina Foods & Provisions', amount: 67500, commission: 3712, status: 'RELEASED' },
  ],
  team: [
    { name: 'Amina Yusuf', business: 'Amina Foods & Provisions', role: 'Owner', status: 'ACTIVE', joined: '12 Aug 2026' },
    { name: 'Kabiru Abdullahi', business: 'Amina Foods & Provisions', role: 'Store Manager', status: 'ACTIVE', joined: '19 Aug 2026' },
    { name: 'Ibrahim Musa', business: 'Northstar Home Goods', role: 'Owner', status: 'ACTIVE', joined: '24 Aug 2026' },
    { name: 'Zainab Bello', business: 'Arewa Craft Collective', role: 'Owner', status: 'INVITED', joined: '01 Sep 2026' },
  ],
}

const auditRows = [
  { date: '06 Sep 2026, 14:22', actor: 'Amina Yusuf', action: 'Product price updated', business: 'Amina Foods & Provisions', amount: '₦185,000' },
  { date: '05 Sep 2026, 11:08', actor: 'Ibrahim Musa', action: 'Order fulfilled', business: 'Northstar Home Goods', amount: '₦92,000' },
  { date: '03 Sep 2026, 09:44', actor: 'Zainab Bello', action: 'New listing published', business: 'Arewa Craft Collective', amount: '₦246,500' },
  { date: '01 Sep 2026, 16:31', actor: 'Kabiru Abdullahi', action: 'Stock adjustment', business: 'Amina Foods & Provisions', amount: '₦67,500' },
]

function money(value) {
  return `₦${Number(value || 0).toLocaleString('en-NG')}`
}

function downloadAudit(rows, filename) {
  const headers = ['Date', 'Actor', 'Action', 'Business', 'Value']
  const csv = [headers, ...rows.map(row => [row.date, row.actor, row.action, row.business, row.amount])]
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function Header({ eyebrow, title, description, action }) {
  return <header className="flex flex-wrap items-start justify-between gap-4">
    <div><p className="section-label mb-1">{eyebrow}</p><h1 className="font-display text-3xl font-bold text-text-p">{title}</h1><p className="text-text-m mt-1">{description}</p></div>
    {action}
  </header>
}

function Rows({ rows, columns }) {
  return <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-border text-[10px] uppercase tracking-wider text-text-d">{columns.map(column => <th key={column.key} className="pb-3 pr-4 whitespace-nowrap">{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || row.name || index} className="border-b border-border/60 last:border-0">{columns.map(column => <td key={column.key} className="py-3 pr-4 text-sm text-text-m whitespace-nowrap">{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody></table></div>
}

function RequestsView({ remote = false }) {
  const rows = remote ? fallbackData.remote : fallbackData.requests
  return <><Header eyebrow={INCUBATOR_LABEL} title={remote ? 'Remote requests' : 'Incubator requests'} description={remote ? 'Coordinate remote verification and document review.' : 'Review new businesses entering the incubator pipeline.'} /><Card><div className="flex items-center justify-between mb-5"><div><p className="section-label">{remote ? 'Remote queue' : 'Request queue'}</p><p className="text-xs text-text-m mt-1">{rows.length} records requiring attention</p></div><button className="btn btn-secondary btn-sm"><Filter className="w-4 h-4" /> Filter</button></div><Rows rows={rows} columns={[{ key: 'id', label: 'Reference' }, { key: 'business', label: 'Business', render: row => <div><p className="text-text-p font-semibold">{row.business}</p><p className="text-xs text-text-m">{row.owner}</p></div> }, { key: 'state', label: 'State' }, { key: remote ? 'channel' : 'submitted', label: remote ? 'Route' : 'Submitted' }, { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status === 'REVIEW' ? 'PROCESSING' : row.status === 'SCHEDULED' ? 'CONFIRMED' : row.status} /> }]} /></Card></>
}

function BusinessesView({ pool = false }) {
  return <><Header eyebrow={INCUBATOR_LABEL} title={pool ? 'Prequalified pool' : 'Prequalified business owners'} description={pool ? 'The approved owner pool ready for matching and activation.' : 'Business owners that have completed the qualification review.'} /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><StatCard label="Qualified owners" value="128" icon={Users} /><StatCard label="Ready to activate" value="42" icon={CheckCircle2} color="text-success" /><StatCard label="Commerce segment" value="76" icon={Store} /><StatCard label="Industry segment" value="52" icon={BriefcaseBusiness} /></div><Card><div className="flex items-center justify-between mb-5"><p className="section-label">Owner directory</p><button className="btn btn-secondary btn-sm"><ArrowDownToLine className="w-4 h-4" /> Export pool</button></div><Rows rows={fallbackData.businesses} columns={[{ key: 'id', label: 'Owner ID' }, { key: 'business', label: 'Business', render: row => <div><p className="text-text-p font-semibold">{row.business}</p><p className="text-xs text-text-m">{row.owner}</p></div> }, { key: 'category', label: 'Segment', render: row => <Badge color={row.category === 'Commerce' ? 'blue' : 'purple'}>{row.category}</Badge> }, { key: 'state', label: 'State' }, { key: 'score', label: 'Qualification', render: row => <span className="font-mono text-success">{row.score}%</span> }]} /></Card></>
}

function LookupView() {
  const [term, setTerm] = useState('')
  const results = fallbackData.businesses.filter(item => `${item.business} ${item.owner} ${item.id}`.toLowerCase().includes(term.toLowerCase()))
  return <><Header eyebrow={INCUBATOR_LABEL} title="Business lookup" description="Find an owner, business record, or incubator reference." /><Card><div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-m" /><input className="input pl-10" placeholder="Search business, owner, or reference" value={term} onChange={event => setTerm(event.target.value)} /></div><div className="mt-6"><Rows rows={results} columns={[{ key: 'id', label: 'Reference' }, { key: 'business', label: 'Business' }, { key: 'owner', label: 'Owner' }, { key: 'state', label: 'State' }, { key: 'score', label: 'Score', render: row => `${row.score}%` }]} /></div></Card></>
}

function WalletView() {
  const totalSales = fallbackData.wallet.reduce((sum, row) => sum + row.amount, 0)
  const totalCommission = fallbackData.wallet.reduce((sum, row) => sum + row.commission, 0)
  return <><Header eyebrow="Wallet and buyer tracking" title="Wallet history" description="View buyer-attributed sales, commissions, and settlement status." /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><StatCard label="Tracked sales" value={money(totalSales)} icon={LineChart} /><StatCard label="Available balance" value={money(185420)} icon={Wallet} color="text-success" /><StatCard label="Pending settlement" value={money(92000)} icon={Coins} color="text-warning" /><StatCard label="Commission earned" value={money(totalCommission)} icon={BriefcaseBusiness} /></div><Card><div className="flex items-center justify-between mb-5"><div><p className="section-label">Buyer sales ledger</p><p className="text-xs text-text-m mt-1">Every sale attributed to your network or state.</p></div><button className="btn btn-secondary btn-sm" onClick={() => downloadAudit(fallbackData.wallet.map(row => ({ ...row, actor: row.buyer, action: 'Buyer-tracked sale', amount: money(row.amount) })), 'wallet-history.csv')}><ArrowDownToLine className="w-4 h-4" /> Download history</button></div><Rows rows={fallbackData.wallet} columns={[{ key: 'id', label: 'Order' }, { key: 'date', label: 'Date' }, { key: 'buyer', label: 'Buyer' }, { key: 'business', label: 'Business' }, { key: 'amount', label: 'Sale value', render: row => <span className="font-mono text-text-p">{money(row.amount)}</span> }, { key: 'commission', label: 'Commission', render: row => <span className="font-mono text-brass">{money(row.commission)}</span> }, { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> }]} /></Card></>
}

function TeamView() {
  const [business, setBusiness] = useState('ALL')
  const businesses = ['ALL', ...new Set(fallbackData.team.map(member => member.business))]
  const rows = fallbackData.team.filter(member => business === 'ALL' || member.business === business)
  return <><Header eyebrow="Team management" title="Onboarded business teams" description="Manage the people attached to every business you onboarded." action={<button className="btn btn-primary"><UserPlus className="w-4 h-4" /> Invite member</button>} /><Card><div className="flex flex-wrap items-center justify-between gap-3 mb-5"><div><p className="section-label">Team directory</p><p className="text-xs text-text-m mt-1">{rows.length} members across your onboarded businesses</p></div><select className="input !w-auto !py-2" value={business} onChange={event => setBusiness(event.target.value)}>{businesses.map(item => <option key={item} value={item}>{item === 'ALL' ? 'All businesses' : item}</option>)}</select></div><Rows rows={rows} columns={[{ key: 'name', label: 'Member', render: row => <div><p className="text-text-p font-semibold">{row.name}</p><p className="text-xs text-text-m">Joined {row.joined}</p></div> }, { key: 'business', label: 'Business' }, { key: 'role', label: 'Role' }, { key: 'status', label: 'Status', render: row => <Badge color={row.status === 'ACTIVE' ? 'green' : 'amber'}>{row.status}</Badge> }, { key: 'actions', label: 'Actions', render: () => <button className="btn btn-ghost btn-sm">Manage</button> }]} /></Card></>
}

function ReportsView({ isBusinessOwner = false }) {
  const rows = isBusinessOwner ? auditRows.filter(row => row.business === 'Amina Foods & Provisions') : auditRows
  return <><Header eyebrow="Reports and analytics" title={isBusinessOwner ? 'Business audit report' : 'Audit and analytics'} description={isBusinessOwner ? 'Download the audit trail for your business commerce activity.' : 'Download auditable business activity for your permitted scope.'} action={<button className="btn btn-primary" onClick={() => downloadAudit(rows, isBusinessOwner ? 'business-audit-report.csv' : 'general-business-audit.csv')}><ArrowDownToLine className="w-4 h-4" /> Download {isBusinessOwner ? 'business' : 'general'} audit</button>} /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><StatCard label="Audited businesses" value={isBusinessOwner ? '1' : '128'} icon={ShieldCheck} /><StatCard label="Recorded events" value={rows.length} icon={ClipboardList} /><StatCard label="Sales reviewed" value={money(isBusinessOwner ? 252500 : 591000)} icon={LineChart} /><StatCard label="Report period" value="Sep 2026" icon={FileBarChart} /></div><Card><div className="flex items-center justify-between mb-5"><div><p className="section-label">Audit activity</p><p className="text-xs text-text-m mt-1">Immutable activity records within your access scope.</p></div><Badge color={isBusinessOwner ? 'blue' : 'green'}>{isBusinessOwner ? 'BUSINESS SCOPE' : 'PLATFORM SCOPE'}</Badge></div><Rows rows={rows} columns={[{ key: 'date', label: 'Timestamp' }, { key: 'actor', label: 'Actor' }, { key: 'action', label: 'Activity' }, { key: 'business', label: 'Business' }, { key: 'amount', label: 'Value' }]} /></Card></>
}

export default function SovereignMarketWorkspace() {
  const location = useLocation()
  const role = useAuthStore(state => state.user?.role)
  const isBusinessOwner = role === 'business_owner'
  const view = useMemo(() => location.pathname.split('/').pop().replace(/^incubator-/, ''), [location.pathname])
  if (view === 'wallet') return <WalletView />
  if (view === 'team') return <TeamView />
  if (view === 'reports') return <ReportsView isBusinessOwner={isBusinessOwner} />
  if (view === 'remote-request') return <RequestsView remote />
  if (view === 'prequalified-businesses') return <BusinessesView />
  if (view === 'prequalified-pool') return <BusinessesView pool />
  if (view === 'lookup') return <LookupView />
  if (view === 'income-commissions') return <WalletView />
  return <RequestsView />
}